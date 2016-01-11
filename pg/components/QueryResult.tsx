import * as React from 'react';
import {PgCatalogPgDatabase, PgField, PgQueryResult} from '../index';
import DateTime from '../../components/DateTime';

const Cell = ({value, field}: {value: any, field: PgField}) => {
  if (field.name === 'datname') {
    return <a href={`/pg/${value}/`}>{value}</a>;
  }
  else if (field.name === 'table_name') {
    return <a href={`${value}`}>{value}</a>;
  }
  // type-based
  else if (value === undefined) {
    // ∅ = U+2205 "EMPTY SET"
    return <span title="undefined">∅</span>;
  }
  else if (value === null) {
    // ␀ = U+2400 "SYMBOL FOR NULL"
    return <span title="null">␀</span>;
  }
  else if (Array.isArray(value)) {
    // let children = [{value.map((child, index) => <Cell key={index} value={child} field={field} />)}];
    // return <span className="array">{children}</span>;
    return <span className="array">{JSON.stringify(value)}</span>;
  }
  else if (value instanceof Date) {
    // TODO: also check for stringified dates
    return <DateTime date={value} />;
  }
  else if (typeof value === 'object') {
    return <span className="object">{JSON.stringify(value)}</span>;
  }
  else if (typeof value === 'number') {
    return <span className="number">{String(value)}</span>;
  }
  else if (typeof value === 'boolean') { // field.dataTypeID === 16
    // maybe replace with: ⊨ U+22A8 "TRUE" vs. ⊭ U+22AD "NOT TRUE"
    // return <span>{value ? 'TRUE' : 'FALSE'}</span>;
    // return <span>{value ? '⊨' : '⊭'}</span>;
    return <span className="boolean" title={String(value)}>{value ? '✓' : '✗'}</span>;
  }
  return <span>{String(value)}</span>;
};

// interface QueryResultTableProps {
//   fields: PgField[];
//   rows: any[];
// }

const QueryResultTable = ({fields, rows}: PgQueryResult<any>) => {
  if (rows.length === 0) {
    return <div><b>No results</b></div>;
  }
  // find the interesting fields, i.e., those where the values in each row are
  // not all the same
  const extendedFields = fields.map(field => {
    let prototypeValue = rows[0][field.name];
    let informative = rows.some(row => row[field.name] !== prototypeValue);
    return Object.assign({informative}, field);
  });
  const informativeFields = extendedFields.filter(field => field.informative);
  const uninformativeFields = extendedFields.filter(field => !field.informative);
  return (
    <div>
      <h3 className="hpad">Table ({rows.length} rows)</h3>
      <table className="fill padded lined striped">
        <thead>
          <tr>
            {informativeFields.map(field =>
              <th key={field.columnID} title={`${field.dataTypeID}`}>{field.name}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) =>
            <tr key={i}>
              {informativeFields.map(field =>
                <td key={field.columnID}><Cell value={row[field.name]} field={field} /></td>
              )}
            </tr>
          )}
        </tbody>
      </table>
      {(uninformativeFields.length > 0) && <div className="hpad">
        <h3>Uninformative fields (identical for all rows)</h3>
        <ul>
          {uninformativeFields.map(field => {
            let prototypeValue = rows[0][field.name];
            return (
              <li key={field.columnID} title={`${field.dataTypeID}`}>
                <b>{field.name}</b>: <Cell value={prototypeValue} field={field} />
              </li>
            );
          })}
        </ul>
      </div>}
    </div>
  );
};
QueryResultTable['propTypes'] = {
  fields: React.PropTypes.array.isRequired,
  rows: React.PropTypes.array.isRequired,
};

/**
Wrapper Component with shouldComponentUpdate until stateless functional
components get smarter should-update heuristics.
*/
class QueryResultTableView extends React.Component<PgQueryResult<any>, {}> {
  shouldComponentUpdate(nextProps) {
    const fieldsChanged = nextProps.fields !== this.props.fields;
    const rowsChanged = nextProps.rows !== this.props.rows;
    return fieldsChanged || rowsChanged;
  }
  render() {
    return <QueryResultTable {...this.props} />;
  }
  static propTypes = QueryResultTable['propTypes'];
}

export default QueryResultTableView;

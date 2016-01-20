import * as React from 'react';
import {PgCatalogPgDatabase, PgField, PgQueryResult} from '../index';
const moment = require('moment');

const type_groups = {
  // DATE
  date: new Set([1082]),
  // TIME
  time: new Set([1083]),
  // TIMESTAMP, and TIMESTAMPTZ
  datetime: new Set([1114, 1184]),
}

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
  else if (type_groups.date.has(field.dataTypeID)) {
    // moment parsing and formatting is vacuous in this case
    return <time dateTime={value}>{moment(value).format('YYYY-MM-DD')}</time>;
  }
  else if (type_groups.time.has(field.dataTypeID)) {
    return <time dateTime={value}>{value}</time>;
  }
  else if (type_groups.datetime.has(field.dataTypeID)) {
    return <time dateTime={value}>{moment(value).format('YYYY-MM-DD h:mm A')}</time>;
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

interface QueryResultProps extends PgQueryResult<any> {
  sql?: string;
}

const QueryResultTable = ({fields, rows, sql}: QueryResultProps) => {
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
      <div className="hpad flex-fill">
        <h3>Table ({rows.length} rows)</h3>
        {sql && <div><a href={`repl/?sql=${sql}`}>repl</a></div>}
      </div>
      <table className="fill padded lined striped">
        <thead>
          <tr>
            {informativeFields.map(field =>
              <th key={field.name} title={`${field.dataTypeID}`}>{field.name}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) =>
            <tr key={i}>
              {informativeFields.map(field =>
                <td key={field.name}><Cell value={row[field.name]} field={field} /></td>
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
              <li key={field.name} title={`${field.dataTypeID}`}>
                <b>{field.name}</b>: <Cell value={prototypeValue} field={field} />
              </li>
            );
          })}
        </ul>
      </div>}
      <h3 className="hpad">All fields</h3>
      <table className="fill padded lined striped">
        <thead>
          <tr>
            <th>name</th>
            <th>tableID</th>
            <th>columnID</th>
            <th>dataTypeID</th>
            <th>dataTypeSize</th>
            <th>dataTypeModifier</th>
            <th>format</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(({name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format}) =>
            <tr key={name}>
              <td>{name}</td>
              <td>{tableID}</td>
              <td>{columnID}</td>
              <td>{dataTypeID}</td>
              <td>{dataTypeSize}</td>
              <td>{dataTypeModifier}</td>
              <td>{format}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
QueryResultTable['propTypes'] = {
  fields: React.PropTypes.array.isRequired,
  rows: React.PropTypes.array.isRequired,
  sql: React.PropTypes.string,
};

/**
Wrapper Component with shouldComponentUpdate until stateless functional
components get smarter should-update heuristics.
*/
class QueryResultTableView extends React.Component<QueryResultProps, {}> {
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

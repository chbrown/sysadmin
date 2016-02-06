import * as React from 'react';
import {PgCatalogPgDatabase, PgField, PgQueryResult} from '../index';
const moment = require('moment');

const type_groups = {
  // DATE
  date: new Set([1082]),
  // TIME
  time: new Set([1083]),
  // TIMESTAMP, TIMESTAMPTZ
  datetime: new Set([1114, 1184]),
  // FLOAT4, FLOAT8, MONEY, NUMERIC
  numeric: new Set([700, 701, 790, 1700]),
};

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
  else if (type_groups.numeric.has(field.dataTypeID)) {
    // TODO: add configuration option for floating point precision
    return <span className="number">{Number(value).toFixed(3)}</span>;
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
  return <span className="any">{String(value)}</span>;
};

function copyTable(rows: any[][], tsv = rows.map(cells => cells.join('\t')).join('\n')) {
  const copyCommandSupported = document.queryCommandSupported('copy');
  if (!copyCommandSupported) {
    throw new Error('copy command is not supported');
  }
  const textArea = document.createElement('textarea');
  textArea.value = tsv;
  document.body.appendChild(textArea);
  textArea.select();

  function onCopy(ev) {
    ev.preventDefault();
    ev['clipboardData'].setData('application/json', rows);
    ev['clipboardData'].setData('text/tab-separated-values', tsv);
    ev['clipboardData'].setData('Text', tsv);
  }
  window.addEventListener('copy', onCopy);
  const success = document.execCommand('copy');
  window.removeEventListener('copy', onCopy);
  if (!success) {
    throw new Error('copy command was unsuccessful');
  }

  document.body.removeChild(textArea);
}

interface QueryResultProps extends PgQueryResult<any> {
  sql?: string;
  totalRowCount?: number | string;
  timeElapsed?: number;
}
const QueryResultPropTypes: React.ValidationMap<any> = {
  fields: React.PropTypes.array.isRequired,
  rows: React.PropTypes.array.isRequired,
  sql: React.PropTypes.string,
  totalRowCount: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
  timeElapsed: React.PropTypes.number,
};

/**
Wrapper Component with shouldComponentUpdate until stateless functional
components get smarter should-update heuristics.
*/
class QueryResultTable extends React.Component<QueryResultProps, {}> {
  shouldComponentUpdate(nextProps) {
    const fieldsChanged = nextProps.fields !== this.props.fields;
    const rowsChanged = nextProps.rows !== this.props.rows;
    return fieldsChanged || rowsChanged;
  }
  onCopyClick(ev: Event) {
    const fieldNames = this.props.fields.map(field => field.name);
    const rows = this.props.rows.map(row => {
      return fieldNames.map(fieldName => row[fieldName]);
    });
    copyTable([fieldNames, ...rows]);
  }
  render() {
    const {fields, rows, sql, totalRowCount, timeElapsed} = this.props;

    if (rows.length === 0) {
      return <div className="hpad vpad"><b>No results</b></div>;
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
          <h3>Table ({rows.length}{totalRowCount && `/${totalRowCount}`} rows)</h3>
          <span><button onClick={this.onCopyClick.bind(this)}>Copy</button></span>
          {timeElapsed && <div>Time: {timeElapsed} ms</div>}
          {sql && <div><a href={`repl/?sql=${sql}`}>repl</a></div>}
        </div>
        <div className="pg-result-container">
          <table className="fill padded lined striped pg-result">
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
        </div>
        {(uninformativeFields.length > 0) && <div className="hpad">
          <h3>Uninformative fields (identical for all rows)</h3>
          <ul>
            {uninformativeFields.map(field => {
              let prototypeValue = rows[0][field.name];
              return (
                <li key={field.name}>
                  <b>{field.name}</b>: <Cell value={prototypeValue} field={field} />
                </li>
              );
            })}
          </ul>
        </div>}
        <details className="vpad">
          <summary className="hpad"><b>Result fields</b></summary>
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
        </details>
      </div>
    );
  }
  static propTypes = QueryResultPropTypes;
}

export default QueryResultTable;

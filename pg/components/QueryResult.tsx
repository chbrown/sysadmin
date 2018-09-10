import * as React from 'react'
import * as PropTypes from 'prop-types'

import {Field, QueryResult} from 'pg-meta/types'
import {bind} from '../../util'
import {regtypes, type_groups} from '../util'

const Cell = ({value, field}: {value: any, field: Field}) => {
  if (field.name === 'datname') {
    return <a href={`/pg/${value}/`}>{value}</a>
  }
  else if (field.name === 'table_name') {
    return <a href={`${value}`}>{value}</a>
  }
  // type-based
  else if (value === undefined) {
    // ∅ = U+2205 "EMPTY SET"
    return <span title="undefined">∅</span>
  }
  else if (value === null) {
    // ␀ = U+2400 "SYMBOL FOR NULL"
    return <span title="null">␀</span>
  }
  else if (Array.isArray(value)) {
    // const children = [{value.map((child, index) => <Cell key={index} value={child} field={field} />)}]
    // return <span className="array">{children}</span>
    return <span className="array">{JSON.stringify(value)}</span>
  }
  else if (type_groups.date.has(field.dataTypeID)) {
    const date = new Date(value)
    const dateString = date.toISOString().slice(0, 10)
    return <time dateTime={value}>{dateString}</time>
  }
  else if (type_groups.time.has(field.dataTypeID)) {
    return <time dateTime={value}>{value}</time>
  }
  else if (type_groups.timestamp.has(field.dataTypeID)) {
    // value will still be a raw string, as returned from the PostgreSQL server,
    // since api.ts resets the typeParser for all the timestamp fields
    const date = new Date(value)
    const isoString = date.toISOString()
    const dateString = isoString.slice(0, 10)
    const timeString = isoString.slice(11, 19)
    return <time dateTime={isoString}>{dateString} {timeString}</time>
  }
  else if (type_groups.numeric.has(field.dataTypeID)) {
    // TODO: add configuration option for floating point precision
    return <span className="number">{Number(value).toFixed(5)}</span>
  }
  else if (typeof value === 'object') {
    return <span className="object">{JSON.stringify(value)}</span>
  }
  else if (typeof value === 'number') {
    return <span className="number">{String(value)}</span>
  }
  else if (typeof value === 'boolean') { // field.dataTypeID === 16
    // maybe replace with: ⊨ U+22A8 "TRUE" vs. ⊭ U+22AD "NOT TRUE"
    // return <span>{value ? 'TRUE' : 'FALSE'}</span>
    // return <span>{value ? '⊨' : '⊭'}</span>
    return <span className="boolean" title={String(value)}>{value ? '✓' : '✗'}</span>
  }
  return <span className="any">{String(value)}</span>
}

function copyTable(rows: any[][], tsv = rows.map(cells => cells.join('\t')).join('\n')) {
  const copyCommandSupported = document.queryCommandSupported('copy')
  if (!copyCommandSupported) {
    throw new Error('copy command is not supported')
  }
  const textArea = document.createElement('textarea')
  textArea.value = tsv
  document.body.appendChild(textArea)
  textArea.select()

  function onCopy(ev) {
    ev.preventDefault()
    ev.clipboardData.setData('application/json', rows)
    ev.clipboardData.setData('text/tab-separated-values', tsv)
    ev.clipboardData.setData('Text', tsv)
  }
  window.addEventListener('copy', onCopy)
  const success = document.execCommand('copy')
  window.removeEventListener('copy', onCopy)
  if (!success) {
    throw new Error('copy command was unsuccessful')
  }

  document.body.removeChild(textArea)
}

interface QueryResultProps {
  // is there some way to say something like:
  //   Pick<QueryResult<any>, 'rows' | 'fields'>
  rows: any[]
  fields: Field[]
  sql?: string
  totalRowCount?: number | string
  timeElapsed?: number
}

/**
Wrapper Component with shouldComponentUpdate until stateless functional
components get smarter should-update heuristics.
*/
class QueryResultTable extends React.Component<QueryResultProps> {
  shouldComponentUpdate(nextProps) {
    const fieldsChanged = nextProps.fields !== this.props.fields
    const rowsChanged = nextProps.rows !== this.props.rows
    return fieldsChanged || rowsChanged
  }
  @bind
  onCopyClick(ev: React.MouseEvent) {
    const fieldNames = this.props.fields.map(field => field.name)
    const rows = this.props.rows.map(row => {
      return fieldNames.map(fieldName => row[fieldName])
    })
    copyTable([fieldNames, ...rows])
  }
  render() {
    const {fields, rows, sql, totalRowCount, timeElapsed} = this.props

    if (rows.length === 0) {
      return <div className="hpad vpad"><b>No results</b></div>
    }
    // find the interesting fields, i.e., those where the values in each row are
    // not all the same
    const extendedFields = fields.map(field => {
      const prototypeValue = rows[0][field.name]
      // TODO: allow short-circuiting if global config disables auto-hiding
      // uninformative fields (which will have to be in a cookie or stored on
      // the server somewhere for isomorphic rendering to work properly)
      const informative = rows.some(row => row[field.name] !== prototypeValue)
      return Object.assign({informative}, field)
    })
    const informativeFields = extendedFields.filter(field => field.informative)
    const uninformativeFields = extendedFields.filter(field => !field.informative)
    return (
      <div>
        <div className="hpad flex-fill">
          <h3>Table ({rows.length}{totalRowCount && `/${totalRowCount}`} rows)</h3>
          <span><button onClick={this.onCopyClick}>Copy</button></span>
          {timeElapsed && <div>Time: {timeElapsed} ms</div>}
          {sql && <div><a href={`repl/?sql=${sql}`}>repl</a></div>}
        </div>
        <div className="pg-result-container">
          <table className="fill padded lined striped pg-result">
            <thead>
              <tr>
                {informativeFields.map(field =>
                  <th key={field.name} title={regtypes.get(field.dataTypeID)}>{field.name}</th>
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
              const prototypeValue = rows[0][field.name]
              return (
                <li key={field.name}>
                  <b>{field.name}</b>: <Cell value={prototypeValue} field={field} />
                </li>
              )
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
                <th>regtype</th>
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
                  <td>{regtypes.get(dataTypeID)}</td>
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
    )
  }
  static propTypes: React.ValidationMap<QueryResultProps> = {
    fields: PropTypes.array.isRequired,
    rows: PropTypes.array.isRequired,
    sql: PropTypes.string,
    totalRowCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    timeElapsed: PropTypes.number,
  }
}

export default QueryResultTable

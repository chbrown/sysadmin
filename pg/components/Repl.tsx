import * as React from 'react';
import {PgCatalogPgDatabase, PgQueryResult} from '../index';
import DateTime from '../../components/DateTime';
import QueryResult from './QueryResult';

// TODO: fix this hack
// let storage = (typeof localStorage === 'undefined') ? {} : localStorage;

function checkStatus<R extends Response>(response: R): Promise<R> {
  if (response.status < 200 || response.status > 299) {
    let error = new Error(`HTTP ${response.status}`);
    error['response'] = response;
    return Promise.reject<R>(error);
  }
  return Promise.resolve(response);
}

// Component's state (S) type should have all optional fields; the setState
// definition requires a full state, which is overrestrictive, but all-optional
// fields is an easy workaround.
class Repl extends React.Component<{}, {sql?: string, variables?: string, queryResult?: PgQueryResult<any>, errorMessage?: any}> {
  // uggh, can't set state at the class level since then it overrides the S type parameter
  constructor() {
    super();
    this.state = {sql: '', variables: '[]'};
  }
  /** only gets invoked on the client */
  componentDidMount() {
    this.setState({
      sql: localStorage['sql'] || '',
      variables: localStorage['variables'] || '[]',
    });
  }
  onInputChange(key, ev) {
    let value = ev.target.value;
    this.setState({[key]: value});
    localStorage[key] = value;
  }
  onSubmit(ev) {
    ev.preventDefault(); // prevent form submission
    let {sql} = this.state;
    let variables = JSON.parse(this.state.variables);
    fetch('../query', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({sql, variables}),
    })
    .then(response => response.json().then(content => Object.assign(response, {content})))
    .then(checkStatus)
    .then(response => {
      this.setState({errorMessage: undefined, queryResult: response.content});
    })
    .catch(error => {
      let errorMessage = error.message;
      if (error.response && error.response.content) {
        errorMessage += ': ' + error.response.content.message;
      }
      this.setState({errorMessage, queryResult: undefined});
    });
  }
  render() {
    return (
      <div>
        <h3 className="hpad">Repl</h3>
        <form onSubmit={this.onSubmit.bind(this)} className="hpad">
          <label>
            <div><b>SQL</b></div>
            <textarea style={{minHeight: '100px'}}
              value={this.state.sql} onChange={this.onInputChange.bind(this, 'sql')} />
          </label>
          <label>
            <div><b>Variables</b></div>
            <textarea value={this.state.variables} onChange={this.onInputChange.bind(this, 'variables')} />
          </label>
          <div><button>Submit</button></div>
        </form>
        {(this.state.queryResult !== undefined) && <QueryResult {...this.state.queryResult} />}
        {(this.state.errorMessage !== undefined) &&
          <div><h3 className="hpad">Error</h3><p>{this.state.errorMessage}</p></div>
        }
      </div>
    );
  }
}
export default Repl;

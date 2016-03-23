import * as React from 'react';

import {PgDatabase} from 'pg-meta/pg_catalog';
import {QueryResult} from 'pg-meta/types';
import {bind, fetchJSON} from '../../util';
import QueryResultView from './QueryResult';

function encodeURIValue(raw: string) {
  return encodeURIComponent(raw).replace(/%20/g, '+');
}

interface ReplProps {
  database: string;
  sql?: string;
  variablesJSON?: string;
}
interface ReplState {
  queryResult?: QueryResult<any>;
  errorMessage?: any;
  sql?: string;
  /** the string representation of the variables/arguments passed to the SQL query */
  variablesJSON?: string;
}
class Repl extends React.Component<ReplProps, ReplState> {
  constructor(props: ReplProps) {
    super(props);
    const {sql, variablesJSON} = props;
    this.state = {sql, variablesJSON};
  }
  currentPath() {
    let {sql, variablesJSON} = this.state;
    return `/pg/${this.props.database}/repl/?sql=${encodeURIValue(sql)}&variablesJSON=${encodeURIValue(variablesJSON)}`;
  }
  @bind
  onInputChange(ev: React.FormEvent) {
    const inputElement = ev.target as HTMLInputElement;
    const key = inputElement.name;
    const value = inputElement.value;
    this.setState({[key]: value});
  }
  @bind
  onKeyDown(ev: React.KeyboardEvent) {
    if (ev.metaKey && ev.keyCode == 13) { // ⌘+enter
      this.onSubmit(ev);
    }
  }
  @bind
  onSubmit(ev: React.FormEvent) {
    ev.preventDefault(); // prevent form submission
    this.setState({errorMessage: undefined});
    let {sql, variablesJSON} = this.state;
    // let's try this: don't persist to URL while typing, but only when running a query (in onSubmit)
    const {history}: {history: HistoryModule.History} = this.context as any;
    const newPath = this.currentPath();
    history.push(newPath);
    let variables: any[] = JSON.parse(variablesJSON);
    fetchJSON('../query', {method: 'POST', body: {sql, variables}})
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
    const {sql, variablesJSON} = this.state;
    const currentPath = this.currentPath();
    return (
      <div>
        <div className="hpad flex-fill">
          <h3>Repl</h3>
          <a href={currentPath}>url</a>
        </div>
        <form onSubmit={this.onSubmit} className="hpad" onKeyDown={this.onKeyDown}>
          <label>
            <div><b>SQL</b></div>
            <textarea rows={6} style={{width: '100%'}} name="sql"
              value={sql} onChange={this.onInputChange} />
          </label>
          <label>
            <div><b>Variables</b></div>
            <textarea rows={1} style={{width: '100%'}} name="variablesJSON"
              value={variablesJSON} onChange={this.onInputChange} />
          </label>
          <div><button>Submit (⌘⏎)</button></div>
        </form>
        {(this.state.queryResult !== undefined) && <QueryResultView {...this.state.queryResult} />}
        {(this.state.errorMessage !== undefined) &&
          <div className="hpad"><h3>Error</h3><p>{this.state.errorMessage}</p></div>
        }
      </div>
    );
  }
  static contextTypes = {
    history: React.PropTypes.object,
    location: React.PropTypes.object,
  }
  static defaultProps = {
    sql: '',
    variablesJSON: '[]',
  }
}
export default Repl;

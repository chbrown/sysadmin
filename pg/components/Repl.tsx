import * as React from 'react';

import {PgCatalogPgDatabase, PgQueryResult} from '../index';
import {bind, fetchJSON} from '../../util';
import QueryResult from './QueryResult';

interface ReplProps {
  database: string;
  sql?: string;
  variablesJSON?: string;
}
interface ReplState {
  queryResult?: PgQueryResult<any>;
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
  pushHistory(sql: string, variablesJSON: string) {
    const {history}: {history: HistoryModule.History} = this.context as any;
    const newLocation = `/pg/${this.props.database}/repl/?sql=${encodeURIComponent(sql)}&variablesJSON=${encodeURIComponent(variablesJSON)}`;
    // console.log('push newLocation', newLocation);
    history.push(newLocation);
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
  onSubmit(ev) {
    ev.preventDefault(); // prevent form submission
    this.setState({errorMessage: undefined});
    let {sql, variablesJSON} = this.state;
    // let's try this: don't persist to URL while typing, but only when running a query (in onSubmit)
    this.pushHistory(sql, variablesJSON);
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
    return (
      <div>
        <form onSubmit={this.onSubmit.bind(this)} className="hpad" onKeyDown={this.onKeyDown}>
          <h3>Repl</h3>
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
        {(this.state.queryResult !== undefined) && <QueryResult {...this.state.queryResult} />}
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

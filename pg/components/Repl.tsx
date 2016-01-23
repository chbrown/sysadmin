import * as React from 'react';

import {PgCatalogPgDatabase, PgQueryResult} from '../index';
import {fetchJSON} from '../../util';
import QueryResult from './QueryResult';

interface ReplProps {
  database: string;
  sql?: string;
  variables?: string;
}
// Component's state (S) type should have all optional fields; the setState
// definition requires a full state, which is overrestrictive, but all-optional
// fields is an easy workaround.
interface ReplState {
  queryResult?: PgQueryResult<any>;
  errorMessage?: any;
}
class Repl extends React.Component<ReplProps, ReplState> {
  _pushHistory_timeout: any;
  // uggh, can't set state at the class level since then it overrides the S type parameter
  constructor(props) {
    super(props);
    this.state = {};
  }
  pushHistory(sql: string, variables: string) {
    // debounce at trailing end of 100ms
    if (this._pushHistory_timeout) {
      clearTimeout(this._pushHistory_timeout);
    }
    this._pushHistory_timeout = setTimeout(() => {
      const {history}: {history: HistoryModule.History} = this.context as any;
      const newLocation = `/pg/${this.props.database}/repl/?sql=${encodeURIComponent(sql)}&variables=${encodeURIComponent(variables)}`;
      console.log('push newLocation', newLocation);
      history.push(newLocation);
      this._pushHistory_timeout = undefined;
    }, 100);
  }
  onInputChange(key, ev) {
    let value = ev.target.value;
    const {sql, variables} = Object.assign({}, this.props, {[key]: value});
    // persist to URL
    this.pushHistory(sql, variables);
  }
  onKeyDown(ev: React.KeyboardEvent) {
    if (ev.metaKey && ev.keyCode == 13) {
      this.onSubmit(ev);
    }
  }
  onSubmit(ev) {
    ev.preventDefault(); // prevent form submission
    this.setState({errorMessage: undefined});
    let {sql} = this.props;
    let variables = JSON.parse(this.props.variables);
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
    // Using defaultValue instead of value, below, since roundtrip through URL
    // spans across different event loop frames, which breaks UX
    const {sql, variables} = this.props;
    return (
      <div>
        <h3 className="hpad">Repl</h3>
        <form onSubmit={this.onSubmit.bind(this)} className="hpad" onKeyDown={this.onKeyDown.bind(this)}>
          <label>
            <div><b>SQL</b></div>
            <textarea style={{minHeight: '200px', width: '100%'}}
              defaultValue={sql} onChange={this.onInputChange.bind(this, 'sql')} />
          </label>
          <label>
            <div><b>Variables</b></div>
            <textarea rows={1} style={{width: '100%'}}
              defaultValue={variables} onChange={this.onInputChange.bind(this, 'variables')} />
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
    variables: '[]',
  }
}
export default Repl;

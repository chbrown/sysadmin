import * as React from 'react';
import {Relation, RelationAttribute} from 'pg-meta/types';

import {bind} from '../../util';
import Table from './Table';

interface InputProps {
  name: string;
  label: string;
}
class StoredCheckbox extends React.Component<InputProps, {checked: boolean}> {
  constructor(props) {
    super(props);
    this.state = {checked: true};
  }
  componentDidMount() {
    const checked = localStorage.getItem(this.props.name) !== 'false';
    this.setState({checked});
  }
  @bind
  onChange(ev: React.FormEvent) {
    const {checked} = ev.target as HTMLInputElement;
    localStorage.setItem(this.props.name, String(checked));
    this.setState({checked});
  }
  render() {
    const {name, label} = this.props;
    return (
      <label>
        <input type="checkbox" onChange={this.onChange} checked={this.state.checked} />
        <span>{label}</span>
      </label>
    );
  }
}

interface DatabaseProps {
  relations: Relation[];
}
class Database extends React.Component<DatabaseProps, {enabledRelkinds: Set<string>}> {
  constructor(props: DatabaseProps) {
    super(props);
    const enabledRelkinds = new Set(props.relations.map(({relkind}) => relkind));
    this.state = {enabledRelkinds};
  }
  componentDidMount() {
    const {relations} = this.props;
    const relkinds = new Set(relations.map(({relkind}) => relkind));
    const enabledRelkinds = new Set([...relkinds].filter(relkind => {
      return localStorage.getItem(relkind) !== 'false';
    }));
    this.setState({enabledRelkinds});
  }
  render() {
    const {relations} = this.props;
    const {enabledRelkinds} = this.state;
    const relkinds = new Set(relations.map(({relkind}) => relkind));
    return (
      <div className="database">
        <nav className="left">
          <div>
            {[...relkinds].map(relkind =>
              <div key={relkind}>
                <StoredCheckbox name={relkind} label={relkind} />
              </div>
            )}
          </div>
          <div>
            <a href="repl/">repl</a>
          </div>
        </nav>
        <main>
          {relations.filter(({relkind}) => enabledRelkinds.has(relkind)).map(relation =>
            <Table key={relation.relname} {...relation} />
          )}
        </main>
      </div>
    );
  }
  static propTypes: React.ValidationMap<any> = {
    relations: React.PropTypes.array.isRequired,
  };
}

export default Database;

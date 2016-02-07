import * as React from 'react';
import {Relation, RelationAttribute} from '../index';
import Table from './Table';

interface DatabaseProps {
  relations: Relation[];
}
const Database = ({relations}: DatabaseProps) => (
  <div className="database">
    <nav className="left">
      {relations.map(relation =>
        <div key={relation.relname}>
          <label className="flex">
            {/* bizarrely, checkboxes in a overfilled flex will shrink (!?) if not wrapped in a block element */}
            <div><input type="checkbox" /></div>
            <span>{relation.relname}</span>
          </label>
        </div>
      )}
      <div>
        <a href="repl/">repl</a>
      </div>
    </nav>
    <main>
      {relations.map(relation =>
        <Table key={relation.relname} {...relation} />
      )}
    </main>
  </div>
);
Database['propTypes'] = {
  relations: React.PropTypes.array.isRequired,
};
export default Database;

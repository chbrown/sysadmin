import * as React from 'react';
import {InformationSchemaTable, InformationSchemaColumn} from '../index';
import Table, {Reference} from './Table';

interface DatabaseProps {
  tables: InformationSchemaTable[];
  columns: InformationSchemaColumn[];
  references: Reference[];
}
const Database = ({tables, columns, references}: DatabaseProps) => (
  <div className="database">
    <nav className="left">
      {tables.map(table =>
        <div key={table.table_name}>
          <label className="flex">
            {/* bizarrely, checkboxes in a overfilled flex will shrink (!?) if not wrapped in a block element */}
            <div><input type="checkbox" /></div>
            <span>{table.table_name}</span>
          </label>
        </div>
      )}
      <div>
        <a href="repl/">repl</a>
      </div>
    </nav>
    <main>
      {tables.map(table =>
        <Table key={table.table_name}
          table={table}
          references={references.filter(reference => reference.table_name == table.table_name)}
          columns={columns.filter(column => column.table_name == table.table_name)} />
      )}
    </main>
  </div>
);
Database['propTypes'] = {
  tables: React.PropTypes.array.isRequired,
};
export default Database;

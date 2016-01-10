import * as React from 'react';
import {InformationSchemaTable, InformationSchemaColumn} from '../index';
import Table from './Table';

const Database = ({tables, columns}:
                  {tables: InformationSchemaTable[], columns: InformationSchemaColumn[]}) => (
  <div className="database">
    <nav className="left">
      {tables.map(table =>
        <div key={table.table_name}>
          <label>
            <input type="checkbox" />{' '}<span>{table.table_name}</span>
          </label>
        </div>
      )}
    </nav>
    <main>
      {tables.map(table =>
        <Table key={table.table_name} table={table}
          columns={columns.filter(column => column.table_name == table.table_name)} />
      )}
    </main>
  </div>
);
Database['propTypes'] = {
  tables: React.PropTypes.array.isRequired,
};
export default Database;

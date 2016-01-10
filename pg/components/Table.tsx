import * as React from 'react';
import {InformationSchemaTable, InformationSchemaColumn} from '../index';

const Table = ({table, columns}: {table: InformationSchemaTable, columns: InformationSchemaColumn[]}) => {
  return (
    <div className="pg-table">
      <div className="name">
        <a href={table.table_name}>{table.table_name}</a>
      </div>
      <table className="lined striped">
        <thead>
          <tr>
            <th>column</th>
            <th>type</th>
            <th>null / not null</th>
            <th>default</th>
          </tr>
        </thead>
        <tbody>
          {columns.map(column =>
            <tr key={column.column_name}>
              <td>{column.column_name}</td>
              <td>{column.data_type}</td>
              <td>{(column.is_nullable === 'YES') ? 'NULL' : 'NOT NULL'}</td>
              <td>{/^nextval/.test(column.column_default) ? 'AUTOINC' : column.column_default}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
Table['propTypes'] = {
  table: React.PropTypes.any.isRequired,
  columns: React.PropTypes.array.isRequired,
};
export default Table;

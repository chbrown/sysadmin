import * as React from 'react';
import {InformationSchemaTable, InformationSchemaColumn, InformationSchemaReferentialConstraint} from '../index';

export interface Reference {
  table_name: string;
  column_name: string;
  unique_table_name: string;
  unique_column_name: string;
}

interface TableProps {
  table: InformationSchemaTable;
  columns: InformationSchemaColumn[];
  references: Reference[];
}
const Table = ({table, columns, references}: TableProps) => {
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
            <th>refs</th>
          </tr>
        </thead>
        <tbody>
          {columns.map(column =>
            <tr key={column.column_name}>
              <td>{column.column_name}</td>
              <td>{column.data_type}</td>
              <td>{(column.is_nullable === 'YES') ? 'NULL' : 'NOT NULL'}</td>
              <td>{/^nextval/.test(column.column_default) ? 'AUTOINC' : column.column_default}</td>
              <td>
                {references.filter(reference => reference.column_name == column.column_name).map((reference, i) =>
                  <div key={i}>→ {reference.unique_table_name}({reference.unique_column_name})</div>
                )}
              </td>
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
  constraints: React.PropTypes.array.isRequired,
};
export default Table;

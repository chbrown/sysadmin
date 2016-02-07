import * as React from 'react';
import {Relation, RelationAttribute} from '../index';

const Table = ({relname, relkind, attributes, constraints}: Relation) => {
  const showDefault = attributes.some(attribute => attribute.adsrc !== null);
  const refConstraints = constraints.filter(constraint => constraint.contype == 'foreign key constraint');
  const showRefs = refConstraints.length > 0;
  return (
    <div className="pg-table">
      <header className="flex-fill">
        <span><a href={relname} title="table_name">{relname}</a></span>
        <span title="table_type">{relkind}</span>
      </header>
      <table className="fill lined striped">
        <thead>
          <tr>
            <th>column</th>
            <th>type</th>
            <th>null / not null</th>
            {showDefault && <th>default</th>}
            {showRefs && <th>refs</th>}
          </tr>
        </thead>
        <tbody>
          {attributes.map(attribute =>
            <tr key={attribute.attname}>
              <td>{attribute.attname}</td>
              <td>{attribute.atttyp}</td>
              <td>{attribute.attnotnull ? 'NOT NULL' : 'NULL'}</td>
              {showDefault &&
                <td>
                  {/^nextval/.test(attribute.adsrc) ? 'AUTOINC' : attribute.adsrc}
                </td>}
              {showRefs &&
                <td>
                  {refConstraints.filter(constraint => new Set(constraint.conkey).has(attribute.attnum)).map(refConstraint =>
                    <div key={refConstraint.conname}>→ {refConstraint.confrelname}({refConstraint.fkeyattnames})</div>
                  )}
                </td>}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
Table['propTypes'] = {
  relkind: React.PropTypes.string.isRequired,
  relname: React.PropTypes.string.isRequired,
  attributes: React.PropTypes.array.isRequired,
};
export default Table;

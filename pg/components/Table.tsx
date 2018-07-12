import * as React from 'react';
import * as PropTypes from 'prop-types';
import {Relation, RelationAttribute} from 'pg-meta/types';
import {regtypes} from '../util';

const RelationType = ({atttypid, atttypmod}: RelationAttribute) => {
  const name = regtypes.get(Number(atttypid));
  return <span>{name}{(atttypmod !== -1) && <sup>mod={atttypmod}</sup>}</span>;
};

class Table extends React.Component<Relation, {}> {
  render() {
    const {relname, relkind, attributes, constraints} = this.props;
    const showDefault = attributes.some(attribute => attribute.adsrc !== null);
    // constraints might be null if there were none
    const refConstraints = (constraints || []).filter(constraint => constraint.contype == 'foreign key constraint');
    const showRefs = refConstraints.length > 0;
    return (
      <div className="pg-table">
        <header className="flex-fill">
          <span><a href={relname} title="relation_name">{relname}</a></span>
          <span title="relation_kind">{relkind}</span>
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
                <td>
                  <RelationType {...attribute} />
                </td>
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
  }
  static propTypes: React.ValidationMap<any> = {
    relkind: PropTypes.string.isRequired,
    relname: PropTypes.string.isRequired,
    attributes: PropTypes.array.isRequired,
  };
}

export default Table;

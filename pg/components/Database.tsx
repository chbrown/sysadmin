import * as React from 'react'
import * as PropTypes from 'prop-types'
import {Relation, RelationAttribute} from 'pg-meta/types'

import {bind} from '../../util'
import {connectCookies, ConnectedCookiesProps, CookiesPropTypes} from '../../cookies'

import StoredCheckbox from '../../components/StoredCheckbox'

import Table from './Table'

interface DatabaseProps extends ConnectedCookiesProps {
  relations: Relation[]
}
class Database extends React.Component<DatabaseProps> {
  render() {
    const {relations, cookies} = this.props
    const relkinds = new Set(relations.map(({relkind}) => relkind))
    const enabledRelkinds = new Set([...relkinds].filter(relkind => {
      return cookies[relkind] !== 'false'
    }))
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
    )
  }
  static propTypes: React.ValidationMap<DatabaseProps> = {
    relations: PropTypes.array.isRequired,
    cookies: CookiesPropTypes,
  }
}
const ConnectedDatabase = connectCookies<DatabaseProps>()(Database)

export default ConnectedDatabase

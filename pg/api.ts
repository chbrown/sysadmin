import * as pg from 'pg';
import {inspect} from 'util';

import {relations, count} from 'pg-meta';
import {ConnectionConfig, QueryResult, Field,
  RelationAttribute, RelationConstraint, Relation} from 'pg-meta/types';
import {PgDatabase} from 'pg-meta/pg_catalog';

const identity: <T>(t: T) => T = (value) => value;
// disable automatic parsing (https://github.com/brianc/node-pg-types/blob/v1.10.0/lib/textParsers.js)
pg.types.setTypeParser(1082, identity); // DATE
pg.types.setTypeParser(1114, identity); // TIMESTAMP
pg.types.setTypeParser(1184, identity); // TIMESTAMPTZ
pg.types.setTypeParser(1115, identity); // TIMESTAMP[]
pg.types.setTypeParser(1182, identity); // DATE[]
pg.types.setTypeParser(1185, identity); // TIMESTAMPTZ[]

/**
When supplying variables in a SQL query use 1-indexed $N placeholders. E.g.:

query(config, 'SELECT * FROM users WHERE id = $1', [1])

timeElapsed is returned in integer milliseconds
*/
export async function query<T>(config: ConnectionConfig,
                               queryText: string,
                               values: any[] = []): Promise<QueryResult<T> & {timeElapsed: number}> {
  return new Promise<QueryResult<T> & {timeElapsed: number}>((resolve, reject) => {
    const timeStarted = Date.now();
    pg.connect(config, (connectError, client, done) => {
      if (connectError) {
        done(connectError);
        return reject(connectError);
      }
      console.info(`pg:query config=${inspect(config)} sql="${queryText}" values=${inspect(values)}`);
      client.query(queryText, values, (queryError: Error, result: QueryResult<T>) => {
        // calling done() with a truthy value triggers removal of the client
        // from the client pool, just to be safe
        if (queryError) {
          done(queryError);
          return reject(queryError);
        }
        done();
        resolve(Object.assign(result, {timeElapsed: Date.now() - timeStarted}));
      });
    });
  });
}

const defaultClientConfig = {host: '127.0.0.1', port: 5432, database: 'postgres'};

/**
All values of api should take a single configuration / request object and return a Promise
*/
const api = {
  /**
  Return a list of the databases accessible in the given PostgreSQL server.
  */
  async databases(params: ConnectionConfig = {}) {
    const config = Object.assign({}, defaultClientConfig, params);
    return query<PgDatabase>(config, 'SELECT * FROM pg_catalog.pg_database ORDER BY datname');
  },
  /**
  params should contain a {database: string} entry

  Maybe add to WHERE: pg_catalog.pg_table_is_visible(oid)
  */
  async relations(params: ConnectionConfig & {database: string}): Promise<Relation[]> {
    const config = Object.assign({}, defaultClientConfig, params);
    return relations(config);
  },
  /**
  Vulnerable to SQL injection via the 'table' argument.
  */
  async count(params: ConnectionConfig & {table: string}) {
    const config = Object.assign({}, defaultClientConfig, params);
    return count(config, params.table);
  },
  /**
  Execute an arbitrary SQL query and return the result.

  Super vulnerable to SQL injection! Like, that's the whole point!
  */
  async query<T>(params: ConnectionConfig & {sql: string, variables: any[]}) {
    const config = Object.assign({}, defaultClientConfig, params);
    return query<T>(config, config.sql, config.variables);
  },
};
export default api;

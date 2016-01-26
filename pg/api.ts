import * as pg from 'pg';
import {connect} from 'pg';
import {inspect} from 'util';

const identity: <T>(t: T) => T = (value) => value;
// disable automatic parsing (https://github.com/brianc/node-pg-types/blob/v1.10.0/lib/textParsers.js)
pg['types'].setTypeParser(1082, identity); // DATE
pg['types'].setTypeParser(1114, identity); // TIMESTAMP
pg['types'].setTypeParser(1184, identity); // TIMESTAMPTZ
pg['types'].setTypeParser(1115, identity); // TIMESTAMP[]
pg['types'].setTypeParser(1182, identity); // DATE[]
pg['types'].setTypeParser(1185, identity); // TIMESTAMPTZ[]

import {PgConnectionConfig, PgQueryResult, PgCatalogPgDatabase,
  InformationSchemaTable, InformationSchemaColumn,
  InformationSchemaReferentialConstraint, InformationSchemaKeyColumnUsage} from './index';

/**
When supplying variables in a SQL query use 1-indexed $N placeholders. E.g.:

query(config, 'SELECT * FROM users WHERE id = $1', [1])
*/
function query<T>(config: PgConnectionConfig, queryText: string, values: any[] = []): Promise<PgQueryResult<T> & {timeElapsed: number}> {
  return new Promise<PgQueryResult<T> & {timeElapsed: number}>((resolve, reject) => {
    const timeStarted = Date.now();
    connect(config, (error, client, done: (arg?: any) => void) => {
      if (error) return reject(error);
      console.info(`pg:query config=${inspect(config)} sql="${queryText}" values=${inspect(values)}`);
      client.query(queryText, values, (error: Error, result: PgQueryResult<T>) => {
        // calling done() with a truthy value triggers removal of the client
        // from the client pool, just to be safe
        done(error && client);
        if (error) return reject(error);
        // console.info(`query result:`, result);
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
  databases(params: PgConnectionConfig = {}) {
    let config = Object.assign({}, defaultClientConfig, params);
    const sql = 'SELECT * FROM pg_catalog.pg_database ORDER BY datname';
    return query<PgCatalogPgDatabase>(config, sql);
  },
  /**
  params should contain a {database: string} entry
  */
  tables(params: PgConnectionConfig & {database: string}) {
    let config = Object.assign({}, defaultClientConfig, params);
    // whoa, okay, you ready for this?
    return query<InformationSchemaTable>(config, `
      SELECT * FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_name
    `) // -- AND table_type = 'BASE TABLE'
    .then(({rows: tables}) => {
      let table_names = tables.map(table => table.table_name);
      return query<InformationSchemaColumn>(config, `SELECT * FROM information_schema.columns
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema') AND table_name = ANY($1)`, [table_names])
      .then(({rows: columns}) => {
        return query<InformationSchemaReferentialConstraint>(config, `SELECT * FROM information_schema.referential_constraints`)
        .then(({rows: constraints}) => {
          return query<InformationSchemaKeyColumnUsage>(config, `SELECT * FROM information_schema.key_column_usage`)
          .then(({rows: keyColumns}) => {
            // ok, now we join the constraints and keyColumns
            let references = constraints.map(({constraint_name, unique_constraint_name}) => {
              // TODO: handle multi-column foreign keys
              let {table_name, column_name} = keyColumns.find(keyColumn => keyColumn.constraint_name === constraint_name);
              let {table_name: unique_table_name, column_name: unique_column_name} = keyColumns.find(keyColumn => keyColumn.constraint_name === unique_constraint_name);
              return {table_name, column_name, unique_table_name, unique_column_name};
            });
            return {tables, columns, references};
          });
        });
      });
    });
  },
  /**
  Vulnerable to SQL injection via the 'table' argument.
  */
  count(params: PgConnectionConfig & {database: string, table: string}) {
    let config = Object.assign({}, defaultClientConfig, params);
    return query<{count: number}>(config, `SELECT COUNT(*) FROM ${config.table}`).then(result => {
      return result.rows[0].count;
    });
  },
  /**
  Execute an arbitrary SQL query and return the result.

  Super vulnerable to SQL injection! Like, that's the whole point!
  */
  query<T>(params: PgConnectionConfig & {sql: string, variables: any[]}) {
    let config = Object.assign({}, defaultClientConfig, params);
    return query<T>(config, config.sql, config.variables);
  },
};
export default api;

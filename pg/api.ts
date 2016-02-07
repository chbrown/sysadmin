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

import {
  PgConnectionConfig, PgQueryResult, PgCatalogPgDatabase,
  RelationAttribute, RelationConstraint, Relation
} from './index';

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
  In most cases, atttypid::regtype will return the same thing as
  format_type(atttypid, atttypmod), but the latter is more informative when
  dealing with variable length or otherwise parameterized types (e.g., varchar).

  attnum is negative for system attributes, e.g., 'tableoid', 'cmax', 'ctid', etc.
  attisdropped is TRUE for recently (but not yet fully vacuumed) dropped columns.
  */
  attributes(params: PgConnectionConfig & {relid: string}) {
    let config = Object.assign({}, defaultClientConfig, params);
    // -- would also need to grab attrelid if we were doing an `WHERE attrelid = ANY($1)` query
    return query<RelationAttribute>(config, `
      SELECT attname,
        attnum,
        format_type(atttypid, atttypmod) AS atttyp,
        attnotnull,
        adsrc
      FROM pg_catalog.pg_attribute
        LEFT OUTER JOIN pg_catalog.pg_attrdef ON adrelid = attrelid AND attnum = adnum
      WHERE attrelid = $1 AND attnum > 0 AND NOT attisdropped
    `, [params.relid]).then(({rows}) => rows);
  },
  /**
  Get the constraints associated with a table.

  Returns a list of constraints, each of which has a conkey: number[] field,
  which indicates which of the columns it depends on.
  */
  constraints(params: PgConnectionConfig & {relid: string}) {
    let config = Object.assign({}, defaultClientConfig, params);
    return query<RelationConstraint>(config, `
      SELECT conname,
        CASE contype
          WHEN 'c' THEN 'check constraint'
          WHEN 'f' THEN 'foreign key constraint'
          WHEN 'p' THEN 'primary key constraint'
          WHEN 'u' THEN 'unique constraint'
          WHEN 't' THEN 'constraint trigger'
          WHEN 'x' THEN 'exclusion constraint'
        END AS contype,
        conkey,
        pg_catalog.regclassout(confrelid) AS confrelname,
        string_agg(fkeyatt.attname, ',') AS fkeyattnames
      FROM pg_catalog.pg_constraint
        LEFT OUTER JOIN pg_catalog.pg_attribute AS fkeyatt ON attrelid = confrelid AND attnum = ANY(confkey)
      WHERE conrelid = $1
      GROUP BY pg_constraint.oid, conname, contype, confrelid, conkey
    `, [params.relid]).then(({rows}) => rows);
  },
  /**
  params should contain a {database: string} entry

  Maybe add to WHERE: pg_catalog.pg_table_is_visible(oid)
  */
  relations(params: PgConnectionConfig & {database: string}): Promise<Relation[]> {
    let config = Object.assign({}, defaultClientConfig, params);
    return query<{relid: string, relname: string, relkind: string}>(config, `
      SELECT oid AS relid,
        relname,
        CASE relkind
          WHEN 'r' THEN 'ordinary table'
          WHEN 'i' THEN 'index'
          WHEN 'S' THEN 'sequence'
          WHEN 'v' THEN 'view'
          WHEN 'm' THEN 'materialized view'
          WHEN 'c' THEN 'composite type'
          WHEN 't' THEN 'TOAST table'
          WHEN 'f' THEN 'foreign table'
        END AS relkind
      FROM pg_catalog.pg_class
      WHERE relnamespace IN (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname NOT IN
        ('pg_toast', 'pg_temp_1', 'pg_toast_temp_1', 'pg_catalog', 'information_schema'))
    `)
    .then(({rows: relations}) => {
      const promises = relations.map(relation => {
        const relparams = Object.assign(params, {relid: relation.relid})
        return Promise.all([
          api.attributes(relparams),
          api.constraints(relparams),
        ]).then(([attributes, constraints]) => {
          return Object.assign(relation, {attributes, constraints});
        });
      });
      return Promise.all(promises);
    });
  },
  /**
  Vulnerable to SQL injection via the 'table' argument.
  */
  count(params: PgConnectionConfig & {database: string, table: string}) {
    let config = Object.assign({}, defaultClientConfig, params);
    return query<{count: number}>(config, `SELECT COUNT(*) FROM ${config.table}`).then(({rows}) => {
      return rows[0].count;
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

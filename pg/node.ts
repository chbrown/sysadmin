import * as pg from 'pg';
import {inspect} from 'util';
import {asArray} from 'tarry';

import {PgCatalogPgDatabase, InformationSchemaTable, InformationSchemaColumn} from './index';

/** Also called "field description". See https://github.com/brianc/node-postgres/blob/v4.4.3/lib/connection.js#L468 */
export interface Field {
  name: string;
  tableID: number;
  columnID: number;
  dataTypeID: number;
  dataTypeSize: number;
  dataTypeModifier: number;
  format: string;
}

export interface QueryResult<T> {
  command: string;
  rowCount: number;
  oid: number;
  rows: T[];
  fields: Field[];
  RowCtor: Function;
  rowAsArray: boolean;
}

/**
When supplying variables in a SQL query use 1-indexed $N placeholders. E.g.:

query(config, 'SELECT * FROM users WHERE id = $1', [1])
*/
function query<T>(config: pg.ClientConfig, queryText: string, values: any[] = []): Promise<QueryResult<T>> {
  return new Promise<QueryResult<T>>((resolve, reject) => {
    pg.connect(config, (error, client, done: (arg?: any) => void) => {
      if (error) return reject(error);
      console.info(`pg:query config=${inspect(config)} sql="${queryText}" values=${inspect(values)}`);
      client.query(queryText, values, (error, result: QueryResult<T>) => {
        // calling done() with a truthy value triggers removal of the client
        // from the client pool, just to be safe
        done(error && client);
        if (error) return reject(error);
        // console.info(`query result:`, result);
        resolve(result);
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
  databases(arg: pg.ClientConfig = {}) {
    let config = Object.assign({}, defaultClientConfig, arg);
    return query<PgCatalogPgDatabase>(config, 'SELECT * FROM pg_catalog.pg_database');
  },
  /**
  arg should contain a {database: string} entry
  */
  tables(arg: pg.ClientConfig & {database: string}) {
    let config = Object.assign({}, defaultClientConfig, arg);
    return query<InformationSchemaTable>(config, `SELECT * FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')`);
    // -- AND table_type = 'BASE TABLE'
  },
  /**
  arg should contain {database: string, table: string} entries

  Vulnerable to SQL injection via the 'table' argument.
  */
  table(arg: pg.ClientConfig & {database: string, table: string, filters?: {[index: string]: string | string[]}}) {
    let config = Object.assign({filters: {}}, defaultClientConfig, arg);
    let values = [];
    let wheres = Object.keys(arg.filters).map(key => {
      let value = asArray(arg.filters[key]);
      return `${key} = ANY($${values.push(value)})`;
    });
    let whereClause = (wheres.length > 0) ? ` WHERE ${wheres.join(' AND ')}` : '';
    return query<{[index: string]: string}>(config, `SELECT * FROM ${arg.table} ${whereClause} LIMIT 500`, values);
  },
  /**
  arg should contain {database: string, tables: string[]} entries.
  */
  columns(arg: pg.ClientConfig & {database: string, tables: string[]}) {
    let config = Object.assign({}, defaultClientConfig, arg);
    return query<InformationSchemaColumn>(config, `SELECT * FROM information_schema.columns
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema') AND table_name = ANY($1)`, [arg.tables]);
  }
};
export default api;

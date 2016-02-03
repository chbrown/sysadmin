import * as React from 'react';

import {ErrorView} from './components/Root';
import Database from './pg/components/Database';
import Repl from './pg/components/Repl';
import QueryResult from './pg/components/QueryResult';

import pgApi from './pg/api';
import api from './api';

export type ReactComponent<P> = React.ComponentClass<P> | React.StatelessComponent<P>;

export interface ResponsePayload<T> {
  props?: T;
  Component?: ReactComponent<T>;
  stream?: NodeJS.ReadableStream;
  statusCode?: number;
  headers?: [string, string][];
}

interface Request {
  params: any;
  body?: any;
  query: any;
}

export interface Route {
  url: string;
  method: string;
  handler: (req: {params?: any, query?: any, body?: any, method?: string, pathname?: string}) =>
    Promise<ResponsePayload<any>> | ResponsePayload<any>;
}

const routes: Route[] = [
  {
    url: '/pg/',
    method: 'GET',
    handler() {
      return pgApi.databases().then(props => ({props, Component: QueryResult}));
    },
  },
  {
    url: '/pg/api/:name',
    method: 'POST',
    handler({params, body}) {
      return pgApi[params.name](body).then(props => ({props}));
    },
  },
  {
    url: '/pg/:database/',
    method: 'GET',
    handler({params}) {
      let {database} = params;
      return pgApi.tables({database}).then(props => ({props, Component: Database}));
    },
  },
  {
    url: '/pg/:database/repl/',
    method: 'GET',
    handler({params, query = {}}) {
      let {sql, variablesJSON} = query;
      let {database} = params;
      return Promise.resolve({props: {sql, variablesJSON, database}, Component: Repl});
    },
  },
  {
    url: '/pg/:database/query',
    method: 'POST',
    handler({params, body}) {
      let {database} = params;
      let {sql, variables} = body;
      return pgApi.query({database, sql, variables}).then(props => ({props, Component: QueryResult}));
    },
  },
  {
    url: '/pg/:database/:table',
    method: 'GET',
    handler({params, query = {}}) {
      let {database, table, offset = 0, limit = 100} = params;
      // TODO: handle offset & limit better, particularly with the Content-Range output
      // Vulnerable to SQL injection via the 'table' argument!
      const sql = `SELECT * FROM ${table} OFFSET $1 LIMIT $2`;
      const variables = [offset, limit];
      return Promise.all([
        pgApi.query({database, sql, variables}),
        pgApi.count({database, table}),
      ]).then(([result, totalRowCount]) => {
        const columnNames = result.fields.map(field => field.name);
        // TODO: maybe escape columnNames that need escaping? or fall back to * if any of the columns are weird?
        const sql = `SELECT ${columnNames.join(', ')} FROM ${table}`;
        // Why does TypeScript let me add 'headers' to the return value if
        // there is no such field on the ResponsePayload interface? weird.
        // http://otac0n.com/blog/2012/11/21/range-header-i-choose-you.html
        let headers = [['Content-Range', `${table} 0-${result.rows.length}/${totalRowCount}`]];
        const props = Object.assign(result, {totalRowCount, sql});
        return {props: result, Component: QueryResult, headers};
      });
    },
  },
  {
    url: '/build/*',
    method: 'GET',
    handler({params}) {
      let {splat} = params;
      let stream = api.readFile({path: `build/${splat}`});
      return {stream};
    },
  },
  {
    url: '/',
    method: 'GET',
    handler() {
      const headers = [['Location', '/pg/']];
      return {headers, statusCode: 302};
    },
  },
  {
    url: '*',
    method: '*',
    handler({method, pathname}) {
      let message = `No route found: ${method} ${pathname}`;
      return {props: {message}, Component: ErrorView, statusCode: 404};
    },
  },
];
export default routes;

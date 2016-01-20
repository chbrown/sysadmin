import * as React from 'react';

import Database from './pg/components/Database';
import Repl from './pg/components/Repl';
import QueryResult from './pg/components/QueryResult';

import pgApi from './pg/api';
import api from './api';

export type ReactComponent<P> = React.ComponentClass<P> | React.StatelessComponent<P>;

export interface ResponsePayload<T> {
  props?: T;
  component?: ReactComponent<T>;
  stream?: NodeJS.ReadableStream;
  redirect?: string;
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
  handler: (input: {req: Request}) => Promise<ResponsePayload<any>>;
}

const routes: Route[] = [
  {
    url: '/pg/',
    method: 'GET',
    handler: ({req}: {req: Request}) => {
      return pgApi.databases().then(props => ({props, component: QueryResult}));
    },
  },
  {
    url: '/pg/api/:name',
    method: 'POST',
    handler: ({req}: {req: Request}) => {
      return pgApi[req.params.name](req.body).then(props => ({props}));
    },
  },
  {
    url: '/pg/:database/',
    method: 'GET',
    handler: ({req}: {req: Request}) => {
      let {database} = req.params;
      return pgApi.tables({database}).then(props => ({props, component: Database}));
    },
  },
  {
    url: '/pg/:database/repl/',
    method: 'GET',
    handler: ({req}: {req: Request}) => {
      let {query = {}, params} = req;
      let {sql, variables} = query;
      let {database} = params;
      return Promise.resolve({props: {sql, variables, database}, component: Repl});
    },
  },
  {
    url: '/pg/:database/query',
    method: 'POST',
    handler: ({req}: {req: Request}) => {
      let {database} = req.params;
      let {sql, variables} = req.body;
      return pgApi.query({database, sql, variables}).then(props => ({props, component: QueryResult}));
    },
  },
  {
    url: '/pg/:database/:table',
    method: 'GET',
    handler: ({req}: {req: Request}) => {
      let {database, table} = req.params;
      // TODO: handle offset & limit better, particularly with the Content-Range output
      return Promise.all([
        pgApi.table({database, table, filters: req.query}),
        pgApi.count({database, table}),
      ]).then(([result, count]) => {
        // Why does TypeScript let me add 'headers' to the return value if
        // there is no such field on the ResponsePayload interface? weird.
        // http://otac0n.com/blog/2012/11/21/range-header-i-choose-you.html
        let headers = [['Content-Range', `${table} 0-${result.rows.length}/${count}`]];
        return {props: result, component: QueryResult, headers};
      });
    },
  },
  {
    url: '/build/*',
    method: 'GET',
    handler: ({req}: {req: Request}) => {
      let {splat} = req.params;
      return api.readFile({path: `build/${splat}`}).then(stream => ({stream}));
    },
  },
  {
    url: '/',
    method: 'GET',
    handler: ({req}: {req: Request}) => {
      return Promise.resolve({redirect: '/pg/', statusCode: 302});
    },
  },
];
export default routes;

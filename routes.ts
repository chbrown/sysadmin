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
}

interface Request {
  params: any;
  body?: any;
  query: any;
}

type PromiseCreator<I, O> = (input: I) => Promise<O>;
export interface Route {
  url: string;
  method: string;
  handler: PromiseCreator<{req: Request}, ResponsePayload<any>>;
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
      return Promise.resolve({component: Repl});
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
      return pgApi.table({database, table, filters: req.query}).then(props => ({props, component: QueryResult}));
    },
  },
  {
    url: '/static/*',
    method: 'GET',
    handler: ({req}: {req: Request}) => {
      let {splat} = req.params;
      return api.readFile({path: `static/${splat}`}).then(stream => ({stream}));
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

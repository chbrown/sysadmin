import {join} from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as urlio from 'urlio';
import {logger, Level} from 'loge';
import * as yargs from 'yargs';
import {inspect} from 'util';

import * as React from 'react';
type ReactComponent<P> = React.ComponentClass<P> | React.StatelessComponent<P>;
// DOMServer docs: https://facebook.github.io/react/docs/top-level-api.html
import {renderToString} from 'react-dom/server';

import api from './pg/node';

class ServerError extends Error {
  constructor(message, public statusCode = 400, public location?: string) {
    super(message);
  }
}

interface Context {
  req: express.Request;
  res: express.Response;
}
type PromiseCreator<I, O> = (input: I) => Promise<O>;
interface Route {
  url: string;
  method: string;
  description?: string;
  handler: PromiseCreator<Context, any>;
  component?: ReactComponent<any>;
}

import Root from './components/Root';
import Database from './pg/components/Database';
// import Tables from './pg/components/Tables';
import QueryResult from './pg/components/QueryResult';

const routes: Route[] = [
  {
    url: '/pg/',
    method: 'GET',
    handler: ({req, res}: Context) => {
      return api.databases();
    },
    component: QueryResult,
  },
  {
    url: '/pg/:database/',
    method: 'GET',
    handler: ({req, res}: Context) => {
      let {database} = req.params;
      return api.tables({database}).then(({rows: tables}) => {
        let table_names = tables.map(table => table.table_name);
        return api.columns({database, tables: table_names}).then(({rows: columns}) => {
          return {tables, columns};
        });
      });
    },
    component: Database,
  },
  {
    url: '/pg/:database/:table',
    method: 'GET',
    handler: ({req, res}: Context) => {
      let {database, table} = req.params;
      return api.table({database, table, filters: req.query});
    },
    component: QueryResult,
  },
  {
    url: '/',
    method: 'GET',
    description: 'Homepage',
    handler: ({req, res}: Context) => {
      return Promise.reject(new ServerError('Redirect to /pg/', 302, '/pg/'));
    },
  },
];

/**
Take a list of nested components and return a ReactElement
*/
function reduceComponents(components: ReactComponent<any>[], props: any): React.ReactElement<any> {
  let element: React.ReactElement<any> = null;
  while (components.length > 0) {
    let component = components.pop();
    if (component !== undefined) {
      element = React.createElement(component, Object.assign({children: element}, props));
    }
  }
  return element;
}
function renderReact(components: ReactComponent<any>[], props: any): string {
  const element = reduceComponents(components, props);
  const html = renderToString(element);
  return '<!DOCTYPE html>' + html;
}

// function adaptResponse(component: ReactComponent<any>, props: any, ): string {
// }

function mainHandler(req: express.Request, res: express.Response): Promise<string> {
  const {method} = req;
  let url = req.path;
  let matchingRoute = urlio.parse(routes, {url: url, method: method});
  // logger.info(`matched route`, matchingRoute);
  if (matchingRoute === undefined) {
    throw new ServerError(`No route found for "${url}"`, 404);
  }
  req.params = matchingRoute.params;
  // logger.info(`handling method=${method} url=${url} params=${inspect(req.params)} query=${inspect(req.query)}`);
  return matchingRoute.handler({req, res}).then(responseValue => {
    // logger.info(`rendering props=${inspect(responseValue)}`);
    let ajax = !/text\/html/.test(req.headers['accept']);
    if (/\.json$/.test(url)) {
      ajax = true;
      url = url.slice(0, -5);
    }
    if (ajax) {
      return JSON.stringify(responseValue);
    }
    else {
      return renderReact([Root, matchingRoute.component], responseValue);
    }
  });
}

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/static', express.static(join(__dirname, 'static')));
app.all('*', (req, res, next) => {
  mainHandler(req, res).then(value => {
    // logger.info('handler success:', value);
    res.end(value.toString());
  }).catch(reason => {
    logger.info('handler failure:', reason);
    if (reason.location) {
      return res.redirect(reason.statusCode, reason.location);
    }
    // return renderReact([Root, matchingRoute.component], responseValue);
    res.status(reason.statusCode || 500).end(reason.toString());
  });
});

const defaultPort = 7972;
const defaultHostname = '127.0.0.1';

export function start(port: number = defaultPort, hostname: string = defaultHostname) {
  app.listen(port, hostname, () => {
    console.log(`server listening on http://${hostname}:${port}`);
  });
}

export function main() {
  var argvparser = yargs
    .usage('Usage: sysadmin')
    .describe({
      help: 'print this help message',
      verbose: 'print extra output',
      version: 'print version',
      port: 'port to listen on',
      hostname: 'hostname to listen on',
    })
    .alias({
      h: 'help',
      v: 'verbose',
    })
    .default({
      port: defaultPort,
      hostname: defaultHostname,
    })
    .boolean(['help', 'verbose', 'version']);

  const argv = argvparser.argv;
  logger.level = argv.verbose ? Level.debug : Level.info;

  if (argv.help) {
    yargs.showHelp();
  }
  else if (argv.version) {
    console.log(require('./package').version);
  }
  else {
    start(argv.port, argv.hostname);
  }
}

if (require.main === module) {
  main();
}

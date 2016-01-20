import {IncomingMessage, ServerResponse, createServer} from 'http';
import * as urlio from 'urlio';
import {logger, Level} from 'loge';
import * as yargs from 'yargs';
import {inspect} from 'util';
import {addBody, addXhr, addUrlObj} from 'http-extend';

import * as React from 'react';

// DOMServer docs: https://facebook.github.io/react/docs/top-level-api.html
import {renderToString, renderToStaticMarkup} from 'react-dom/server';

import routes, {Route, ResponsePayload, ReactComponent} from './routes';

import Root from './components/Root';

function renderReact(component: ReactComponent<any>, props: any): string {
  // we have to render these separately since we only replace the component
  // part once on the browser-side
  const rootElement = React.createElement(Root, {children: '#yield#'});
  const rootHtml = renderToStaticMarkup(rootElement);
  const componentElement = React.createElement(component, props);
  const componentHtml = renderToString(componentElement);
  return '<!DOCTYPE html>' + rootHtml.replace('#yield#', componentHtml);
}

/**
Less generic middleware / handler, but useful here.

Uggh, TypeScript can't handle this. See addRoute below, which has the correct type inference.
*/
// function createRouter<Req extends (IncomingMessage & {pathname: string}), Res extends ServerResponse>(routes: urlio.Route[]) {
//   return ({req, res}: {req: Req, res: Res}): Promise<{req: Req & {route: urlio.Route, params: any}, res: Res}> => {
//     const route = urlio.parse(routes, {url: req.pathname, method: req.method});
//     return Promise.resolve({
//       req: Object.assign(req, {route, params: (route !== undefined) ? route.params : {}}),
//       res,
//     });
//   };
// }
/**
Uses `routes` global.
*/
function addRoute<Req extends IncomingMessage & {pathname: string}>(req: Req): Req & {route: Route, params: any} {
  // logger.info(`matching route for url=${pathname} method={method}`);
  const route = urlio.parse(routes, {url: req.pathname, method: req.method});
  return Object.assign(req, {route, params: (route !== undefined) ? route.params : {}});
}

/**
respondWith takes a response value and responds appropriately:
1. If value is a ServerError,
2. If !req.xhr and there's a component, render the component using the response value as its props
3. If req.xhr, add an "application/json" header and stringify the response value
*/
// function respondWith<T>(req: IncomingMessage, res: ServerResponse, payload: ResponsePayload<T>, callback: () => void) {
//   if (ServerError.isServerError(payload)) {
    // respondWith(req, res, payload);
// }

function httpHandler(req: IncomingMessage, res: ServerResponse): void {
  // process middleware
  Promise.resolve(req).then(addBody).then(addXhr).then(addUrlObj).then(addRoute)
  .then(req => {
    // handle processed request
    logger.info(`handling params=${inspect(req.params)} query=${inspect(req.query)}`);

    if (req.route === undefined) {
      let message = `No route found for "${req.pathname}"`;
      let payload: ResponsePayload<any> = {props: {message}, statusCode: 404};
      return {req, payload};
    }

    // logger.info(`running handler=${inspect(req)}`);
    return req.route.handler({req})
    .catch(reason => {
      // last-ditch effort to recover from errors while still formatting them adaptively
      let props = Object.assign({message: reason.message}, reason);
      let payload: ResponsePayload<any> = {props, statusCode: 400};
      return payload;
    }).then(payload => {
      return {req, payload};
    })
  })
  .then(({req, payload}) => {
    // logger.info(`rendering payload=${inspect(payload)}`);

    if (payload.headers) {
      payload.headers.forEach(([name, value]) => res.setHeader(name, value));
    }

    if (payload.redirect) {
      res.statusCode = payload.statusCode || 302;
      res.setHeader('Location', payload.redirect);
      res.end();
    }
    else if (payload.stream) {
      res.statusCode = payload.statusCode || 200;
      payload.stream
      .on('error', (error) => {
        logger.error('stream error', error);
        res.statusCode = 404; // maybe 500?
        res.end(error.toString());
      });
      payload.stream.pipe(res);
    }
    else if (req.xhr) {
      res.statusCode = payload.statusCode || 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(payload.props));
    }
    else if (payload.component) {
      res.statusCode = payload.statusCode || 200;
      res.end(renderReact(payload.component, payload.props));
    }
    else {
      throw new Error(`Cannot format payload: ${inspect(payload)}`);
    }
  })
  .catch(reason => {
    // oops, complete fail, handle any/all errors that occurred in the rendering step here.
    logger.info('handler failure', reason);
    res.statusCode = 500;
    res.end(reason.toString());
  });
}

const defaultPort = 7972;
const defaultHostname = '127.0.0.1';
/**
Create the server and start it listening on the given port and hostname.
Time all requests and send them directly over to httpHandler.
*/
export function start(port: number = defaultPort, hostname: string = defaultHostname) {
  const server = createServer((req, res) => {
    var started = Date.now();
    res.on('finish', () => {
      logger.info('%s %s [%d ms]', req.method, req.url, Date.now() - started);
    });
    httpHandler(req, res);
  });
  server.on('listening', () => {
    var address = server.address();
    console.log(`server listening on http://${address.address}:${address.port}`);
  });
  server.listen(port, hostname);
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
    start(parseInt(argv.port, 10), argv.hostname);
  }
}

if (require.main === module) {
  main();
}

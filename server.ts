import {parse as parseUrl} from 'url';
import {IncomingMessage, ServerResponse, createServer} from 'http';
import * as urlio from 'urlio';
import {logger, Level} from 'loge';
import * as yargs from 'yargs';
import {inspect} from 'util';

import * as React from 'react';
type ReactComponent<P> = React.ComponentClass<P> | React.StatelessComponent<P>;

// DOMServer docs: https://facebook.github.io/react/docs/top-level-api.html
import {renderToString, renderToStaticMarkup} from 'react-dom/server';

import routes, {Route, ResponsePayload} from './routes';

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
Middleware to add a `body: any` field to the request.
*/
function addBody<Req extends IncomingMessage, Res extends ServerResponse>({req, res}: {req: Req, res: Res}):
    Promise<{req: Req & {body: any}, res: Res}> {
  return new Promise<{req: Req & {body: any}, res: Res}>((resolve, reject) => {
    var chunks = [];
    return req
    .on('error', reject)
    .on('data', chunk => chunks.push(chunk))
    .on('end', () => {
      // console.log(`Parsing "${chunks.join('')}"`);
      let data = Buffer.concat(chunks);
      let body = (data.length > 0) ? JSON.parse(<any>data) : undefined;
      resolve({
        req: Object.assign(req, {body}),
        res,
      });
    });
  });
}

/**
Middleware to add an `xhr: boolean` field to the request.

Look at the request and set req.xhr = true iff:
1. The request header `X-Requested-With` is "XMLHttpRequest", OR:
2. The request path ends with ".json", OR:
3. The request header `Accept` does not contain "text/html"

req.xhr == true indicates that the response should be JSON.
*/
function addXhr<Req extends IncomingMessage, Res extends ServerResponse>({req, res}: {req: Req, res: Res}):
    Promise<{req: Req & {xhr: boolean}, res: Res}> {
  // TODO: use the pathname, not the url
  let xhr = (req.headers['x-requested-with'] == 'XMLHttpRequest') ||
            /\.json$/.test(req.url) ||
            !/text\/html/.test(req.headers['accept']);
  // if the second case is true, remove the ".json" extension
  let url = req.url.replace(/\.json$/, '');
  return Promise.resolve({
    req: Object.assign(req, {xhr, url}),
    res,
  });
}

/**
Selected properties of a fully (parseQueryString=true) parsed NodeJS Url object.
*/
interface Url {
  /** The request protocol, lowercased. */
  protocol: string;
  /** The authentication information portion of a URL. */
  auth: string;
  /** Just the lowercased hostname portion of the host. */
  hostname: string;
  /** The port number portion of the host. (Yes, it's a string.) */
  port: string;
  /** The path section of the URL, that comes after the host and before the
  query, including the initial slash if present. No decoding is performed. */
  pathname: string;
  /** A querystring-parsed object. */
  query: any;
  /**  The 'fragment' portion of the URL including the pound-sign. */
  hash: string;
}

/**
Add a subset of the parsed NodeJS.Url object to the request.
*/
function addUrlObj<Req extends IncomingMessage, Res extends ServerResponse>({req, res}: {req: Req, res: Res}):
    Promise<{req: Req & Url, res: Res}> {
  let {protocol, auth, hostname, port, pathname, query, hash} = parseUrl(req.url, true);
  return Promise.resolve({
    req: Object.assign(req, {protocol, auth, hostname, port, pathname, query, hash}),
    res,
  });
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
function addRoute<Req extends IncomingMessage & {pathname: string}, Res extends ServerResponse, Rou extends Route & {params: any}>({req, res}: {req: Req, res: Res}): Promise<{req: Req & {route: Rou, params: any}, res: Res}> {
  // logger.info(`matching route for url=${pathname} method={method}`);
  const route = urlio.parse(routes, {url: req.pathname, method: req.method});
  return Promise.resolve({
    req: Object.assign(req, {route, params: (route !== undefined) ? route.params : {}}),
    res,
  });
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
  Promise.resolve({req, res})
  .then(addBody)
  .then(addXhr)
  .then(addUrlObj)
  .then(addRoute)
  .then(({req, res}) => {
    // handle processed request
    logger.info(`handling params=${inspect(req.params)} query=${inspect(req.query)}`);

    if (req.route === undefined) {
      let message = `No route found for "${req.pathname}"`;
      let payload: ResponsePayload<any> = {props: {message}, statusCode: 404};
      return Promise.resolve({req, res, payload});
    }

    return req.route.handler({req: req})
    .catch(reason => {
      // last-ditch effort to recover from errors while still formatting them adaptively
      let props = Object.assign({message: reason.message}, reason);
      let payload: ResponsePayload<any> = {props, statusCode: 400};
      return payload;
    }).then(payload => {
      return {req, res, payload};
    })
  })
  .then(({req, res, payload}) => {
    // logger.info(`rendering payload=${inspect(payload)}`);

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

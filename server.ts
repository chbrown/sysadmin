import {IncomingMessage, ServerResponse, createServer} from 'http';
import * as urlio from 'urlio';
import {logger, Level} from 'loge';
import {inspect} from 'util';
import {addBody, addXhr, addUrlObj} from 'http-extend';
import respond from 'http-respond';

import routes, {Route, ResponsePayload} from './routes';

import Root, {ErrorView} from './components/Root';

/**
Uses `routes` global.
*/
function addRoute<Req extends {method?: string, pathname: string}>(req: Req) {
  const route = urlio.parse(routes, {url: req.pathname, method: req.method});
  if (route === undefined) {
    // there _should_ be a catch-all route
    throw new Error('Not Found');
  }
  return Object.assign(req, {route, params: route.params});
}

function httpHandler(req: IncomingMessage, res: ServerResponse): void {
  Promise.resolve(req).then(addBody).then(addXhr).then(addUrlObj).then(addRoute)
  .then(req => {
    // logger.info(`handling params=${inspect(req.params)} query=${inspect(req.query)}`);
    return Promise.resolve(req.route.handler(req))
    .catch(error => {
      // last-ditch effort to recover from errors while still formatting them adaptively
      let props = {message: error.message, stack: error.stack};
      let payload: ResponsePayload<any> = {props, Component: ErrorView, statusCode: 400};
      return payload;
    })
    .then(payload => ({req, payload}));
  })
  .then(({req, payload}) => {
    // logger.info(`rendering payload=${inspect(payload)}`);
    // can I factor these hacks into http-respond somehow?
    payload = Object.assign(payload, {xhr: req.xhr})
    if (payload.Component) {
      payload = Object.assign(payload, {LayoutComponent: Root})
    }
    respond(res, payload);
  })
  .catch(error => {
    // oops, complete fail, handle any/all errors that occurred in the rendering step here.
    logger.info('handler failure', error);
    res.statusCode = 500;
    res.end(error.stack || error.toString());
  });
}

export const defaultPort = 7972;
export const defaultHostname = '127.0.0.1';
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

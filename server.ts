import {IncomingMessage, ServerResponse, createServer} from 'http';
import {AddressInfo} from 'net';
import * as urlio from 'urlio';
import {logger, Level} from 'loge';
import {inspect} from 'util';
import {addBody, addXhr, addUrlObj, addCookies} from 'http-extend';
import {Props, Component, ComponentClass, StatelessComponent, Children, ValidationMap, createElement} from 'react';
import * as PropTypes from 'prop-types';
import {renderToString, renderToStaticMarkup} from 'react-dom/server';

import routes, {Route, ResponsePayload, ReactComponent} from './routes';
import Root, {ErrorView} from './components/Root';

/**
A generic version of the standard React.ReactType type (which is also a union).
*/
type ReactType<P extends Props<any>> = string | ComponentClass<P> | StatelessComponent<P>;

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

interface ProviderProps {
  cookies: {[index: string]: string};
}
class Provider extends Component<ProviderProps, {}> {
  getChildContext() {
    return {cookies: this.props.cookies};
  }
  render() {
    return Children.only(this.props.children) as any;
  }
  static childContextTypes: ValidationMap<any> = {
    cookies: PropTypes.object.isRequired,
  }
}

const _layoutPlaceholder = '#yield#';

function httpHandler(req: IncomingMessage, res: ServerResponse): void {
  Promise.resolve(req).then(addBody).then(addXhr).then(addUrlObj).then(addCookies).then(addRoute)
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
    // export function send<P>(callback: () => void) {
    res.statusCode = payload.statusCode || 200;
    if (payload.headers) {
      payload.headers.forEach(([name, value]) => res.setHeader(name, value));
    }

    if (payload.stream) {
      payload.stream.pipe(res);
    }
    else if (!req.xhr && payload.Component) {
      res.setHeader('Content-Type', 'text/html');

      const element = createElement(payload.Component, payload.props);
      const providerElement = createElement(Provider, {cookies: req.cookies}, element);
      const providerElementHtml = renderToString(providerElement);
      const layout = createElement(Root, payload.props, _layoutPlaceholder);
      const layoutHtml = renderToStaticMarkup(layout);
      const html = '<!DOCTYPE html>' + layoutHtml.replace(_layoutPlaceholder, providerElementHtml);
      res.end(html);
    }
    else if (payload.props) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(payload.props));
    }
    else {
      res.end();
    }
  })
  .catch(error => {
    // oops, complete fail, handle any/all errors that occurred in the rendering step here.
    logger.info('handler failure', error);
    res.statusCode = 500;
    res.end(error.stack || error.toString());
  });
}

function formatAddress(address: string | AddressInfo): string {
  if (typeof address == 'string') {
    return address;
  }
  return `http://${address.address}:${address.port}`;
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
    console.log(`server listening on http://${formatAddress(server.address())}`);
  });
  server.listen(port, hostname);
}

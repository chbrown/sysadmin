#!/usr/bin/env node
import {IncomingMessage, ServerResponse, createServer} from 'http'
import * as optimist from 'optimist'
import * as urlio from 'urlio'
import {logger, Level} from 'loge'
import {inspect} from 'util'
import {addBody, addXhr, addUrlObj, addCookies} from 'http-extend'
import {Component, ComponentClass, StatelessComponent, Children, ValidationMap, createElement} from 'react'
import * as PropTypes from 'prop-types'
import {renderToString, renderToStaticMarkup} from 'react-dom/server'

import routes, {Route, ResponsePayload, ReactComponent} from './routes'
import Root, {ErrorView} from './components/Root'

/**
Uses `routes` global.
*/
function addRoute<Req extends {method?: string, pathname: string}>(req: Req) {
  const route = urlio.parse(routes, {url: req.pathname, method: req.method})
  if (route === undefined) {
    // there _should_ be a catch-all route
    throw new Error('Not Found')
  }
  return Object.assign(req, {route, params: route.params})
}

interface ProviderProps {
  cookies: {[index: string]: string}
}
class Provider extends Component<ProviderProps> {
  getChildContext() {
    return {cookies: this.props.cookies}
  }
  render() {
    return Children.only(this.props.children) as any
  }
  static childContextTypes: ValidationMap<any> = {
    cookies: PropTypes.object.isRequired,
  }
}

const LAYOUT_PLACEHOLDER = '#yield#'

function httpHandler(req: IncomingMessage, res: ServerResponse): void {
  Promise.resolve(req).then(addBody).then(addXhr).then(addUrlObj).then(addCookies).then(addRoute)
  .then(req => {
    // logger.info(`handling params=${inspect(req.params)} query=${inspect(req.query)}`)
    return Promise.resolve(req.route.handler(req))
    .catch(error => {
      // last-ditch effort to recover from errors while still formatting them adaptively
      const props = {message: error.message, stack: error.stack}
      const payload: ResponsePayload<any> = {props, Component: ErrorView, statusCode: 400}
      return payload
    })
    .then(payload => ({req, payload}))
  })
  .then(({req, payload}) => {
    // logger.info(`rendering payload=${inspect(payload)}`)
    // can I factor these hacks into http-respond somehow?
    // export function send<P>(callback: () => void) {
    res.statusCode = payload.statusCode || 200
    if (payload.headers) {
      payload.headers.forEach(([name, value]) => res.setHeader(name, value))
    }

    if (payload.stream) {
      payload.stream.pipe(res)
    }
    else if (!req.xhr && payload.Component) {
      res.setHeader('Content-Type', 'text/html')

      const element = createElement(payload.Component, payload.props)
      const providerElement = createElement(Provider, {cookies: req.cookies}, element)
      const providerElementHtml = renderToString(providerElement)
      const layout = createElement(Root, payload.props, LAYOUT_PLACEHOLDER)
      const layoutHtml = renderToStaticMarkup(layout)
      const html = layoutHtml.replace(LAYOUT_PLACEHOLDER, providerElementHtml)
      res.end(`<!DOCTYPE html>${html}`)
    }
    else if (payload.props) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(payload.props))
    }
    else {
      res.end()
    }
  })
  .catch(error => {
    // oops, complete fail, handle any/all errors that occurred in the rendering step here.
    logger.info('handler failure', error)
    res.statusCode = 500
    res.end(error.stack || error.toString())
  })
}

export const defaultPort = 7972
export const defaultHostname = '127.0.0.1'
/**
Create the server and start it listening on the given port and hostname.
Time all requests and send them directly over to httpHandler.
*/
export function start(port: number = defaultPort, hostname: string = defaultHostname) {
  const server = createServer((req, res) => {
    const started = Date.now()
    res.on('finish', () => {
      logger.info('%s %s [%d ms]', req.method, req.url, Date.now() - started)
    })
    httpHandler(req, res)
  })
  server.on('listening', () => {
    const address = server.address()
    const addressString = typeof address == 'string' ? address : `${address.address}:${address.port}`
    console.log(`server listening on http://${addressString}`)
  })
  server.listen(port, hostname)
}

export function main() {
  const argvparser = optimist
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
  .boolean(['help', 'verbose', 'version'])

  const argv = argvparser.argv
  logger.level = argv.verbose ? Level.debug : Level.info

  if (argv.help) {
    argvparser.showHelp()
  }
  else if (argv.version) {
    console.log(require('./package').version)
  }
  else {
    start(parseInt(argv.port, 10), argv.hostname)
  }
}

if (require.main === module) {
  main()
}

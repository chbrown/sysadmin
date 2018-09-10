#!/usr/bin/env node
import {logger, Level} from 'loge'
import * as optimist from 'optimist'
import {defaultPort, defaultHostname, start} from '../server'

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
    console.log(require('../package').version)
  }
  else {
    start(parseInt(argv.port, 10), argv.hostname)
  }
}

if (require.main === module) {
  main()
}

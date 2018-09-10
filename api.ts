import {createReadStream} from 'fs'
import {join} from 'path'

const api = {
  /**
  Read a file from the local filesystem.

  TODO: safeguard against malicious requests.
  */
  readFile({path}: {path: string}) {
    const filepath = join(__dirname, path)
    // console.info(`api.readFile:createReadStream(${filepath})`)
    return createReadStream(filepath)
  },
}
export default api

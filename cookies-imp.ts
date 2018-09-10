import {CookieOptions} from './cookies'

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  console.error('cannot currently set cookies on the server-side')
}

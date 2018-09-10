import {CookieOptions} from './cookies';

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  const one_month = new Date(new Date().getTime() + 31 * 24 * 60 * 60 * 1000);
  const {expires = one_month, path = '/', domain, secure} = options;
  const pairs: Array<[string, string] | [string]> = [[encodeURIComponent(name), encodeURIComponent(value)]];
  if (expires !== undefined) {
    pairs.push(['expires', expires instanceof Date ? expires.toUTCString() : expires]);
  }
  if (path !== undefined) {
    pairs.push(['path', path]);
  }
  if (domain !== undefined) {
    pairs.push(['domain', domain]);
  }
  if (secure !== undefined) {
    pairs.push(['secure']);
  }
  document.cookie = pairs.map(pair => pair.join('=')).join('; ');
}

export function bind<T extends Function>(_target: object,
                                         propertyKey: string | symbol,
                                         descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T> | void {
  return {
    configurable: true,
    get(this: T): T {
      const value = descriptor.value.bind(this);
      Object.defineProperty(this, propertyKey, {
        value,
        configurable: true,
        writable: true,
      });
      return value;
    },
  };
}

export class ResponseError extends Error {
  constructor(public response: Response) {
    super(`HTTP ${response.status}`);
  }
}

/**
Check that a fetch() Response has a successful status code and turn it into a
rejected Promise if not.
*/
export async function assertSuccess<R extends Response>(response: R): Promise<R> {
  if (response.status < 200 || response.status > 299) {
    const error = new ResponseError(response);
    return Promise.reject<R>(error);
  }
  return Promise.resolve(response);
}

/**
We can't write the .body property of a Response because it's a read-only getter,
so we use .content instead.
*/
export async function addJSON<R extends Response>(response: R): Promise<R & {content: any}> {
  return response.json().then(content => Object.assign(response, {content}));
}

/**
fetchJSON adds appropriate MIME type headers to the request,
JSON-stringifies the body,
rejects if the responses sent a unsuccessfuly status code,
and parses JSON from the response.
*/
export async function fetchJSON(url: string, {method = 'GET', body}: {method: string, body?: any}) {
  const init: RequestInit = {method, headers: {'Content-Type': 'application/json'}};
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return fetch(url, init).then(addJSON).then(assertSuccess);
}

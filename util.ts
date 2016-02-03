export const bind: MethodDecorator = <T extends Function>(target: Object,
                                                          propertyKey: string | symbol,
                                                          descriptor: TypedPropertyDescriptor<T>) => {
  return {
    configurable: true,
    get() {
      const value = descriptor.value.bind(this);
      Object.defineProperty(this, propertyKey, {
        value,
        configurable: true,
        writable: true
      });
      return value;
    }
  };
}

/**
Check that a fetch() Response has a successful status code and turn it into a
rejected Promise if not.
*/
export function assertSuccess<R extends Response>(response: R): Promise<R> {
  if (response.status < 200 || response.status > 299) {
    let error = new Error(`HTTP ${response.status}`);
    error['response'] = response;
    return Promise.reject<R>(error);
  }
  return Promise.resolve(response);
}

/**
We can't write the .body property of a Response because it's a read-only getter,
so we use .content instead.
*/
export function addJSON<R extends Response>(response: R): Promise<R & {content: any}> {
  return response.json().then(content => Object.assign(response, {content}));
}

/**
fetchJSON adds appropriate MIME type headers to the request,
JSON-stringifies the body,
rejects if the responses sent a unsuccessfuly status code,
and parses JSON from the response.
*/
export function fetchJSON(url: string, {method = 'GET', body}: {method: string, body?: any}) {
  let init: RequestInit = {method, headers: {'Content-Type': 'application/json'}};
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return fetch(url, init).then(addJSON).then(assertSuccess);
}

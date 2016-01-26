function post(url: string, body: any) {
  return fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  }).then(res => res.json());
}

// How ugly and concise! A Proxy would be better but Chrome doesn't support it.
// const api: API = {} as any;
// appease the webpack run of the TypeScript compiler by giving api the type of `any`
const api: any = {};
['databases', 'tables', 'count', 'query'].forEach(key => {
  api[key] = (params) => post(`/pg/api/${key}`, params);
});
export default api;

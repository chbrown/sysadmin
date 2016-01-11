import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {createHistory} from 'history';
import * as urlio from 'urlio';

import routes, {ReactComponent} from '../routes';

const history = createHistory();

history.listen(location => {
  console.log('history:listen', location.pathname);

  let url = location.pathname;
  let matchingRoute = urlio.parse(routes, {url, method: 'GET'});
  let req = {params: matchingRoute.params, query: location.query};
  console.log(`matched route`, matchingRoute, req);
  matchingRoute.handler({req}).then(payload => {
    // console.log('rendering', matchingRoute.component, responseValue);
    const element = React.createElement(payload.component, payload.props);
    return ReactDOM.render(element, document.getElementById('app'));
  }).catch(reason => {
    console.error('route.handler or renderReact failed:', reason);
  });
});

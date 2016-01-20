import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {createHistory, useQueries} from 'history';
import * as urlio from 'urlio';

import routes, {ReactComponent} from './routes';

const history = useQueries(createHistory)();

class Provider extends React.Component<{children?: ReactComponent<any>[], location: any}, {}> {
  getChildContext() {
    return {history, location: this.props.location};
  }
  render() {
    return React.Children.only(this.props.children) as any;
  }
  // oddly, React.ValidationMap<any> is required for both of these statics
  static propTypes: React.ValidationMap<any> = {
    children: React.PropTypes.any.isRequired,
    location: React.PropTypes.object.isRequired,
  }
  static childContextTypes: React.ValidationMap<any> = {
    history: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired,
  }
}

history.listen(location => {
  console.log('history:listen', location.pathname);

  let url = location.pathname;
  let matchingRoute = urlio.parse(routes, {url, method: 'GET'});
  let req = {params: matchingRoute.params, query: location.query};
  // console.log(`matched route`, matchingRoute, req);
  matchingRoute.handler({req}).then(payload => {
    // console.log('rendering', matchingRoute.component, responseValue);
    const element = React.createElement(Provider, {location} as any,
        React.createElement(payload.component, payload.props));
    return ReactDOM.render(element, document.getElementById('app'));
  }).catch(reason => {
    console.error('route.handler or renderReact failed:', reason);
  });
});

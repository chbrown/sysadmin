import {Component, ValidationMap, Children, createElement} from 'react';
import * as PropTypes from 'prop-types';
import {render} from 'react-dom';
import {createBrowserHistory} from 'history';
import {parse} from 'query-string';
import * as urlio from 'urlio';

import routes, {ReactComponent} from './routes';

const history = createBrowserHistory();

interface ProviderProps {
  children?: ReactComponent<any>[];
  location: any;
}
class Provider extends Component<ProviderProps> {
  cookies: {[index: string]: string};
  constructor(props: ProviderProps, context) {
    super(props, context);
    this.cookies = {};
    document.cookie.split(/;\s*/).forEach(cookieString => {
      const splitAt = cookieString.indexOf('=');
      const name = cookieString.slice(0, splitAt);
      const value = cookieString.slice(splitAt + 1);
      this.cookies[name] = decodeURIComponent(value);
    });
  }
  getChildContext() {
    return {history, location: this.props.location, cookies: this.cookies};
  }
  render() {
    return Children.only(this.props.children) as any;
  }
  // oddly, ValidationMap<any> is required for both of these statics
  static propTypes: ValidationMap<any> = {
    children: PropTypes.any.isRequired,
    location: PropTypes.object.isRequired,
  }
  static childContextTypes: ValidationMap<any> = {
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    cookies: PropTypes.object.isRequired,
  }
}

history.listen(location => {
  console.log('history:listen', location.pathname);

  const url = location.pathname;
  const matchingRoute = urlio.parse(routes, {url, method: 'GET'});
  const query = parse(location.search);
  const req = {params: matchingRoute.params, query};
  // console.log(`matched route`, matchingRoute, req);
  Promise.resolve(matchingRoute.handler(req)).then(payload => {
    // console.log('rendering', matchingRoute.Component, responseValue);
    const element = createElement(Provider, {location} as any,
      createElement(payload.Component, payload.props));
    return render(element, document.getElementById('app'));
  }).catch(reason => {
    console.error('route.handler or renderReact failed:', reason);
  });
});

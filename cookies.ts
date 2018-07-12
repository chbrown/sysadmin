import {Component, ComponentClass, createElement} from 'react';
import * as PropTypes from 'prop-types';
const hoistStatics = require('hoist-non-react-statics');

export interface CookieObject {
  [index: string]: string;
}

export interface CookieOptions {
  expires?: Date | string;
  path?: string;
  domain?: string;
  secure?: boolean;
}

export const CookiesPropTypes = PropTypes.object.isRequired;

export interface ConnectedCookiesProps {
  cookies?: CookieObject;
}

export interface ComponentDecorator<P> {
  (WrappedComponent: ComponentClass<P>): ComponentClass<P>;
}

export function connectCookies<P>(): ComponentDecorator<P> {
  return function wrapWithConnect(WrappedComponent: ComponentClass<P>): ComponentClass<P> {
    class ConnectCookies extends Component<P, {}> {
      cookies: CookieObject;
      constructor(props: P, context: any) {
        super(props, context);
        this.cookies = context.cookies;
      }
      render() {
        const mergedProps = Object.assign({}, this.props, {cookies: this.cookies});
        return createElement(WrappedComponent, mergedProps);
      }
      static contextTypes = {cookies: CookiesPropTypes};
    }
    return hoistStatics(ConnectCookies, WrappedComponent) as ComponentClass<P>;
  }
}

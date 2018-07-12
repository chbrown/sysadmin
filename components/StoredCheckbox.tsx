import * as React from 'react';

import {bind} from '../util';

import {connectCookies, ConnectedCookiesProps, CookiesPropTypes} from '../cookies';
import {setCookie} from '../cookies-imp';

interface CheckboxProps extends ConnectedCookiesProps {
  name: string;
  label: string;
}
class UnconnectedStoredCheckbox extends React.Component<CheckboxProps, {}> {
  @bind
  onChange(ev: React.FormEvent) {
    const {checked} = ev.target as HTMLInputElement;
    setCookie(this.props.name, String(checked));
  }
  render() {
    const {name, label, cookies} = this.props;
    const checked = cookies[this.props.name] !== 'false';
    return (
      <label>
        <input type="checkbox" onChange={this.onChange} defaultChecked={checked} />
        <span>{label}</span>
      </label>
    );
  }
  static propTypes: React.ValidationMap<any> = {
    name: React.PropTypes.string.isRequired,
    label: React.PropTypes.string.isRequired,
    cookies: CookiesPropTypes,
  }
}
const StoredCheckbox = connectCookies<CheckboxProps>()(UnconnectedStoredCheckbox);

export default StoredCheckbox;

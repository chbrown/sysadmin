import * as React from 'react'
import * as PropTypes from 'prop-types'

import {bind} from '../util'

import {connectCookies, ConnectedCookiesProps, CookiesPropTypes} from '../cookies'
import {setCookie} from '../cookies-imp'

interface TextProps extends ConnectedCookiesProps {
  name: string
  label: string
}
class UnconnectedStoredText extends React.Component<TextProps> {
  @bind
  onChange(ev: React.FormEvent) {
    const {value} = ev.target as HTMLInputElement
    setCookie(this.props.name, value)
  }
  render() {
    const {name, label, cookies} = this.props
    const value = cookies[this.props.name]
    return (
      <label>
        <div>
          <span>{label}</span>
        </div>
        <input type="text" onChange={this.onChange} defaultValue={value} />
      </label>
    )
  }
  static propTypes: React.ValidationMap<TextProps> = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    cookies: CookiesPropTypes,
  }
}
const StoredText = connectCookies<TextProps>()(UnconnectedStoredText)

export default StoredText

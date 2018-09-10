import * as React from 'react';

import {bind} from '../../util';
import {connectCookies, ConnectedCookiesProps, CookiesPropTypes} from '../../cookies';

import StoredCheckbox from '../../components/StoredCheckbox';
import StoredText from '../../components/StoredText';

const relkinds = ['ordinary table', 'sequence', 'index', 'view'];

interface ConfigProps extends ConnectedCookiesProps {}
class Config extends React.Component<ConfigProps> {
  render() {
    const {cookies} = this.props;
    return (
      <div>
        <div className="hpad flex">
          <h3>Config</h3>
        </div>
        <div className="hpad flex">
          <div>
            <h4>Relkinds visibility</h4>
            {[...relkinds].map(relkind =>
              <div key={relkind}>
                <StoredCheckbox name={relkind} label={relkind} />
              </div>
            )}
          </div>
          <div>
            <h4>Formatting</h4>
            <StoredText name="dateFormat" label="Date format" />

            <StoredText name="timestampFormat" label="Timestamp format" />

            <StoredText name="decimalFractionDigits" label="Decimal fraction digits" />
          </div>
        </div>
      </div>
    );
  }
  static propTypes: React.ValidationMap<ConfigProps> = {
    cookies: CookiesPropTypes,
  };
}

const ConnectedConfig = connectCookies<ConfigProps>()(Config);

export default ConnectedConfig;

import * as React from 'react';
import * as PropTypes from 'prop-types';

const full: Intl.DateTimeFormatOptions = {
  weekday:      'long',
  year:         'numeric',
  month:        'long',
  day:          'numeric',
  hour:         'numeric',
  minute:       'numeric',
  second:       'numeric',
  timeZoneName: 'short',
}
const long: Intl.DateTimeFormatOptions = {
  year:         'numeric',
  month:        'long',
  day:          'numeric',
  hour:         'numeric',
  minute:       'numeric',
  second:       'numeric',
  timeZoneName: 'short',
}
const medium: Intl.DateTimeFormatOptions = {
  year:   'numeric',
  month:  'short',
  day:    'numeric',
  hour:   'numeric',
  minute: 'numeric',
  second: 'numeric',
}
const short: Intl.DateTimeFormatOptions = {
  year:   '2-digit',
  month:  'numeric',
  day:    'numeric',
  hour:   'numeric',
  minute: 'numeric',
}

const formats = {full, long, medium, short}

interface DateTimeProps {
  date: Date | string;
  format?: string;
}

const DateTime: React.StatelessComponent<DateTimeProps> = ({date, format = 'medium'}: DateTimeProps) => {
  const dateObject = new Date(date);
  const localeString = dateObject.toLocaleString('en-US', formats[format]);
  return <time dateTime={dateObject.toISOString()}>{localeString}</time>;
};
DateTime.propTypes = {
  date: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]).isRequired,
  format: PropTypes.string,
};
export default DateTime;

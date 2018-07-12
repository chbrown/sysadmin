import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as moment from 'moment';

const DateTime = ({date, format = 'YYYY-MM-DD h:mm A'}: {date: Date | string, format?: string}) => {
  let text = moment(date).format(format);
  return <time dateTime={date instanceof Date ? date.toISOString() : date}>{text}</time>;
};
DateTime['propTypes'] = {
  date: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
  format: PropTypes.string,
};
export default DateTime;

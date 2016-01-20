import * as React from 'react';
// import * as moment from 'moment'; // doesn't work. weird.
const moment = require('moment');

const DateTime = ({date, format = 'YYYY-MM-DD h:mm A'}: {date: Date | string, format?: string}) => {
  let text = moment(date).format(format);
  return <time dateTime={date instanceof Date ? date.toISOString() : date}>{text}</time>;
};
DateTime['propTypes'] = {
  date: React.PropTypes.oneOfType([React.PropTypes.object, React.PropTypes.string]).isRequired,
  format: React.PropTypes.string,
};
export default DateTime;

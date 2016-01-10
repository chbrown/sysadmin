import * as React from 'react';
import * as moment from 'moment';

const DateTime = ({date, format = 'YYYY-MM-DD h:mm A'}: {date: Date, format?: string}) => {
  let text = moment(date).format(format);
  return <time dateTime={date.toISOString()}>{text}</time>;
};
DateTime['propTypes'] = {
  date: React.PropTypes.object.isRequired,
  format: React.PropTypes.string,
};
export default DateTime;

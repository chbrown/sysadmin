import * as React from 'react';
import * as PropTypes from 'prop-types';

export const ErrorView = ({message, stack}) => (
  <div className="hpad">
    <h2>Error!</h2>
    <h3 title="message">{message}</h3>
    <pre title="stack">{stack}</pre>
  </div>
);

const Root = ({children}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <title>sysadmin</title>
      <link href="/build/img/favicon.ico" rel="icon" type="image/x-icon" />
      <link href="/build/site.css" rel="stylesheet" type="text/css" />
    </head>
    <body>
      <nav>
        <a href="/pg/">pg</a>
      </nav>
      <div id="app">{children}</div>
      <script src="/build/bundle.js"></script>
    </body>
  </html>
);
Root['propTypes'] = {
  children: PropTypes.any.isRequired,
};
export default Root;

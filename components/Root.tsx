import * as React from 'react';

const Root = ({children}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <title>sysadmin</title>
      <link href="/static/img/favicon.ico" rel="icon" type="image/x-icon" />
      <link href="/static/build/site.css" rel="stylesheet" type="text/css" />
      <script src="/static/build/bundle.js"></script>
    </head>
    <body>
      <header>
        <nav>
          <a href="/pg/">pg</a>
        </nav>
      </header>
      {children}
    </body>
  </html>
);
Root['propTypes'] = {
  children: React.PropTypes.any.isRequired,
};
export default Root;

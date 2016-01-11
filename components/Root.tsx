import * as React from 'react';

const Root = ({children}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <title>sysadmin</title>
      <link href="/static/img/favicon.ico" rel="icon" type="image/x-icon" />
      <link href="/static/build/site.css" rel="stylesheet" type="text/css" />
    </head>
    <body>
      <header>
        <nav>
          <a href="/pg/">pg</a>
        </nav>
      </header>
      <div id="app">{children}</div>
      <script src="/static/build/bundle.js"></script>
    </body>
  </html>
);
Root['propTypes'] = {
  children: React.PropTypes.any.isRequired,
};
export default Root;

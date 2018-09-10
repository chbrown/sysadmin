const {resolve} = require('path')
const webpack = require('webpack')
const env = process.env.NODE_ENV || 'development'

module.exports = {
  mode: env,
  entry: {
    app: ['babel-polyfill', './app'],
  },
  output: {
    path: resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.web.js', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
          },
        },
      },
      {
        test: /\.less$/,
        exclude: /node_modules/,
        use: [{
          loader: 'style-loader',
        }, {
          loader: 'css-loader',
        }, {
          loader: 'post-loader',
          options: {
            ident: 'postcss',
            plugins: () => [
              require('autoprefixer')(),
            ],
          },
        }, {
          loader: 'less-loader',
        }],
      },
    ],
  },
}

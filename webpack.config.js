var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var production = process.env.NODE_ENV == 'production';

module.exports = {
  entry: [
    './app.tsx',
    './site.less',
    // 'webpack-hot-middleware/client',
  ],
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/build/',
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, [/moment$/]),
    new ExtractTextPlugin('site.css', {allChunks: true}),
  ].concat(production ? [
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
  ] : [
    // new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ]),
  resolve: {
    extensions: [ // default: ["", ".webpack.js", ".web.js", ".js"]
      '',
      '.browser.ts',
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
    ],
  },
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loaders: ['babel-loader', 'ts-loader'],
        include: __dirname,
        exclude: /node_modules/,
      },
      {
        test: /\.jsx$/,
        loaders: ['babel-loader'],
        include: __dirname,
        exclude: /node_modules/,
      },
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader?minimize!autoprefixer-loader!less-loader'),
      },
    ],
  },
};

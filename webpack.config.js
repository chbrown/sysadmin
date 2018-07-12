var path = require('path');
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var env = process.env.NODE_ENV || 'development';

module.exports = {
  entry: [
    './app',
    './site.less',
    ...(env === 'development-hmr' ? ['webpack-hot-middleware/client'] : []),
  ],
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/build/',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.IgnorePlugin(/^\.\/locale$/, [/moment$/]),
    new ExtractTextPlugin('site.css', {allChunks: true}),
    ...(env === 'production' ?
      [new webpack.optimize.UglifyJsPlugin()] :
      [new webpack.NoErrorsPlugin()]
    ),
    ...(env === 'development-hmr' ?
      [new webpack.HotModuleReplacementPlugin()] :
      []
    ),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        include: __dirname,
        exclude: /node_modules/,
      },
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader?minimize!postcss-loader!less-loader'),
      },
    ],
  },
  postcss: () => [autoprefixer],
};

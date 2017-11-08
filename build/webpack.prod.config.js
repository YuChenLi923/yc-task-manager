const baseWebpackConfig = require('./webpack.base.config'),
      merge = require('webpack-merge'),
      webpack = require('webpack'),
      path = require('path'),
      rootPath = path.resolve(__dirname, '../'),
      entryPath = path.resolve(rootPath, './src/index.js');
module.exports = merge(baseWebpackConfig, {
  entry: {
    'index': entryPath
  },
  output: {
    path: rootPath,
    filename: '[name].js'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_debugger: true,
        drop_console: true
      },
      output: {
        comments: false
      }
    })
  ]
});
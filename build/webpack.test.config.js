const nodeExternals = require('webpack-node-externals'),
      path = require('path');
module.exports = {
  target: 'node', // webpack should compile node compatible code
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  resolve: {
    alias: {
      "async-task-manager" : path.resolve(__dirname, '../src/')
    }
  }
};
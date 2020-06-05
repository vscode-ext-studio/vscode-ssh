const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  mode: 'production',
  context: path.resolve(__dirname, '../'),
  entry: {
    webssh2: './src/xterm/js/index.js'
  },
  output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, '../resources/webview/xterm')
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  resolve: {
    extensions: ['.js', '.css'],
    alias: {
      '@': path.resolve(__dirname, '../src')
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin(['./src/xterm/client.html', './src/xterm/favicon.ico']),
    new ExtractTextPlugin('css/[name].css')
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({ test: /\.js(\?.*)?$/i, terserOptions: { parallel: 4, ie8: false, safari10: false } })],
  },
}

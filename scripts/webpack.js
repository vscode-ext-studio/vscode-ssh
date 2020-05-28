const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
module.exports = {
  context: path.resolve('__dirname', '../'),
  entry: {
    webssh2: './src/xterm/js/index.js'
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
      './src/xterm/client.html',
      './src/xterm/favicon.ico'
    ]),
    new ExtractTextPlugin('css/[name].css')
  ],
  output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, '../resources/webview/xterm')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader'
            }
          ]
        })
      }
    ]
  }
}

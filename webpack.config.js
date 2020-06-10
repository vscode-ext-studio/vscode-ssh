const isProd = process.argv.indexOf('-p') >= 0;

const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: {
    webssh2: './src/pages/xterm/js/index.js',
    connect: './src/pages/vue/connect/main.js',
    forward: './src/pages/vue/forward/main.js',
  },
  output: {
    filename: 'webview/js/[name].bundle.js',
    path: path.resolve(__dirname, 'out')
  },
  module: {
    rules: [
      { test: /\.css$/, use: ["vue-style-loader", "css-loader"] },
      { test: /\.vue$/, loader: 'vue-loader', options: { loaders: { css: ["vue-style-loader", "css-loader"] } } },
      { test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/, loader: 'url-loader', options: { limit: 80000 } }
    ]
  },
  resolve: {
    extensions: ['.vue', '.js', '.css'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': path.resolve(__dirname, '../src')
    }
  },
  plugins: [
    new VueLoaderPlugin(),
    new CopyWebpackPlugin([{ from: './src/pages/xterm/favicon.ico', to: './webview/xterm' }]),
    new HtmlWebpackPlugin({ inject: true, template: './src/pages/xterm/client.html', chunks: ['webssh2'], filename: 'webview/client.html' }),
    new HtmlWebpackPlugin({ inject: true, template: './src/pages/vue/common.html', chunks: ['connect'], filename: 'webview/connect.html' }),
    new HtmlWebpackPlugin({ inject: true, template: './src/pages/vue/common.html', chunks: ['forward'], filename: 'webview/forward.html' })
  ],
  optimization: {
    minimize: isProd,
    splitChunks: {
      cacheGroups: {
        vue: { name: "vue", test: /[\\/](vue)[\\/]/, chunks: "all", priority: 10 },
        elementUi: { name: "element-ui", test: /[\\/](element-ui)[\\/]/, chunks: "all", priority: 10 },
      }
    }
  },
  watch: !isProd,
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? false : 'source-map',
}

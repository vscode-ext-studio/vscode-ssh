const isProd = process.argv.indexOf('-p') >= 0;

const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = [{
  target: "node",
  node: {
    fs: 'empty', net: 'empty', tls: 'empty',
    child_process: 'empty', dns: 'empty',
    global: true, __dirname: true
  },
  entry: ['./src/extension.ts'],
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    // config source map sources url
    devtoolModuleFilenameTemplate: '[absoluteResourcePath]',
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: { rules: [{ test: /\.ts$/, exclude: /node_modules/, use: ['ts-loader'] }] },
  optimization: { minimize: false },
  watch: !isProd,
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? false : 'source-map',
},
{
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
]
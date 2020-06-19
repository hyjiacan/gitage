const path = require('path')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const distConfig = {
  entry: {
    app: './app/index.js'
  },
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  // optimization: {
  //   minimize: false
  // },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './static/',
          to: 'static'
        },
        {
          from: './templates/',
          to: 'templates'
        }
      ]
    })
  ]
}

module.exports = distConfig

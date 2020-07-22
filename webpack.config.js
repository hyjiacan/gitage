const path = require('path')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const distConfig = {
  entry: {
    gitage: './app/index.js'
  },
  target: 'node',
  node: {
    __dirname: false
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './web/',
          to: 'web'
        },
        {
          from: './app/assets/',
          to: 'assets'
        }
      ]
    })
  ],
  externals: {
    '../assets/mime': 'require(\'./assets/mime.json\')'
  }
}

module.exports = distConfig

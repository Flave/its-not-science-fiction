const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

module.exports = merge(common, {
  plugins: [
    new UglifyJSPlugin(),
    new CopyWebpackPlugin([
      {
        from: 'data/sites.json',
        to: 'data/sites.json',
      },
      {
        from: 'assets',
        to: 'assets',
      },
      {
        from: 'html/about',
        to: 'about',
      },
      {
        from: 'html/news',
        to: 'news',
      },
      {
        from: 'style/static.css',
        to: 'style/style.css',
      },
    ]),
  ],
});

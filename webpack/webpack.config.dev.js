const Path = require('path');
const Webpack = require('webpack');
const { merge } = require('webpack-merge');
const StylelintPlugin = require('stylelint-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const common = require('./webpack.common.js');
const fs = require('fs');
const nodeExternals = require('webpack-node-externals');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-source-map',
  output: {
    // path: Path.resolve('dist'),
    chunkFilename: 'js/[name].chunk.js',
  },
  devServer: {
    inline: true,
    hot: true,
    https: true,
  },
  plugins: [
    new Webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    // new StylelintPlugin({
    //   files: Path.join('src', '**/*.s?(a|c)ss'),
    // }),
    new MiniCssExtractPlugin({
      filename: Path.join('src', '**/*.s?(a|c)ss'),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        include: Path.resolve(__dirname, '../src'),
        enforce: 'pre',
        loader: 'eslint-loader',
        options: {
          emitWarning: true,
        },
      },
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
      {
        test: /\.js$/,
        include: Path.resolve(__dirname, '../src'),
        loader: 'babel-loader',
      },
      {
        test: /\.s?css$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          'css-loader',
        ],
        // use: ['style-loader', 'css-loader?sourceMap=true', 'postcss-loader', 'sass-loader'],
        // use: [
        //   'style-loader',
        //   'postcss-loader', 
        //   'sass-loader',
        //   {
        //     loader: 'css-loader',
        //     options:{
        //       sourceMap: true
        //     }
        //   },
        //   {
        //     options: {
        //       publicPath: ''
        //     }
        //   },
        // ]
      },
      {
        test: /\.(ogg)$/i,
        include: Path.resolve(__dirname, '../src'),
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          publicPath: '',
        }
      },
    ],
  },
});

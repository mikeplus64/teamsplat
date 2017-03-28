const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

function production(env) {
  return (env && env.production) || false;
}

const ExtractCssPlugin = new ExtractTextPlugin({
  filename: '[name].css',
  disable: false,
  allChunks: true,
});

module.exports = env => ({
  devtool: !production(env) ? 'cheap-module-eval-source-map' : undefined,
  entry: path.resolve(__dirname, 'js', 'index.jsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      use: 'babel-loader',
    }, {
      test: /\.(css|scss)$/,
      exclude: /node_modules/,
      use: ExtractCssPlugin.extract([{
        loader: 'css-loader',
        query: {
          sourceMap: !production(env),
          modules: true,
          importLoaders: 1,
          minimize: production(env),
          localIdentName: production(env) ?
            '[hash:base64:5]' :
            '[name]__[local]__[hash:base64:5]',
        },
      }, {
        loader: 'sass-loader',
      }]),
    }, {
      test: /\.(css|scss)$/,
      include: /node_modules/,
      use: ['style-loader', 'css-loader'],
    }],
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: production(env) ? 'production' : 'development',
    }),
    ExtractCssPlugin,
  ].concat(production(env) ? [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        screw_ie8: true,
        conditionals: true,
        unused: true,
        comparisons: true,
        sequences: true,
        dead_code: true,
        evaluate: true,
        if_return: true,
        join_vars: true,
      },
      output: {
        comments: false,
      },
    }),
  ] : []),
});

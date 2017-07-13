const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const ExtractCssPlugin = new ExtractTextPlugin({
  filename: '[name].css',
  disable: false,
  allChunks: true,
});

module.exports = (env) => {
  const production = env && env.production || false;
  const css = (opts, modules, localIdentName) => Object.assign({
    test: /\.(css|scss|sass)$/,
    use: ExtractCssPlugin.extract([{
      loader: 'css-loader',
      query: {
        sourceMap: production,
        modules: modules,
        importLoaders: 1,
        minimize: production,
        localIdentName: localIdentName,
      },
    }, {
      loader: 'sass-loader',
      query: {
        includePaths: [
          './node_modules',
          './node_modules/grommet/node_modules',
        ],
      },
    }]),
  }, opts);

  const options = {
    devtool: production ? undefined : 'cheap-module-eval-source-map',
    entry: path.resolve(__dirname, 'js', 'index.jsx'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
    },
    module: {
      rules: [{
        test: /\.(js|jsx)$/,
        use: 'babel-loader',
      },
        css({ exclude: /node_modules/ }, true, production ? '[hash:base64:5]' : '[name]__[local]__[hash:base64:5]'),
        css({ include: /node_modules/ }, false, '[name]'),
      ],
    },
    plugins: [
      new webpack.EnvironmentPlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(production ? 'production' : 'development'),
        },
      }),
      ExtractCssPlugin,
    ].concat(production ? [
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
  };
  return options;
};

const webpack = require('webpack');

module.exports = function override(config) {
  // Add fallbacks for node core modules
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify"),
    "url": require.resolve("url"),
    "util": require.resolve("util"),
    "zlib": require.resolve("browserify-zlib"),
    "process": require.resolve("process/browser.js"),
    "buffer": require.resolve("buffer/"),
    "path": require.resolve("path-browserify")
  });
  config.resolve.fallback = fallback;

  // Add plugins
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    })
  ]);

  // Add resolve aliases
  config.resolve.alias = {
    ...config.resolve.alias,
    'process': 'process/browser.js'
  };

  return config;
}; 
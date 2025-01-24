module.exports = function override(config, env) {
    config.module.rules.push({
      test: /pdf\.worker\.min\.js$/,
      use: {
        loader: "file-loader",
        options: {
          name: "[name].[hash:8].[ext]",
        },
      },
    });
    return config;
  };
  
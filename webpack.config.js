// webpack.config.js
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = {
  mode: process.env.NODE_ENV === "development" ? "development" : "production",
  devtool: process.env.NODE_ENV === "development" ? "inline-source-map" : false,

  entry: {
    background: "./src/background.js",
    content: "./src/content.js",
    popup: "./src/popup.js",
  },

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        // 👇 These two lines are the key: force ESM parsing
        type: "javascript/auto",
        parser: { javascript: { sourceType: "module" } },
        use: {
          loader: "esbuild-loader",
          options: {
            // Don’t change format; let Webpack handle modules
            target: "es2020",  // MV3 (Chrome 114+) is fine
          },
        },
      },
    ],
  },

  plugins: [
    new Dotenv(),
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/manifest.json", to: "manifest.json" },
        { from: "src/popup.html", to: "popup.html" },
        { from: "src/popup.css", to: "popup.css" },
        { from: "src/content.css", to: "content.css" },
        { from: "src/icons", to: "icons", noErrorOnMissing: true }, // fine if missing
      ],
    }),
  ],

  resolve: {
    extensions: [".js"],
    fallback: {},
  },
};

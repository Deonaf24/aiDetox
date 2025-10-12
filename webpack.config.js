// webpack.config.js
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: process.env.NODE_ENV === "development" ? "development" : "production",
  devtool: process.env.NODE_ENV === "development" ? "inline-source-map" : false,

  entry: {
    background: "./src/background.js",
    content: "./src/content.js",
    popup: "./src/popup/index.jsx",
  },

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        type: "javascript/auto",
        parser: { javascript: { sourceType: "module" } },
        use: {
          loader: "esbuild-loader",
          options: {
            target: "es2020",
            loader: "jsx",
            jsx: "automatic",
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: "postcss-loader",
          },
        ],
      },
    ],
  },

  plugins: [
    new Dotenv({
      // Loads .env, or .env.development / .env.production if present
      path: `./.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""}`,
      systemvars: true, // allow CI/shell vars to override
      override: false,  // shell/CI wins over .env
      silent: true,     // keep build output clean
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/manifest.json", to: "manifest.json" },
        { from: "src/popup.html", to: "popup.html" },
        { from: "src/content.css", to: "content.css" },
        { from: "src/icons", to: "icons", noErrorOnMissing: true },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
  ],

  resolve: {
    extensions: [".js", ".jsx"],
    fallback: {},
  },
};

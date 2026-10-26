const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

// Base config that applies to either development or production mode.
const config = {
  entry: "./src/index.ts",
  output: {
    // Compile the source files into a bundle.
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  // Enable webpack-dev-server to get hot refresh of the app.
  devServer: {
    static: "./build",
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Origin-Agent-Cluster": "?1",
    },
    proxy: [
      {
        // Use IPv4 explicitly to avoid IPv6 localhost (::1) mismatch
        // with API server bound to 127.0.0.1
        context: ["/api"],
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
        secure: false,
        ws: false,
      },
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: false,
            onlyCompileBundledFiles: false,
          },
        },
        exclude: /node_modules/,
      },
      {
        // Load CSS files. They can be imported into JS files.
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    // Generate the HTML index page based on our template.
    // This will output the same index page with the bundle we
    // created above added in a script tag.
    new HtmlWebpackPlugin({
      template: "src/index.html",
      // Disable html-minifier-terser which currently fails on our complex template
      minify: false,
    }),
    // Generate 404 page for production/static hosting
    new HtmlWebpackPlugin({
      template: "src/404.html",
      filename: "404.html",
      inject: false,
      minify: false,
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "node_modules/blockly/media", to: "media" },
        // Эталонные решения задач (показ ученику ПОСЛЕ верного решения)
        { from: "../solutions", to: "solutions" },
        // Copy Ace Editor "src-noconflict" distribution for dynamic loading of modes, themes, and workers
        { from: "node_modules/ace-builds/src-noconflict", to: "ace" },
        // Copy Fengari Web build to serve Lua runtime locally (avoid CDN in worker)
        {
          from: "node_modules/fengari-web/dist/fengari-web.js",
          to: "libs/fengari-web.js",
        },
        // Copy php-wasm runtime files for PHP execution in the sandbox worker
        {
          from: "node_modules/php-wasm/php-worker.js",
          to: "libs/php-wasm/php-worker.js",
        },
        {
          from: "node_modules/php-wasm/*.wasm",
          to: "libs/php-wasm/[name][ext]",
        },
        { from: "node_modules/php-wasm/*.so", to: "libs/php-wasm/[name][ext]" },
        // COOP/COEP заголовки для SharedArrayBuffer (input() в песочнице)
        // toType: "file" обязателен — без расширения CopyWebpackPlugin считает цель каталогом
        { from: ".htaccess", to: ".htaccess", toType: "file" },
        // Тот же набор заголовков для Cloudflare Pages (читает _headers из вывода сборки)
        { from: "_headers", to: "_headers", toType: "file" },
      ],
    }),
  ],
};

module.exports = (env, argv) => {
  if (argv.mode === "development") {
    // Set the output path to the `build` directory
    // so we don't clobber production builds.
    config.output.path = path.resolve(__dirname, "build");

    // Generate source maps for our code for easier debugging.
    // Not suitable for production builds. If you want source maps in
    // production, choose a different one from https://webpack.js.org/configuration/devtool
    config.devtool = "eval-cheap-module-source-map";

    // Include the source maps for Blockly for easier debugging Blockly code.
    config.module.rules.push({
      test: /(blockly\/.*\.js)$/,
      use: [require.resolve("source-map-loader")],
      enforce: "pre",
    });

    // Ignore spurious warnings from source-map-loader
    // It can't find source maps for some Closure modules and that is expected
    config.ignoreWarnings = [/Failed to parse source map/];
  }
  return config;
};

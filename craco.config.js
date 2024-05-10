const CopyPlugin = require("copy-webpack-plugin")
const path = require("path")
const { InjectManifest } = require("workbox-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
  webpack: {
    plugins: {
      add: [
        new CopyPlugin({
          // Use copy plugin to copy *.wasm to output folder.
          patterns: [
            {
              from: "node_modules/onnxruntime-web/dist/*.wasm",
              to: "static/js/[name][ext]",
            },
          ],
        }),
        new InjectManifest({
          swSrc: path.resolve(
            __dirname,
            // we'll create this file later on
            "./service-worker/serviceWorkerWorkbox.js"
          ),
          // this is the output of the plugin,
          // relative to webpack's output directory
          swDest: "service-worker.js",

          // 200mb cache max
          maximumFileSizeToCacheInBytes: 200 * 1024 * 1024,
        }),
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, "./public"),
              globOptions: { ignore: ["**/index.html"] },
            },
          ],
        }),
      ],
    },
    configure: (config) => {
      // manifest

      // set resolve.fallback for opencv.js
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      }
      return config
    },
  },
}

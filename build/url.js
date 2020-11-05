module.exports = Object.assign(
  {},
  require("rollup-plugin-node-polyfills/polyfills/url.js"),
  {
    pathToFileURL: (path)=> { return `file:///${encodeURIComponent(path)}` },
    fileURLToPath: (fileURL)=> { return decodeURIComponent(fileURL.toString().replace(/^file:\/\/\//, '')) }
  }
)

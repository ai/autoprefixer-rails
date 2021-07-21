import path from 'path'
import alias from '@rollup/plugin-alias'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import replace from '@rollup/plugin-replace'
import inject from '@rollup/plugin-inject'

export default {
  input: 'autoprefixer.js',
  output: {
    file: '../vendor/autoprefixer.js',
    format: 'iife',
    name: 'autoprefixer',
    sourcemap: 'inline'
  },
  plugins: [
    // patches for browser build
    replace({
      "colorette.enabled": "null",
      "existsSync(": "void(",
      include: ["node_modules/postcss/lib/css-syntax-error.js", "node_modules/postcss/lib/previous-map.js"],
      delimiters: ['', '']
    }),
    json(),
    alias({
      entries: [
        { find: '@babel/register', replacement: 'nop' },
        { find: '@babel/core', replacement: 'nop' },
        { find: 'url', replacement: path.resolve(__dirname, 'url.js') }
      ]
    }),
    commonjs({
      transformMixedEsModules: true
    }),
    nodeResolve({
      browser: true,
      preferBuiltins: false,
      extensions: [".mjs", ".js", ".json", ".node", ".es6"]
    }),
    nodePolyfills(),
	inject({
      URL: ['whatwg-url', 'URL'],
      TextEncoder: ['text-encoding', 'TextEncoder'],
      TextDecoder: ['text-encoding', 'TextDecoder']
    })
  ]
}

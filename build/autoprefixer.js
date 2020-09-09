import postcss from 'postcss'
import autoprefixer from 'autoprefixer'

export default {
  process: (css, processOptions, pluginOptions) => {
    // execjs does not support passing callback from ruby,
    // which makes waiting for the promise to settle from async function impossible
    var result = postcss([autoprefixer(pluginOptions)]).process(css, processOptions)

    var warns  = result.warnings().map(function (i) {
      delete i.plugin
      return i.toString()
    })

    var map = result.map ? result.map.toString() : null
    return  { css: result.css, map: map, warnings: warns }
  },

  info: (options) => {
    return autoprefixer(options).info()
  }
}

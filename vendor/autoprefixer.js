;(function () {
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("visionmedia-css-parse/index.js", function(exports, require, module){

module.exports = function(css, options){
  options = options || {};

  /**
   * Positional.
   */

  var lineno = 1;
  var column = 1;

  /**
   * Update lineno and column based on `str`.
   */

  function updatePosition(str) {
    var lines = str.match(/\n/g);
    if (lines) lineno += lines.length;
    var i = str.lastIndexOf('\n');
    column = ~i ? str.length-i : column + str.length;
  }

  function position() {
    var start = { line: lineno, column: column };
    if (!options.position) return positionNoop;
    return function(node){
      node.position = {
        start: start,
        end: { line: lineno, column: column }
      };
      whitespace();
      return node;
    }
  }

  /**
   * Return `node`.
   */
  function positionNoop(node) {
    whitespace();
    return node;
  }

  /**
   * Parse stylesheet.
   */

  function stylesheet() {
    return {
      type: 'stylesheet',
      stylesheet: {
        rules: rules()
      }
    };
  }

  /**
   * Opening brace.
   */

  function open() {
    return match(/^{\s*/);
  }

  /**
   * Closing brace.
   */

  function close() {
    return match(/^}/);
  }

  /**
   * Parse ruleset.
   */

  function rules() {
    var node;
    var rules = [];
    whitespace();
    comments(rules);
    while (css[0] != '}' && (node = atrule() || rule())) {
      rules.push(node);
      comments(rules);
    }
    return rules;
  }

  /**
   * Match `re` and return captures.
   */

  function match(re) {
    var m = re.exec(css);
    if (!m) return;
    var str = m[0];
    updatePosition(str);
    css = css.slice(str.length);
    return m;
  }

  /**
   * Parse whitespace.
   */

  function whitespace() {
    match(/^\s*/);
  }

  /**
   * Parse comments;
   */

  function comments(rules) {
    var c;
    rules = rules || [];
    while (c = comment()) rules.push(c);
    return rules;
  }

  /**
   * Parse comment.
   */

  function comment() {
    var pos = position();
    if ('/' != css[0] || '*' != css[1]) return;

    var i = 2;
    while (null != css[i] && ('*' != css[i] || '/' != css[i + 1])) ++i;
    i += 2;

    var str = css.slice(2, i - 2);
    column += 2;
    updatePosition(str);
    css = css.slice(i);
    column += 2;
    return pos({
      type: 'comment',
      comment: str
    });
  }

  /**
   * Parse selector.
   */

  function selector() {
    var m = match(/^([^{]+)/);
    if (!m) return;
    return m[0].trim().split(/\s*,\s*/);
  }

  /**
   * Parse declaration.
   */

  function declaration() {
    var pos = position();

    // prop
    var prop = match(/^(\*?[-\w]+)\s*/);
    if (!prop) return;
    prop = prop[0];

    // :
    if (!match(/^:\s*/)) return;

    // val
    var val = match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/);
    if (!val) return;

    var ret = pos({
      type: 'declaration',
      property: prop,
      value: val[0].trim()
    });

    // ;
    match(/^[;\s]*/);
    return ret;
  }

  /**
   * Parse declarations.
   */

  function declarations() {
    var decls = [];

    if (!open()) return;
    comments(decls);

    // declarations
    var decl;
    while (decl = declaration()) {
      decls.push(decl);
      comments(decls);
    }

    if (!close()) return;
    return decls;
  }

  /**
   * Parse keyframe.
   */

  function keyframe() {
    var m;
    var vals = [];
    var pos = position();

    while (m = match(/^(from|to|\d+%|\.\d+%|\d+\.\d+%)\s*/)) {
      vals.push(m[1]);
      match(/^,\s*/);
    }

    if (!vals.length) return;

    return pos({
      type: 'keyframe',
      values: vals,
      declarations: declarations()
    });
  }

  /**
   * Parse keyframes.
   */

  function atkeyframes() {
    var pos = position();
    var m = match(/^@([-\w]+)?keyframes */);

    if (!m) return;
    var vendor = m[1];

    // identifier
    var m = match(/^([-\w]+)\s*/);
    if (!m) return;
    var name = m[1];

    if (!open()) return;
    comments();

    var frame;
    var frames = [];
    while (frame = keyframe()) {
      frames.push(frame);
      comments();
    }

    if (!close()) return;

    return pos({
      type: 'keyframes',
      name: name,
      vendor: vendor,
      keyframes: frames
    });
  }

  /**
   * Parse supports.
   */

  function atsupports() {
    var pos = position();
    var m = match(/^@supports *([^{]+)/);

    if (!m) return;
    var supports = m[1].trim();

    if (!open()) return;
    comments();

    var style = rules();

    if (!close()) return;

    return pos({
      type: 'supports',
      supports: supports,
      rules: style
    });
  }

  /**
   * Parse media.
   */

  function atmedia() {
    var pos = position();
    var m = match(/^@media *([^{]+)/);

    if (!m) return;
    var media = m[1].trim();

    if (!open()) return;
    comments();

    var style = rules();

    if (!close()) return;

    return pos({
      type: 'media',
      media: media,
      rules: style
    });
  }

  /**
   * Parse paged media.
   */

  function atpage() {
    var pos = position();
    var m = match(/^@page */);
    if (!m) return;

    var sel = selector() || [];
    var decls = [];

    if (!open()) return;
    comments();

    // declarations
    var decl;
    while (decl = declaration()) {
      decls.push(decl);
      comments();
    }

    if (!close()) return;

    return pos({
      type: 'page',
      selectors: sel,
      declarations: decls
    });
  }

  /**
   * Parse document.
   */

  function atdocument() {
    var pos = position();
    var m = match(/^@([-\w]+)?document *([^{]+)/);
    if (!m) return;

    var vendor = m[1].trim();
    var doc = m[2].trim();

    if (!open()) return;
    comments();

    var style = rules();

    if (!close()) return;

    return pos({
      type: 'document',
      document: doc,
      vendor: vendor,
      rules: style
    });
  }

  /**
   * Parse import
   */

  function atimport() {
    return _atrule('import');
  }

  /**
   * Parse charset
   */

  function atcharset() {
    return _atrule('charset');
  }

  /**
   * Parse namespace
   */

  function atnamespace() {
    return _atrule('namespace')
  }

  /**
   * Parse non-block at-rules
   */

  function _atrule(name) {
    var pos = position();
    var m = match(new RegExp('^@' + name + ' *([^;\\n]+);'));
    if (!m) return;
    var ret = { type: name };
    ret[name] = m[1].trim();
    return pos(ret);
  }

  /**
   * Parse at rule.
   */

  function atrule() {
    return atkeyframes()
      || atmedia()
      || atsupports()
      || atimport()
      || atcharset()
      || atnamespace()
      || atdocument()
      || atpage();
  }

  /**
   * Parse rule.
   */

  function rule() {
    var pos = position();
    var sel = selector();

    if (!sel) return;
    comments();

    return pos({
      type: 'rule',
      selectors: sel,
      declarations: declarations()
    });
  }

  return stylesheet();
};


});
require.register("visionmedia-css-stringify/index.js", function(exports, require, module){

/**
 * Stringfy the given AST `node`.
 *
 * @param {Object} node
 * @param {Object} options
 * @return {String}
 * @api public
 */

module.exports = function(node, options){
  return new Compiler(options).compile(node);
};

/**
 * Initialize a new `Compiler`.
 */

function Compiler(options) {
  options = options || {};
  this.compress = options.compress;
  this.indentation = options.indent;
}

/**
 * Compile `node`.
 */

Compiler.prototype.compile = function(node){
  return node.stylesheet
    .rules.map(this.visit, this)
    .join(this.compress ? '' : '\n\n');
};

/**
 * Visit `node`.
 */

Compiler.prototype.visit = function(node){
  return this[node.type](node);
};

/**
 * Visit comment node.
 */

Compiler.prototype.comment = function(node){
  if (this.compress) return '';
  return '/*' + node.comment + '*/';
};

/**
 * Visit import node.
 */

Compiler.prototype.import = function(node){
  return '@import ' + node.import + ';';
};

/**
 * Visit media node.
 */

Compiler.prototype.media = function(node){
  if (this.compress) {
    return '@media '
      + node.media
      + '{'
      + node.rules.map(this.visit, this).join('')
      + '}';
  }

  return '@media '
    + node.media
    + ' {\n'
    + this.indent(1)
    + node.rules.map(this.visit, this).join('\n\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit document node.
 */

Compiler.prototype.document = function(node){
  var doc = '@' + (node.vendor || '') + 'document ' + node.document;

  if (this.compress) {
    return doc
      + '{'
      + node.rules.map(this.visit, this).join('')
      + '}';
  }

  return doc + ' '
    + ' {\n'
    + this.indent(1)
    + node.rules.map(this.visit, this).join('\n\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit charset node.
 */

Compiler.prototype.charset = function(node){
  if (this.compress) {
    return '@charset ' + node.charset + ';';
  }

  return '@charset ' + node.charset + ';\n';
};

/**
 * Visit keyframes node.
 */

Compiler.prototype.keyframes = function(node){
  if (this.compress) {
    return '@'
      + (node.vendor || '')
      + 'keyframes '
      + node.name
      + '{'
      + node.keyframes.map(this.keyframe, this).join('')
      + '}';
  }

  return '@'
    + (node.vendor || '')
    + 'keyframes '
    + node.name
    + ' {\n'
    + this.indent(1)
    + node.keyframes.map(this.keyframe, this).join('\n')
    + this.indent(-1)
    + '}';
};

/**
 * Visit keyframe node.
 */

Compiler.prototype.keyframe = function(node){
  if (this.compress) {
    return node.values.join(',')
      + '{'
      + node.declarations.map(this.declaration, this).join(';')
      + '}';
  }

  return this.indent()
    + node.values.join(', ')
    + ' {\n'
    + this.indent(1)
    + node.declarations.map(this.declaration, this).join(';\n')
    + this.indent(-1)
    + '\n' + this.indent() + '}\n';
};

/**
 * Visit page node.
 */

Compiler.prototype.page = function(node){
  return '@page ' + node.selectors.join(', ')
    + ' {\n'
    + this.indent(1)
    + node.declarations.map(this.declaration, this).join(';\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit rule node.
 */

Compiler.prototype.rule = function(node){
  var indent = this.indent();
  var decls = node.declarations;

  if (this.compress) {
    if (!decls.length) return '';

    return node.selectors.join(',')
      + '{'
      + decls.map(this.declaration, this).join(';')
      + '}';
  }

  return node.selectors.map(function(s){ return indent + s }).join(',\n')
    + ' {\n'
    + this.indent(1)
    + decls.map(this.declaration, this).join(';\n')
    + this.indent(-1)
    + '\n' + this.indent() + '}';
};

/**
 * Visit declaration node.
 */

Compiler.prototype.declaration = function(node){
  if (this.compress) {
    return node.property + ':' + node.value;
  }

  return this.indent() + node.property + ': ' + node.value;
};

/**
 * Increase, decrease or return current indentation.
 */

Compiler.prototype.indent = function(level) {
  this.level = this.level || 1;

  if (null != level) {
    this.level += level;
    return '';
  }

  return Array(this.level).join(this.indentation || '  ');
};

});
require.register("visionmedia-css/index.js", function(exports, require, module){

exports.parse = require('css-parse');
exports.stringify = require('css-stringify');

});
require.register("visionmedia-debug/index.js", function(exports, require, module){
if ('undefined' == typeof window) {
  module.exports = require('./lib/debug');
} else {
  module.exports = require('./debug');
}

});
require.register("visionmedia-debug/debug.js", function(exports, require, module){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

if (window.localStorage) debug.enable(localStorage.debug);

});
require.register("component-color-parser/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var colors = require('./colors');

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Parse `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

function parse(str) {
  return named(str)
    || hex3(str)
    || hex6(str)
    || rgb(str)
    || rgba(str);
}

/**
 * Parse named css color `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function named(str) {
  var c = colors[str.toLowerCase()];
  if (!c) return;
  return {
    r: c[0],
    g: c[1],
    b: c[2]
  }
}

/**
 * Parse rgb(n, n, n)
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function rgb(str) {
  if (0 == str.indexOf('rgb(')) {
    str = str.match(/rgb\(([^)]+)\)/)[1];
    var parts = str.split(/ *, */).map(Number);
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: 1
    }
  }
}

/**
 * Parse rgba(n, n, n, n)
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function rgba(str) {
  if (0 == str.indexOf('rgba(')) {
    str = str.match(/rgba\(([^)]+)\)/)[1];
    var parts = str.split(/ *, */).map(Number);
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts[3]
    }
  }
}

/**
 * Parse #nnnnnn
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function hex6(str) {
  if ('#' == str[0] && 7 == str.length) {
    return {
      r: parseInt(str.slice(1, 3), 16),
      g: parseInt(str.slice(3, 5), 16),
      b: parseInt(str.slice(5, 7), 16),
      a: 1
    }
  }
}

/**
 * Parse #nnn
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function hex3(str) {
  if ('#' == str[0] && 4 == str.length) {
    return {
      r: parseInt(str[1] + str[1], 16),
      g: parseInt(str[2] + str[2], 16),
      b: parseInt(str[3] + str[3], 16),
      a: 1
    }
  }
}


});
require.register("component-color-parser/colors.js", function(exports, require, module){

module.exports = {
    aliceblue: [240, 248, 255]
  , antiquewhite: [250, 235, 215]
  , aqua: [0, 255, 255]
  , aquamarine: [127, 255, 212]
  , azure: [240, 255, 255]
  , beige: [245, 245, 220]
  , bisque: [255, 228, 196]
  , black: [0, 0, 0]
  , blanchedalmond: [255, 235, 205]
  , blue: [0, 0, 255]
  , blueviolet: [138, 43, 226]
  , brown: [165, 42, 42]
  , burlywood: [222, 184, 135]
  , cadetblue: [95, 158, 160]
  , chartreuse: [127, 255, 0]
  , chocolate: [210, 105, 30]
  , coral: [255, 127, 80]
  , cornflowerblue: [100, 149, 237]
  , cornsilk: [255, 248, 220]
  , crimson: [220, 20, 60]
  , cyan: [0, 255, 255]
  , darkblue: [0, 0, 139]
  , darkcyan: [0, 139, 139]
  , darkgoldenrod: [184, 132, 11]
  , darkgray: [169, 169, 169]
  , darkgreen: [0, 100, 0]
  , darkgrey: [169, 169, 169]
  , darkkhaki: [189, 183, 107]
  , darkmagenta: [139, 0, 139]
  , darkolivegreen: [85, 107, 47]
  , darkorange: [255, 140, 0]
  , darkorchid: [153, 50, 204]
  , darkred: [139, 0, 0]
  , darksalmon: [233, 150, 122]
  , darkseagreen: [143, 188, 143]
  , darkslateblue: [72, 61, 139]
  , darkslategray: [47, 79, 79]
  , darkslategrey: [47, 79, 79]
  , darkturquoise: [0, 206, 209]
  , darkviolet: [148, 0, 211]
  , deeppink: [255, 20, 147]
  , deepskyblue: [0, 191, 255]
  , dimgray: [105, 105, 105]
  , dimgrey: [105, 105, 105]
  , dodgerblue: [30, 144, 255]
  , firebrick: [178, 34, 34]
  , floralwhite: [255, 255, 240]
  , forestgreen: [34, 139, 34]
  , fuchsia: [255, 0, 255]
  , gainsboro: [220, 220, 220]
  , ghostwhite: [248, 248, 255]
  , gold: [255, 215, 0]
  , goldenrod: [218, 165, 32]
  , gray: [128, 128, 128]
  , green: [0, 128, 0]
  , greenyellow: [173, 255, 47]
  , grey: [128, 128, 128]
  , honeydew: [240, 255, 240]
  , hotpink: [255, 105, 180]
  , indianred: [205, 92, 92]
  , indigo: [75, 0, 130]
  , ivory: [255, 255, 240]
  , khaki: [240, 230, 140]
  , lavender: [230, 230, 250]
  , lavenderblush: [255, 240, 245]
  , lawngreen: [124, 252, 0]
  , lemonchiffon: [255, 250, 205]
  , lightblue: [173, 216, 230]
  , lightcoral: [240, 128, 128]
  , lightcyan: [224, 255, 255]
  , lightgoldenrodyellow: [250, 250, 210]
  , lightgray: [211, 211, 211]
  , lightgreen: [144, 238, 144]
  , lightgrey: [211, 211, 211]
  , lightpink: [255, 182, 193]
  , lightsalmon: [255, 160, 122]
  , lightseagreen: [32, 178, 170]
  , lightskyblue: [135, 206, 250]
  , lightslategray: [119, 136, 153]
  , lightslategrey: [119, 136, 153]
  , lightsteelblue: [176, 196, 222]
  , lightyellow: [255, 255, 224]
  , lime: [0, 255, 0]
  , limegreen: [50, 205, 50]
  , linen: [250, 240, 230]
  , magenta: [255, 0, 255]
  , maroon: [128, 0, 0]
  , mediumaquamarine: [102, 205, 170]
  , mediumblue: [0, 0, 205]
  , mediumorchid: [186, 85, 211]
  , mediumpurple: [147, 112, 219]
  , mediumseagreen: [60, 179, 113]
  , mediumslateblue: [123, 104, 238]
  , mediumspringgreen: [0, 250, 154]
  , mediumturquoise: [72, 209, 204]
  , mediumvioletred: [199, 21, 133]
  , midnightblue: [25, 25, 112]
  , mintcream: [245, 255, 250]
  , mistyrose: [255, 228, 225]
  , moccasin: [255, 228, 181]
  , navajowhite: [255, 222, 173]
  , navy: [0, 0, 128]
  , oldlace: [253, 245, 230]
  , olive: [128, 128, 0]
  , olivedrab: [107, 142, 35]
  , orange: [255, 165, 0]
  , orangered: [255, 69, 0]
  , orchid: [218, 112, 214]
  , palegoldenrod: [238, 232, 170]
  , palegreen: [152, 251, 152]
  , paleturquoise: [175, 238, 238]
  , palevioletred: [219, 112, 147]
  , papayawhip: [255, 239, 213]
  , peachpuff: [255, 218, 185]
  , peru: [205, 133, 63]
  , pink: [255, 192, 203]
  , plum: [221, 160, 203]
  , powderblue: [176, 224, 230]
  , purple: [128, 0, 128]
  , red: [255, 0, 0]
  , rosybrown: [188, 143, 143]
  , royalblue: [65, 105, 225]
  , saddlebrown: [139, 69, 19]
  , salmon: [250, 128, 114]
  , sandybrown: [244, 164, 96]
  , seagreen: [46, 139, 87]
  , seashell: [255, 245, 238]
  , sienna: [160, 82, 45]
  , silver: [192, 192, 192]
  , skyblue: [135, 206, 235]
  , slateblue: [106, 90, 205]
  , slategray: [119, 128, 144]
  , slategrey: [119, 128, 144]
  , snow: [255, 255, 250]
  , springgreen: [0, 255, 127]
  , steelblue: [70, 130, 180]
  , tan: [210, 180, 140]
  , teal: [0, 128, 128]
  , thistle: [216, 191, 216]
  , tomato: [255, 99, 71]
  , turquoise: [64, 224, 208]
  , violet: [238, 130, 238]
  , wheat: [245, 222, 179]
  , white: [255, 255, 255]
  , whitesmoke: [245, 245, 245]
  , yellow: [255, 255, 0]
  , yellowgreen: [154, 205, 5]
};
});
require.register("component-path/index.js", function(exports, require, module){

exports.basename = function(path){
  return path.split('/').pop();
};

exports.dirname = function(path){
  return path.split('/').slice(0, -1).join('/') || '.'; 
};

exports.extname = function(path){
  var base = exports.basename(path);
  if (!~base.indexOf('.')) return '';
  var ext = base.split('.').pop();
  return '.' + ext;
};
});
require.register("visionmedia-rework/index.js", function(exports, require, module){

module.exports = require('./lib/rework');
});
require.register("visionmedia-rework/lib/rework.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var css = require('css');

/**
 * Expose `rework`.
 */

exports = module.exports = rework;

/**
 * Expose `visit` helpers.
 */

exports.visit = require('./visit');

/**
 * Expose prefix properties.
 */

exports.properties = require('./properties');

/**
 * Initialize a new stylesheet `Rework` with `str`.
 *
 * @param {String} str
 * @return {Rework}
 * @api public
 */

function rework(str) {
  return new Rework(css.parse(str));
}

/**
 * Initialize a new stylesheet `Rework` with `obj`.
 *
 * @param {Object} obj
 * @api private
 */

function Rework(obj) {
  this.obj = obj;
}

/**
 * Use the given plugin `fn(style, rework)`.
 *
 * @param {Function} fn
 * @return {Rework}
 * @api public
 */

Rework.prototype.use = function(fn){
  fn(this.obj.stylesheet, this);
  return this;
};

/**
 * Specify global vendor `prefixes`,
 * explicit ones may still be passed
 * to most plugins.
 *
 * @param {Array} prefixes
 * @return {Rework}
 * @api public
 */

Rework.prototype.vendors = function(prefixes){
  this.prefixes = prefixes;
  return this;
};

/**
 * Stringify the stylesheet.
 *
 * @param {Object} options
 * @return {String}
 * @api public
 */

Rework.prototype.toString = function(options){
  return css.stringify(this.obj, options);
};

/**
 * Expose plugins.
 */

exports.media = require('./plugins/media');
exports.mixin = exports.mixins = require('./plugins/mixin');
exports.function = exports.functions = require('./plugins/function');
exports.prefix = require('./plugins/prefix');
exports.colors = require('./plugins/colors');
exports.extend = require('./plugins/extend');
exports.references = require('./plugins/references');
exports.prefixValue = require('./plugins/prefix-value');
exports.prefixSelectors = require('./plugins/prefix-selectors');
exports.keyframes = require('./plugins/keyframes');
exports.opacity = require('./plugins/opacity');
exports.at2x = require('./plugins/at2x');
exports.url = require('./plugins/url');
exports.ease = require('./plugins/ease');
exports.vars = require('./plugins/vars');
exports.inline = require('./plugins/inline');

});
require.register("visionmedia-rework/lib/utils.js", function(exports, require, module){

/**
 * Strip `str` quotes.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.stripQuotes = function(str) {
  if ('"' == str[0] || "'" == str[0]) return str.slice(1, -1);
  return str;
};
});
require.register("visionmedia-rework/lib/visit.js", function(exports, require, module){

/**
 * Visit `node`'s declarations recursively and
 * invoke `fn(declarations, node)`.
 *
 * @param {Object} node
 * @param {Function} fn
 * @api private
 */

exports.declarations = function(node, fn){
  node.rules.forEach(function(rule){
    // @media etc
    if (rule.rules) {
      exports.declarations(rule, fn);
      return;
    }

    // keyframes
    if (rule.keyframes) {
      rule.keyframes.forEach(function(keyframe){
        fn(keyframe.declarations, rule);
      });
      return;
    }

    // @charset, @import etc
    if (!rule.declarations) return;

    fn(rule.declarations, node);
  });
};

});
require.register("visionmedia-rework/lib/properties.js", function(exports, require, module){

/**
 * Prefixed properties.
 */

module.exports = [
  'animation',
  'animation-delay',
  'animation-direction',
  'animation-duration',
  'animation-fill-mode',
  'animation-iteration-count',
  'animation-name',
  'animation-play-state',
  'animation-timing-function',
  'appearance',
  'background-visibility',
  'background-composite',
  'blend-mode',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'border-fit',
  'border-image',
  'border-vertical-spacing',
  'box-align',
  'box-direction',
  'box-flex',
  'box-flex-group',
  'box-lines',
  'box-ordinal-group',
  'box-orient',
  'box-pack',
  'box-reflect',
  'box-sizing',
  'clip-path',
  'column-count',
  'column-width',
  'column-min-width',
  'column-width-policy',
  'column-gap',
  'column-rule',
  'column-rule-color',
  'column-rule-style',
  'column-rule-width',
  'column-span',
  'flex',
  'flex-basis',
  'flex-direction',
  'flex-flow',
  'flex-grow',
  'flex-shrink',
  'flex-wrap',
  'flex-flow-from',
  'flex-flow-into',
  'font-smoothing',
  'transform',
  'transform-origin',
  'transform-origin-x',
  'transform-origin-y',
  'transform-origin-z',
  'transform-style',
  'transition',
  'transition-delay',
  'transition-duration',
  'transition-property',
  'transition-timing-function',
  'user-drag',
  'user-modify',
  'user-select',
  'wrap',
  'wrap-flow',
  'wrap-margin',
  'wrap-padding',
  'wrap-through'
];

});
require.register("visionmedia-rework/lib/plugins/function.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var visit = require('../visit')
  , utils = require('../utils');

/**
 * Define custom function.
 */

module.exports = function(functions) {
  if (!functions) throw new Error('functions object required');
  return function(style, rework){
    visit.declarations(style, function(declarations){
      for (var name in functions) {
        func(declarations, name, functions[name]);
      }
    });
  }
};

/**
 * Escape regexp codes in string.
 *
 * @param {String} s
 * @api private
 */

function escape(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Visit declarations and apply functions.
 *
 * @param {Array} declarations
 * @param {Object} functions
 * @api private
 */

function func(declarations, name, func) {
  var regexp = new RegExp(escape(name) + '\\(([^\)]+)\\)', 'g');
  declarations.forEach(function(decl){
    if (!~decl.value.indexOf(name + '(')) return;
    decl.value = decl.value.replace(regexp, function(_, args){
      args = args.split(/,\s*/).map(utils.stripQuotes);
      return func.apply(decl, args);
    });
  });
}

});
require.register("visionmedia-rework/lib/plugins/url.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var utils = require('../utils')
  , func = require('./function');

/**
 * Map `url()` calls.
 *
 *   body {
 *     background: url(/images/bg.png);
 *   }
 *
 * yields:
 *
 *   body {
 *     background: url(http://example.com/images/bg.png);
 *   }
 *
 */

module.exports = function(fn) {
  return func({ url: url });

  function url(path){
    return 'url("' + fn(path) + '")';
  };
};

});
require.register("visionmedia-rework/lib/plugins/vars.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var visit = require('../visit');

/**
 * Add variable support.
 *
 *   :root {
 *     var-header-color: #06c;
 *   }
 *
 *   h1 {
 *     background-color: var(header-color);
 *   }
 *
 * yields:
 *
 *   h1 {
 *     background-color: #06c;
 *   }
 *
 */

module.exports = function(map) {
  map = map || {};

  function replace(str) {
    return str.replace(/\bvar\((.*?)\)/g, function(_, name){
      var val = map[name];
      if (!val) throw new Error('variable "' + name + '" is undefined');
      if (val.match(/\bvar\(/)) val = replace(val);
      return val;
    });
  }

  return function vars(style){
    visit.declarations(style, function(declarations, node){
      // map vars
      declarations.forEach(function(decl){
        if (0 != decl.property.indexOf('var-')) return;
        var name = decl.property.replace('var-', '');
        map[name] = decl.value;
      });

      // substitute values
      declarations.forEach(function(decl){
        if (!decl.value.match(/\bvar\(/)) return;
        decl.value = replace(decl.value);
      });
    });
  }
};

});
require.register("visionmedia-rework/lib/plugins/ease.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var visit = require('../visit');

/**
 * Easing functions.
 */

var ease = {
  'ease-in-out-back': 'cubic-bezier(0.680, -0.550, 0.265, 1.550)',
  'ease-in-out-circ': 'cubic-bezier(0.785, 0.135, 0.150, 0.860)',
  'ease-in-out-expo': 'cubic-bezier(1.000, 0.000, 0.000, 1.000)',
  'ease-in-out-sine': 'cubic-bezier(0.445, 0.050, 0.550, 0.950)',
  'ease-in-out-quint': 'cubic-bezier(0.860, 0.000, 0.070, 1.000)',
  'ease-in-out-quart': 'cubic-bezier(0.770, 0.000, 0.175, 1.000)',
  'ease-in-out-cubic': 'cubic-bezier(0.645, 0.045, 0.355, 1.000)',
  'ease-in-out-quad': 'cubic-bezier(0.455, 0.030, 0.515, 0.955)',
  'ease-out-back': 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
  'ease-out-circ': 'cubic-bezier(0.075, 0.820, 0.165, 1.000)',
  'ease-out-expo': 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
  'ease-out-sine': 'cubic-bezier(0.390, 0.575, 0.565, 1.000)',
  'ease-out-quint': 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
  'ease-out-quart': 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',
  'ease-out-cubic': 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
  'ease-out-quad': 'cubic-bezier(0.250, 0.460, 0.450, 0.940)',
  'ease-in-back': 'cubic-bezier(0.600, -0.280, 0.735, 0.045)',
  'ease-in-circ': 'cubic-bezier(0.600, 0.040, 0.980, 0.335)',
  'ease-in-expo': 'cubic-bezier(0.950, 0.050, 0.795, 0.035)',
  'ease-in-sine': 'cubic-bezier(0.470, 0.000, 0.745, 0.715)',
  'ease-in-quint': 'cubic-bezier(0.755, 0.050, 0.855, 0.060)',
  'ease-in-quart': 'cubic-bezier(0.895, 0.030, 0.685, 0.220)',
  'ease-in-cubic': 'cubic-bezier(0.550, 0.055, 0.675, 0.190)',
  'ease-in-quad': 'cubic-bezier(0.550, 0.085, 0.680, 0.530)'
};

/**
 * Keys.
 */

var keys = Object.keys(ease);

/**
 * Provide additional easing functions:
 *
 *    #logo {
 *      transition: all 500ms ease-out-back;
 *    }
 *
 * yields:
 *
 *    #logo {
 *      transition: all 500ms cubic-bezier(0.175, 0.885, 0.320, 1.275)
 *    }
 *
 */

module.exports = function() {
  return function(style, rework){
    visit.declarations(style, substitute);
  }
};

/**
 * Substitute easing functions.
 *
 * @api private
 */

function substitute(declarations) {
  for (var i = 0, len = declarations.length; i < len; ++i) {
    var decl = declarations[i];
    if (!~decl.property.indexOf('transition')) continue;
    for (var k = 0; k < keys.length; ++k) {
      var key = keys[k];
      if (~decl.value.indexOf(key)) {
        decl.value = decl.value.replace(key, ease[key]);
        break;
      }
    }
  }
}

});
require.register("visionmedia-rework/lib/plugins/at2x.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var utils = require('../utils')
  , path = require('path')
  , stripQuotes = utils.stripQuotes;

/**
 * Translate
 *
 *   .logo {
 *     background-image: url('/public/images/logo.png')
 *   }
 *
 * yields:
 *
 *   .logo {
 *     background-image: url('/public/images/logo.png')
 *   }
 *
 *   @media all and (-webkit-min-device-pixel-ratio : 1.5) {
 *     .logo {
 *       background-image: url("/public/images/logo@2x.png");
 *       background-size: contain
 *     }
 *   }
 *
 */

module.exports = function(vendors) {
  return function(style, rework){
    vendors = vendors || rework.prefixes;

    style.rules.forEach(function(rule){
      if (!rule.declarations) return;

      rule.declarations.filter(backgroundWithURL).forEach(function(decl){
        // parse url
        var i = decl.value.indexOf('url(');
        var url = stripQuotes(decl.value.slice(i + 4, decl.value.indexOf(')', i)));
        var ext = path.extname(url);

        // ignore .svg
        if ('.svg' == ext) return;

        // @2x value
        url = path.join(path.dirname(url), path.basename(url, ext) + '@2x' + ext);

        // wrap in @media
        style.rules.push({
          media: 'all and (-webkit-min-device-pixel-ratio: 1.5)',
          rules: [
            {
              selectors: rule.selectors,
              declarations: [
                {
                  property: 'background-image',
                  value: 'url("' + url + '")'
                },
                {
                  property: 'background-size',
                  value: 'contain'
                }
              ]
            }
          ]
        });
      });
    });
  };

  return function(style, rework) {
    vendors = vendors || rework.prefixes;
    visit(style.rules, style);
  };
};

/**
 * Filter background[-image] with url().
 */

function backgroundWithURL(decl) {
  return ('background' == decl.property
    || 'background-image' == decl.property)
    && ~decl.value.indexOf('url(');
}

});
require.register("visionmedia-rework/lib/plugins/colors.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var parse = require('color-parser')
  , functions = require('./function');

/**
 * Provide color manipulation helpers:
 *
 *    button {
 *      background: rgba(#eee, .5)
 *    }
 *
 * yields:
 *
 *    button {
 *      background: rgba(238, 238, 238, .5)
 *    }
 *
 */

module.exports = function() {
  return functions({
    rgba: function(color, alpha){
      if (2 == arguments.length) {
        var c = parse(color.trim());
        var args = [c.r, c.g, c.b, alpha];
      } else {
        var args = [].slice.call(arguments);
      }
      
      return 'rgba(' + args.join(', ') + ')';
    }
  });
};

});
require.register("visionmedia-rework/lib/plugins/extend.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var debug = require('debug')('rework:extend');

/**
 * Add extension support.
 */

module.exports = function() {
  debug('use extend');
  return function(style, rework) {
    var map = {};
    var rules = style.rules.length;

    for (var j = 0; j < rules; j++) {
      var rule = style.rules[j];
      if (!rule || !rule.selectors) return;

      // map selectors
      rule.selectors.forEach(function(sel, i) {
        map[sel] = rule;
        if ('%' == sel[0]) rule.selectors.splice(i, 1);
      });

      // visit extend: properties
      visit(rule, map);

      // clean up empty rules
      if (!rule.declarations.length) {
        style.rules.splice(j--, 1);
      }
    };
  }
};

/**
 * Visit declarations and extensions.
 *
 * @param {Object} rule
 * @param {Object} map
 * @api private
 */

function visit(rule, map) {
  for (var i = 0; i < rule.declarations.length; ++i) {
    var decl = rule.declarations[i];
    var key = decl.property;
    var val = decl.value;
    if (!/^extends?$/.test(key)) continue;

    var extend = map[val];
    if (!extend) throw new Error('failed to extend "' + val + '"');

    var keys = Object.keys(map);
    keys.forEach(function(key) {
      if (0 != key.indexOf(val)) return;
      var extend = map[key];
      var suffix = key.replace(val, '');
      debug('extend %j with %j', rule.selectors, extend.selectors);
      extend.selectors = extend.selectors.concat(rule.selectors.map(function(sel) {
        return sel + suffix;
      }));
    });

    rule.declarations.splice(i--, 1);
  }
}

});
require.register("visionmedia-rework/lib/plugins/mixin.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var utils = require('../utils')
  , visit = require('../visit');

/**
 * Define custom mixins.
 */

module.exports = function(mixins) {
  if (!mixins) throw new Error('mixins object required');
  return function(style, rework){
    visit.declarations(style, function(declarations){
      mixin(declarations, mixins);
    });
  }
};

/**
 * Visit declarations and apply mixins.
 *
 * @param {Array} declarations
 * @param {Object} mixins
 * @api private
 */

function mixin(declarations, mixins) {
  for (var i = 0; i < declarations.length; ++i) {
    var decl = declarations[i];
    var key = decl.property;
    var val = decl.value;
    var fn = mixins[key];
    if (!fn) continue;

    // invoke mixin
    var ret = fn(val);

    // apply properties
    for (var key in ret) {
      declarations.splice(i++, 0, {
        property: key,
        value: ret[key]
      });
    }

    // remove original
    declarations.splice(i, 1);
  }
}

});
require.register("visionmedia-rework/lib/plugins/keyframes.js", function(exports, require, module){

/**
 * Prefix keyframes.
 *
 *   @keyframes animation {
 *     from {
 *       opacity: 0;
 *     }
 *
 *     to {
 *       opacity: 1;
 *     }
 *   }
 *
 * yields:
 *
 *   @keyframes animation {
 *     from {
 *       opacity: 0;
 *     }
 *
 *     to {
 *       opacity: 1;
 *     }
 *   }
 *
 *   @-webkit-keyframes animation {
 *     from {
 *       opacity: 0;
 *     }
 *
 *     to {
 *       opacity: 1;
 *     }
 *   }
 *
 */

module.exports = function(vendors) {
  return function(style, rework){
    vendors = vendors || rework.prefixes;

    style.rules.forEach(function(rule){
      if (!rule.keyframes) return;

      vendors.forEach(function(vendor){
        if (vendor == rule.vendor) return;
        var clone = cloneKeyframes(rule);
        clone.vendor = vendor;
        style.rules.push(clone);
      });
    });
  }
};

/**
 * Clone keyframes.
 *
 * @param {Object} rule
 * @api private
 */

function cloneKeyframes(rule) {
  var clone = { name: rule.name };
  clone.vendor = rule.vendor;
  clone.keyframes = [];
  rule.keyframes.forEach(function(keyframe){
    clone.keyframes.push(cloneKeyframe(keyframe));
  });
  return clone;
}

/**
 * Clone `keyframe`.
 *
 * @param {Object} keyframe
 * @api private
 */

function cloneKeyframe(keyframe) {
  var clone = {};
  clone.values = keyframe.values.slice();
  clone.declarations = keyframe.declarations.map(function(decl){
    return {
      property: decl.property,
      value: decl.value
    }
  });
  return clone;
}
});
require.register("visionmedia-rework/lib/plugins/references.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var visit = require('../visit');

/**
 * Provide property reference support.
 *
 *    button {
 *      width: 50px;
 *      height: @width;
 *      line-height: @height;
 *    }
 *
 * yields:
 *
 *    button {
 *      width: 50px;
*      height: 50px;
*      line-height: 50px;
 *    }
 *
 */

module.exports = function() {
  return function(style, rework){
    visit.declarations(style, substitute);
  }
};

/**
 * Substitute easing functions.
 *
 * @api private
 */

function substitute(declarations) {
  var map = {};

  for (var i = 0, len = declarations.length; i < len; ++i) {
    var decl = declarations[i];
    var key = decl.property;
    var val = decl.value;

    decl.value = val.replace(/@([-\w]+)/g, function(_, name){
      if (null == map[name]) throw new Error('@' + name + ' is not defined in this scope');
      return map[name];
    });

    map[key] = decl.value;
  }
}

});
require.register("visionmedia-rework/lib/plugins/opacity.js", function(exports, require, module){

/**
 * Add IE opacity support.
 *
 *   ul {
 *     opacity: 1 !important;
 *   }
 *
 * yields:
 *
 *   ul {
 *     opacity: 1 !important;
 *     -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=100) !important;
 *     filter: alpha(opacity=100) !important
 *   }
 *
 */

module.exports = function() {
  return function(style){
    style.rules.forEach(function(rule){
      if (!rule.declarations) return;
      rule.declarations.forEach(function(decl, i){
        if ('opacity' != decl.property) return;
        var args = decl.value.split(/\s+/);

        // parse float
        var n = args.shift();
        n = parseFloat(n, 10) * 100 | 0;

        // join args
        if (args.length) args = ' ' + args.join(' ');
        else args = '';

        // ie junk
        rule.declarations.push({
          property: '-ms-filter',
          value: 'progid:DXImageTransform.Microsoft.Alpha(Opacity=' + n + ')' + args
        });

        rule.declarations.push({
          property: 'filter',
          value: 'alpha(opacity=' + n + ')' + args
        });
      });
    });
  }
};
});
require.register("visionmedia-rework/lib/plugins/prefix-selectors.js", function(exports, require, module){

/**
 * Prefix selectors with `str`.
 *
 *    button {
 *      color: red;
 *    }
 *
 * yields:
 *
 *    #dialog button {
 *      color: red;
 *    }
 *
 */

module.exports = function(str) {
  return function(style){
    style.rules = style.rules.map(function(rule){
      if (!rule.selectors) return rule;
      rule.selectors = rule.selectors.map(function(selector){
        return str + ' ' + selector;
      });
      return rule;
    });
  }
};
});
require.register("visionmedia-rework/lib/plugins/prefix-value.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var visit = require('../visit');

/**
 * Prefix `value`.
 *
 *    button {
 *      transition: height, transform 2s, width 0.3s linear;
 *    }
 *
 * yields:
 *
 *    button {
 *      -webkit-transition: height, -webkit-transform 2s, width 0.3s linear;
 *      -moz-transition: height, -moz-transform 2s, width 0.3s linear;
 *      transition: height, transform 2s, width 0.3s linear
 *    }
 *
 */

module.exports = function(value, vendors) {
  return function(style, rework){
    vendors = vendors || rework.prefixes;

    visit.declarations(style, function(declarations){
      for (var i = 0; i < declarations.length; ++i) {
        var decl = declarations[i];
        if (!~decl.value.indexOf(value)) continue;

        // ignore vendor-prefixed properties
        if ('-' == decl.property[0]) continue;

        // ignore vendor-prefixed values
        if (~decl.value.indexOf('-' + value)) continue;

        // vendor prefixed props
        vendors.forEach(function(vendor){
          var prop = 'transition' == decl.property
            ? vendor + decl.property
            : decl.property;

          declarations.splice(i++, 0, {
            property: prop,
            value: decl.value.replace(value, vendor + value)
          });
        });
      }
    });
  }
};

});
require.register("visionmedia-rework/lib/plugins/media.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var utils = require('../utils');

/**
 * Define custom media types.
 *
 *   @media iphone {
 *
 *   }
 *
 * TODO: boundary regexps
 */

module.exports = function(obj) {
  var keys = Object.keys(obj);
  return function(style, rework){
    style.rules.forEach(function(rule){
      if (!rule.media) return;
      var i = keys.indexOf(rule.media);
      if (-1 == i) return;
      var key = keys[i];
      var val = obj[key];
      rule.media = rule.media.replace(key, val);
    });
  }
};
});
require.register("visionmedia-rework/lib/plugins/prefix.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var visit = require('../visit');

/**
 * Prefix `prop`.
 *
 *   .button {
 *     border-radius: 5px;
 *   }
 *
 * yields:
 *
 *   .button {
 *     -webkit-border-radius: 5px;
 *     -moz-border-radius: 5px;
 *     border-radius: 5px;
 *   }
 *
 */

module.exports = function(prop, vendors) {
  var props = Array.isArray(prop)
    ? prop
    : [prop];

  return function(style, rework){
    vendors = vendors || rework.prefixes;
    visit.declarations(style, function(declarations, node){
      var only = node.vendor;
      var isKeyframes = !! node.keyframes;

      for (var i = 0; i < props.length; ++i) {
        var prop = props[i];

        for (var j = 0, len = declarations.length; j < len; ++j) {
          var decl = declarations[j];
          if (prop != decl.property) continue;

          // vendor prefixed props
          for (var k = 0; k < vendors.length; ++k) {
            if (!only && isKeyframes) continue;
            if (only && only != vendors[k]) continue;
            declarations.push({
              property: vendors[k] + decl.property,
              value: decl.value
            });
          }

          // original prop
          declarations.push(decl);
          declarations.splice(j, 1);
        }
      }
    });
  }
};

});
require.register("autoprefixer/data/browsers.js", function(exports, require, module){
// Don't edit this files, because it's autogenerated.
// See updaters/ dir for generator. Run bin/update to update.

module.exports = {
    chrome: {
        prefix: "-webkit-",
        versions: [
            27,
            26,
            25,
            24,
            23,
            22,
            21,
            20,
            19,
            18,
            17,
            16,
            15,
            14,
            13,
            12,
            11,
            10,
            9,
            8,
            7,
            6,
            5,
            4
        ],
        future: [
            28
        ],
        popularity: [
            0.19803,
            27.6639,
            1.61868,
            0.72324,
            0.6888,
            0.54243,
            0.5166,
            0.07749,
            0.07749,
            0.09471,
            0.09471,
            0.0861,
            0.12054,
            0.10332,
            0.11193,
            0.12054,
            0.15498,
            0.09471,
            0.03444,
            0.04305,
            0.02583,
            0.02583,
            0.02583,
            0.02583
        ]
    },
    ff: {
        prefix: "-moz-",
        versions: [
            21,
            20,
            19,
            18,
            17,
            16,
            15,
            14,
            13,
            12,
            11,
            10,
            9,
            8,
            7,
            6,
            5,
            4,
            3.6,
            3.5,
            3,
            2
        ],
        future: [
            23,
            22
        ],
        popularity: [
            0.30996,
            8.15367,
            4.66662,
            0.3444,
            0.30135,
            0.70602,
            0.39606,
            0.26691,
            0.20664,
            0.40467,
            0.1722,
            0.19803,
            0.10332,
            0.0861,
            0.06888,
            0.06888,
            0.07749,
            0.12054,
            0.37884,
            0.06027,
            0.09471,
            0.02583
        ]
    },
    ie: {
        prefix: "-ms-",
        versions: [
            10,
            9,
            8,
            7,
            6,
            5.5
        ],
        future: [
            11
        ],
        popularity: [
            5.38881,
            11.6221,
            8.09627,
            0.513634,
            0.226347,
            0.009298
        ]
    },
    ios: {
        prefix: "-webkit-",
        versions: [
            6,
            5,
            5.1,
            4.2,
            4.3,
            4,
            4.1,
            3.2
        ],
        popularity: [
            6.02384,
            0.3597855,
            0.3597855,
            0.065104,
            0.065104,
            0.00685305,
            0.00685305,
            0.00685306
        ]
    },
    opera: {
        prefix: "-o-",
        versions: [
            12.1,
            12,
            11.6,
            11.5,
            11.1,
            11,
            10.6,
            10.5,
            10,
            10.1,
            9.5,
            9.6
        ],
        popularity: [
            0.62853,
            0.07749,
            0.04305,
            0.01722,
            0.00861,
            0.00861,
            0.00861,
            0.008565,
            0.00861,
            0.00861,
            0.004305,
            0.004305
        ]
    },
    safari: {
        prefix: "-webkit-",
        versions: [
            6,
            5.1,
            5,
            4,
            3.2,
            3.1
        ],
        popularity: [
            1.90281,
            1.35177,
            0.4305,
            0.12054,
            0.008692,
            0
        ]
    }
};

});
require.register("autoprefixer/data/values.js", function(exports, require, module){
// Don't edit this files, because it's autogenerated.
// See updaters/ dir for generator. Run bin/update to update.

module.exports = {
    calc: {
        props: [
            "*"
        ],
        browsers: [
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "safari 6",
            "ios 6"
        ]
    },
    flex: {
        props: [
            "display"
        ],
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        replace: function (string, prefix, rules) {
            if (prefix === '-webkit-') {
                rules.add('display', '-webkit-box');
                return '-webkit-' + string;
            } else if (prefix === '-moz-') {
                return prefix + 'box';
            } else if (prefix === '-ms-') {
                return prefix + 'flexbox';
            }
        }
    },
    "inline-flex": {
        props: [
            "display"
        ],
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "linear-gradient": {
        props: [
            "background",
            "background-image"
        ],
        browsers: [
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        replace: function (string, prefix) {
            var regexp;
            regexp = /to\s+(top|bottom)?\s*(left|right)?/ig;
            string = string.replace(regexp, function (_, ver, hor) {
                var direct;
                direct = [];
                if (ver === 'top') {
                    direct.push('bottom');
                }
                if (ver === 'bottom') {
                    direct.push('top');
                }
                if (hor === 'right') {
                    direct.push('left');
                }
                if (hor === 'left') {
                    direct.push('right');
                }
                return direct.join(' ');
            });
            regexp = /(repeating-)?(linear|radial)-gradient/gi;
            string = string.replace(regexp, prefix + '$&');
            if (prefix !== '-webkit-') {
                return string;
            }
            regexp = /((repeating-)?(linear|radial)-gradient\()\s*(-?\d+deg)?/ig;
            return string.replace(regexp, function (_0, gradient, _1, _2, deg) {
                if (deg) {
                    deg = parseInt(deg);
                    deg += 90;
                    if (deg > 360) {
                        deg -= 360;
                    }
                    return gradient + deg + 'deg';
                } else {
                    return gradient;
                }
            });
        }
    },
    "radial-gradient": {
        props: [
            "background",
            "background-image"
        ],
        browsers: [
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        replace: function (string, prefix) {
            var regexp;
            regexp = /to\s+(top|bottom)?\s*(left|right)?/ig;
            string = string.replace(regexp, function (_, ver, hor) {
                var direct;
                direct = [];
                if (ver === 'top') {
                    direct.push('bottom');
                }
                if (ver === 'bottom') {
                    direct.push('top');
                }
                if (hor === 'right') {
                    direct.push('left');
                }
                if (hor === 'left') {
                    direct.push('right');
                }
                return direct.join(' ');
            });
            regexp = /(repeating-)?(linear|radial)-gradient/gi;
            string = string.replace(regexp, prefix + '$&');
            if (prefix !== '-webkit-') {
                return string;
            }
            regexp = /((repeating-)?(linear|radial)-gradient\()\s*(-?\d+deg)?/ig;
            return string.replace(regexp, function (_0, gradient, _1, _2, deg) {
                if (deg) {
                    deg = parseInt(deg);
                    deg += 90;
                    if (deg > 360) {
                        deg -= 360;
                    }
                    return gradient + deg + 'deg';
                } else {
                    return gradient;
                }
            });
        }
    },
    "repeating-linear-gradient": {
        props: [
            "background",
            "background-image"
        ],
        browsers: [
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        replace: function (string, prefix) {
            var regexp;
            regexp = /to\s+(top|bottom)?\s*(left|right)?/ig;
            string = string.replace(regexp, function (_, ver, hor) {
                var direct;
                direct = [];
                if (ver === 'top') {
                    direct.push('bottom');
                }
                if (ver === 'bottom') {
                    direct.push('top');
                }
                if (hor === 'right') {
                    direct.push('left');
                }
                if (hor === 'left') {
                    direct.push('right');
                }
                return direct.join(' ');
            });
            regexp = /(repeating-)?(linear|radial)-gradient/gi;
            string = string.replace(regexp, prefix + '$&');
            if (prefix !== '-webkit-') {
                return string;
            }
            regexp = /((repeating-)?(linear|radial)-gradient\()\s*(-?\d+deg)?/ig;
            return string.replace(regexp, function (_0, gradient, _1, _2, deg) {
                if (deg) {
                    deg = parseInt(deg);
                    deg += 90;
                    if (deg > 360) {
                        deg -= 360;
                    }
                    return gradient + deg + 'deg';
                } else {
                    return gradient;
                }
            });
        }
    },
    "repeating-radial-gradient": {
        props: [
            "background",
            "background-image"
        ],
        browsers: [
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        replace: function (string, prefix) {
            var regexp;
            regexp = /to\s+(top|bottom)?\s*(left|right)?/ig;
            string = string.replace(regexp, function (_, ver, hor) {
                var direct;
                direct = [];
                if (ver === 'top') {
                    direct.push('bottom');
                }
                if (ver === 'bottom') {
                    direct.push('top');
                }
                if (hor === 'right') {
                    direct.push('left');
                }
                if (hor === 'left') {
                    direct.push('right');
                }
                return direct.join(' ');
            });
            regexp = /(repeating-)?(linear|radial)-gradient/gi;
            string = string.replace(regexp, prefix + '$&');
            if (prefix !== '-webkit-') {
                return string;
            }
            regexp = /((repeating-)?(linear|radial)-gradient\()\s*(-?\d+deg)?/ig;
            return string.replace(regexp, function (_0, gradient, _1, _2, deg) {
                if (deg) {
                    deg = parseInt(deg);
                    deg += 90;
                    if (deg > 360) {
                        deg -= 360;
                    }
                    return gradient + deg + 'deg';
                } else {
                    return gradient;
                }
            });
        }
    }
};

});
require.register("autoprefixer/data/props.js", function(exports, require, module){
// Don't edit this files, because it's autogenerated.
// See updaters/ dir for generator. Run bin/update to update.

module.exports = {
    "@keyframes": {
        browsers: [
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "align-content": {
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "align-items": {
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "align-self": {
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    animation: {
        browsers: [
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "animation-delay": {
        browsers: [
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "animation-direction": {
        browsers: [
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "animation-duration": {
        browsers: [
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "animation-fill-mode": {
        browsers: [
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "animation-iteration-count": {
        browsers: [
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "animation-name": {
        browsers: [
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "animation-play-state": {
        browsers: [
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "animation-timing-function": {
        browsers: [
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 5.1",
            "opera 12",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "backface-visibility": {
        browsers: [
            "ie 9",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "opera 11",
            "opera 12",
            "opera 10.5",
            "opera 10.6",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "border-bottom-left-radius": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "safari 4",
            "safari 3.1",
            "safari 3.2",
            "ios 3.2"
        ],
        transition: true,
        prefixed: {
            "-moz-": "moz-border-radius-bottomleft"
        }
    },
    "border-bottom-right-radius": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "safari 4",
            "safari 3.1",
            "safari 3.2",
            "ios 3.2"
        ],
        transition: true,
        prefixed: {
            "-moz-": "moz-border-radius-bottomright"
        }
    },
    "border-radius": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "safari 4",
            "safari 3.1",
            "safari 3.2",
            "ios 3.2"
        ],
        transition: true
    },
    "border-top-left-radius": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "safari 4",
            "safari 3.1",
            "safari 3.2",
            "ios 3.2"
        ],
        transition: true,
        prefixed: {
            "-moz-": "moz-border-radius-topleft"
        }
    },
    "border-top-right-radius": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "safari 4",
            "safari 3.1",
            "safari 3.2",
            "ios 3.2"
        ],
        transition: true,
        prefixed: {
            "-moz-": "moz-border-radius-topright"
        }
    },
    "box-shadow": {
        browsers: [
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "safari 4",
            "safari 5",
            "safari 3.1",
            "safari 3.2",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3"
        ],
        transition: true
    },
    "box-sizing": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "safari 4",
            "safari 5",
            "safari 3.1",
            "safari 3.2",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3"
        ]
    },
    "break-after": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "break-before": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "break-inside": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "column-count": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "column-fill": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "column-gap": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "column-rule": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "column-rule-color": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "column-rule-style": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "column-rule-width": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "column-span": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "column-width": {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    columns: {
        browsers: [
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    filter: {
        browsers: [
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 6",
            "ios 6"
        ],
        transition: true,
        check: function () {
            return !this.match(/DXImageTransform\.Microsoft/);
        }
    },
    flex: {
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "flex-basis": {
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "flex-direction": {
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "flex-flow": {
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "flex-grow": {
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "flex-shrink": {
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "flex-wrap": {
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "justify-content": {
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    order: {
        browsers: [
            "ie 10",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    perspective: {
        browsers: [
            "ie 9",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "opera 11",
            "opera 12",
            "opera 10.5",
            "opera 10.6",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "perspective-origin": {
        browsers: [
            "ie 9",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "opera 11",
            "opera 12",
            "opera 10.5",
            "opera 10.6",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    transform: {
        browsers: [
            "ie 9",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "opera 11",
            "opera 12",
            "opera 10.5",
            "opera 10.6",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "transform-origin": {
        browsers: [
            "ie 9",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "opera 11",
            "opera 12",
            "opera 10.5",
            "opera 10.6",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    "transform-style": {
        browsers: [
            "ie 9",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 3.5",
            "ff 3.6",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "opera 11",
            "opera 12",
            "opera 10.5",
            "opera 10.6",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ],
        transition: true
    },
    transition: {
        browsers: [
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "opera 11",
            "opera 12",
            "opera 10.5",
            "opera 10.6",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "transition-delay": {
        browsers: [
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "opera 11",
            "opera 12",
            "opera 10.5",
            "opera 10.6",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "transition-duration": {
        browsers: [
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "opera 11",
            "opera 12",
            "opera 10.5",
            "opera 10.6",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "transition-property": {
        browsers: [
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "opera 11",
            "opera 12",
            "opera 10.5",
            "opera 10.6",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "transition-timing-function": {
        browsers: [
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "chrome 4",
            "chrome 5",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "opera 11",
            "opera 12",
            "opera 10.5",
            "opera 10.6",
            "opera 11.1",
            "opera 11.5",
            "opera 11.6",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    },
    "user-select": {
        browsers: [
            "ie 10",
            "ie 11",
            "ff 2",
            "ff 3",
            "ff 4",
            "ff 5",
            "ff 6",
            "ff 7",
            "ff 8",
            "ff 9",
            "ff 10",
            "ff 11",
            "ff 12",
            "ff 13",
            "ff 14",
            "ff 15",
            "ff 16",
            "ff 17",
            "ff 18",
            "ff 19",
            "ff 20",
            "ff 21",
            "ff 22",
            "ff 23",
            "ff 3.5",
            "ff 3.6",
            "chrome 6",
            "chrome 7",
            "chrome 8",
            "chrome 9",
            "chrome 10",
            "chrome 11",
            "chrome 12",
            "chrome 13",
            "chrome 14",
            "chrome 15",
            "chrome 16",
            "chrome 17",
            "chrome 18",
            "chrome 19",
            "chrome 20",
            "chrome 21",
            "chrome 22",
            "chrome 23",
            "chrome 24",
            "chrome 25",
            "chrome 26",
            "chrome 27",
            "chrome 28",
            "chrome 29",
            "safari 4",
            "safari 5",
            "safari 6",
            "safari 3.1",
            "safari 3.2",
            "safari 5.1",
            "ios 6",
            "ios 3.2",
            "ios 4.0",
            "ios 4.1",
            "ios 4.2",
            "ios 4.3",
            "ios 5.0",
            "ios 5.1"
        ]
    }
};

});
require.register("autoprefixer/lib/autoprefixer/inspect.js", function(exports, require, module){
/*
 * Copyright 2013 Andrey Sitnik <andrey@sitnik.ru>,
 * sponsored by Evil Martians.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';

var autoprefixer = require('../autoprefixer.js');

var transition;
var format = function (data) {
    transition = false;
    return Object.keys(data).sort().map(function (name) {
        var prop = data[name];
        if (prop.transition) {
            name += '*';
            transition = true;
        }
        return '  ' + name + ': ' + prop.prefixes.map(function (i) {
            return i.replace(/^-(.*)-$/g, '$1');
        }).join(', ');
    }).join("\n");
};

// Show, what browser, properties and values will used by autoprefixed
// with this `req`.
var inspect = function (reqs) {
    var browsers = autoprefixer.parse(reqs || []);
    var values   = autoprefixer.filter(autoprefixer.data.values, browsers);
    var props    = autoprefixer.filter(autoprefixer.data.props,  browsers);

    var name, version, last, selected = [];
    for (var i = 0; i < browsers.length; i++) {
        version = browsers[i].split(' ')[1];
        if ( browsers[i].indexOf(last) == 0 ) {
            selected[selected.length - 1] += ', ' + version;
        } else {
            last = browsers[i].split(' ')[0];
            if ( last == 'ie' ) {
                name = 'IE';
            } else if ( last == 'ff' ) {
                name = 'Firefox';
            } else if ( last == 'ios' ) {
                name = 'iOS';
            } else {
                name = last.slice(0, 1).toUpperCase() + last.slice(1);
            }
            selected.push(name + ' ' + version);
        }
    }

    var out  = "Browsers:\n" +
        selected.map(function (i) { return '  ' + i; }).join("\n") + "\n";

    if ( Object.keys(props).length > 0 ) {
        out += "\nProperties:\n" + format(props) + "\n";
        if ( transition ) {
            out += "* - properties, which can be used in transition\n"
        }
    }
    if ( Object.keys(values).length > 0 ) {
        out += "\nValues:\n" + format(values) + "\n"
    }
    return out;
};

module.exports = inspect;

});
require.register("autoprefixer/lib/autoprefixer.js", function(exports, require, module){
/*
 * Copyright 2013 Andrey Sitnik <andrey@sitnik.ru>,
 * sponsored by Evil Martians.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
(function () {
'use strict';

var rework = require('rework');

// Return array, that doesn’t contain duplicates.
var uniq = function (array) {
    var filtered = [];
    array.forEach(function (i) {
        if ( filtered.indexOf(i) === -1 ) {
            filtered.push(i);
        }
    });
    return filtered;
};

// Split prefix and property name.
var splitPrefix = function (prop) {
    if ( prop[0] === '-' ) {
        var sep = prop.indexOf('-', 1) + 1;
        return { prefix: prop.slice(0, sep), name: prop.slice(sep) };
    } else {
        return { prefix: null, name: prop };
    }
};

// Generate RegExp to test, does CSS value contain some `word`.
var containRegexp = function (word) {
    return new RegExp('(^|\\s|,|\\()' +
               word.replace(/([.?*+\^\$\[\]\\(){}|\-])/g, "\\$1") +
               '($|\\s|\\()', 'ig');
};

// Throw error with `messages with mark, that is from Autoprefixer.
var error = function (message) {
    var err = new Error(message);
    err.autoprefixer = true;
    throw err;
};

// Class to edit rules array inside forEach.
var Rules = function(rules) {
    this.rules = rules;
};
Rules.prototype = {
    // Execute `callback` on every rule.
    forEach: function (callback) {
        for ( this.num = 0; this.num < this.rules.length; this.num += 1 ) {
            callback(this.rules[this.num]);
        }
    },

    // Check that rules contain rule with `prop` and `values`.
    contain: function (prop, value) {
        return this.rules.some(function (rule) {
            return rule.property === prop && rule.value === value;
        });
    },

    // Add new rule with `prop` and `value`.
    add: function (prop, value) {
        if ( this.contain(prop, value) ) {
            return;
        }

        this.rules.splice(this.num, 0, { property: prop, value: value });
        this.num += 1;
    },

    // Remove current rule.
    removeCurrent: function () {
        this.rules.splice(this.num, 1);
    }
};

// Parse CSS and add prefixed properties and values by Can I Use database
// for actual browsers.
//
//   var prefixed = autoprefixer.compile(css);
//
// By default, it add prefixes for last 2 releases of each browsers.
// You can use global statistics to select browsers:
//
//   autoprefixer.compile(css, '> 1%');
//
// versions fo each browsers:
//
//   autoprefixer.compile(css, 'last 1 version');
//
// or set them manually:
//
//   autoprefixer.compile(css, ['chrome 26', 'ff 20', 'ie 10']);
//
// If you want to combine Autoprefixer with another Rework filters,
// you can use it as separated filter:
//
//   rework(css).
//     use(autoprefixer.rework(last 1 version')).
//     toString();
var autoprefixer = {
    // Load data
    data: {
        browsers: require('../data/browsers'),
        values:   require('../data/values'),
        props:    require('../data/props')
    },

    // Parse `css` by Rework and add prefixed properties for browsers
    // in `requirements`.
    compile: function (css, requirements) {
        return rework(css).use(autoprefixer.rework(requirements)).toString();
    },

    // Return Rework filter, which will add necessary prefixes for browsers
    // in `requirements`.
    rework: function (requirements) {
        if ( !requirements ) {
            requirements = [];
        } else if ( !Array.isArray(requirements) ) {
            requirements = [requirements];
        }

        var browsers   = this.parse(requirements);
        var values     = this.filter(this.data.values, browsers);
        var props      = this.filter(this.data.props,  browsers);
        var prefixes   = this.prefixes(props, values);
        var unprefixes = this.unprefixes(props, values);

        return function (style) {
            autoprefixer.unprefixer(unprefixes, style);
            autoprefixer.prefixer(prefixes, style);
        };
    },

    // Change `style` declarations in parsed CSS, to add prefixes for `props`.
    prefixer: function (props, style) {
        var all      = props['*'];
        var prefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];

        var transitions = { };
        for ( var i in props ) {
            if ( props[i].transition && props[i].prefixes ) {
                transitions[i] = props[i];
            }
        }
        var isTransition = /(-(webkit|moz|ms|o)-)?transition(-property)?/;

        // Keyframes
        if ( props['@keyframes'] ) {
            style.rules.forEach(function(rule) {
                if ( !rule.keyframes ) {
                    return;
                }

                props['@keyframes'].prefixes.forEach(function (prefix) {
                    var contain = style.rules.some(function (other) {
                        return other.keyframes && rule.name === other.name &&
                               other.vendor === prefix;
                    });
                    if ( contain ) {
                        return;
                    }

                    var clone = { name: rule.name };
                    clone.vendor = rule.vendor;
                    clone.keyframes = [];
                    rule.keyframes.forEach(function (keyframe) {
                        var keyframeClone          = { };
                        keyframeClone.values       = keyframe.values.slice();
                        keyframeClone.declarations = keyframe.declarations.map(
                            function (i) {
                                return { property: i.property, value: i.value };
                            });

                        clone.keyframes.push(keyframeClone);
                    });


                    clone.vendor = prefix;
                    style.rules.push(clone);
                });
             });
        }

        rework.visit.declarations(style, function (list, node) {
            var rules = new Rules(list);

            // Properties
            rules.forEach(function (rule) {
                var prop = props[rule.property];

                if ( !prop || !prop.prefixes ) {
                    return;
                }
                if ( prop.check && !prop.check.call(rule.value, rule) ) {
                    return;
                }

                prop.prefixes.forEach(function (prefix) {
                    if ( node.vendor && node.vendor !== prefix ) {
                        return;
                    }
                    var wrong = prefixes.some(function (other) {
                        if ( other === prefix ) {
                            return false;
                        }
                        return rule.value.indexOf(other) !== -1;
                    });
                    if ( wrong ) {
                        return;
                    }

                    rules.add(prefix + rule.property, rule.value);
                });
            });

            // Values
            rules.forEach(function (rule) {
                var split  = splitPrefix(rule.property);
                var vendor = split.prefix || node.vendor;
                var prop   = props[split.name];

                var valuePrefixer = function (values) {
                    var prefixed = { };

                    for ( var name in values ) {
                        var value = values[name];
                        if ( !rule.value.match(value.regexp) ) {
                            continue;
                        }

                        value.prefixes.forEach(function (prefix) {
                            if ( vendor && vendor !== prefix ) {
                                return;
                            }
                            if ( !prefixed[prefix] ) {
                                prefixed[prefix] = rule.value;
                            }
                            if ( value.replace ) {
                                if ( prefixed[prefix].match(value.regexp) ) {
                                    var replaced = value.replace(
                                        prefixed[prefix], prefix, rules);
                                    if ( replaced ) {
                                        prefixed[prefix] = replaced;
                                        return;
                                    }
                                }
                            }

                            prefixed[prefix] = prefixed[prefix].replace(
                                value.regexp, '$1' + prefix + name + '$2');
                        });
                    }


                    for ( var prefix in prefixed ) {
                        if ( prefixed[prefix] === rule.value ) {
                            continue;
                        }

                        if ( vendor ) {
                            var exists = rules.contain(
                                rule.property, prefixed[prefix]);
                            if ( exists ) {
                                rules.removeCurrent();
                            } else {
                                rule.value = prefixed[prefix];
                            }
                        } else {
                            rules.add(rule.property, prefixed[prefix]);
                        }
                    }
                };

                if ( all ) {
                    valuePrefixer(all.values);
                }
                if ( prop ) {
                    valuePrefixer(prop.values);
                }
                if ( rule.property.match(isTransition) ) {
                    valuePrefixer(transitions);
                }
            });
        });
    },

    // Change `style` declarations in parsed CSS, to remove `remove`.
    unprefixer: function (remove, style) {
        var all = remove.values['*'];

        // Keyframes
        style.rules = style.rules.filter(function (rule) {
            return !(rule.keyframes && remove.keyframes[rule.vendor]);
        });

        rework.visit.declarations(style, function (rules) {
            for ( var num = 0; num < rules.length; num += 1 ) {
                var rule = rules[num];

                // Properties
                if ( remove.props[rule.property] ) {
                    rules.splice(num, 1);
                    continue;
                }

                // Values
                var prop   = splitPrefix(rule.property).name;
                var values = all;
                if ( remove.values[prop] ) {
                    values = values.concat(remove.values[prop]);
                }
                if ( prop === 'transition' || prop === 'transition-property' ) {
                    values = values.concat(remove.transition);
                }
                values.forEach(function (value) {
                    if ( rule.value.match(value) ) {
                        rules.splice(num, 1);
                        return false;
                    }
                });
            }
        });
    },

    // Return array of browsers for requirements in free form.
    parse: function (requirements) {
        if ( requirements.length === 0 ) {
            requirements = ['last 2 versions'];
        }

        var match;
        var browsers = [];
        requirements.map(function (req) {

          if ( match = req.match(/^last (\d+) versions?$/i) ) {
              return autoprefixer.browsers(function(browser) {
                  return browser.versions.slice(0, match[1]);
              });

          } else if ( match = req.match(/^> (\d+(\.\d+)?)%$/i) ) {
              return autoprefixer.browsers(function(browser) {
                  return browser.versions.filter(function (version, i) {
                      return browser.popularity[i] > match[1];
                  });
              });

          } else {
              return [autoprefixer.check(req)];
          }

        }).forEach(function (reqBrowsers) {
            browsers = browsers.concat(reqBrowsers);
        });
        return uniq(browsers);
    },

    // Select browsers by some `criteria`.
    browsers: function (criteria) {
        var selected = [];
        for ( var name in this.data.browsers ) {
            var browser  = this.data.browsers[name];
            var versions = criteria(browser).map(function (version) {
                return name + ' ' + version;
            });
            selected = selected.concat(versions);
        }
        return selected;
    },

    // Check browser name and reduce version if them from future.
    check: function (req) {
        req = req.split(/\s+/);
        if ( req.length > 2 ) {
            error('Unknown browsers requirement `' + req.join(' ')  + '`');
        }

        var name    = req[0];
        var version = parseFloat(req[1]);

        var data = this.data.browsers[name];
        if ( !data ) {
            error('Unknown browser `' + name + '`');
        }
        if ( !version ) {
            error("Can't recognize version in `" + req + '`');
        }

        var last = data.versions[0];
        if ( data.future && data.future[0] ) {
            last = data.future[0];
        }

        if ( version > last ) {
            version = last;
        }
        if ( version < data.versions[data.versions.length - 1] ) {
            version = data.versions[data.versions.length - 1];
        }

        return name + ' ' + version;
    },

    // Return new `data` only with items, which need prefixes
    // for selected `browsers`.
    filter: function (data, browsers) {
        var selected = { };
        for ( var name in data ) {
            var need     = data[name].browsers;
            var prefixes = browsers.filter(function (browser) {
                return need.indexOf(browser) !== -1;
            }).map(function (browser) {
                var key = browser.split(' ')[0];
                return autoprefixer.data.browsers[key].prefix;
            }).sort(function (a, b) { return b.length - a.length; });

            if ( prefixes.length ) {
                prefixes = uniq(prefixes);

                var obj = { prefixes: prefixes };
                for ( var key in data[name] ) {
                    if ( key === 'browsers' ) {
                        continue;
                    }
                    obj[key] = data[name][key];
                }

                if ( obj.props || obj.transition ) {
                    obj.regexp = containRegexp(name);
                }

                selected[name] = obj;
            }
        }
        return selected;
    },

    // Return properties, which them prefixed values inside.
    prefixes: function (props, values) {
        for ( var name in values ) {
            values[name].props.forEach(function (prop) {
                if ( !props[prop] ) {
                    props[prop] = { values: { } };
                } else if ( !props[prop].values ) {
                    props[prop].values = { };
                }

                props[prop].values[name] = values[name];
            });
        }

        return props;
    },

    // Return old properties and values to remove.
    unprefixes: function (props, values) {
        var remove = { props: {}, values: {}, transition: [], keyframes: {} };
        var name, prefixes, prop, value, names;

        for ( name in this.data.props ) {
            prop     = this.data.props[name];
            prefixes = prop.browsers.map(function (b) {
                var key = b.split(' ')[0];
                return autoprefixer.data.browsers[key].prefix;
            });
            uniq(prefixes).filter(function (prefix) {
                if ( !props[name] ) {
                    return true;
                }
                return props[name].prefixes.indexOf(prefix) === -1;
            }).forEach(function (prefix) {
                if ( prop.transition ) {
                    remove.transition.push(containRegexp(prefix + name));
                }
                if ( name === '@keyframes' ) {
                    remove.keyframes[prefix] = true;
                } else {
                    if ( prop.prefixed && prop.prefixed[prefix] ) {
                        remove.props[prop.prefixed[prefix]] = true;
                    } else {
                        remove.props[prefix + name] = true;
                    }
                }
            });
        }

        for ( name in this.data.values ) {
            value = this.data.values[name];
            prefixes = value.browsers.map(function (b) {
                var key = b.split(' ')[0];
                return autoprefixer.data.browsers[key].prefix;
            });
            names = uniq(prefixes).filter(function (prefix) {
                if ( !values[name] ) {
                    return true;
                }
                return values[name].prefixes.indexOf(prefix) === -1;
            }).map(function (prefix) {
                return containRegexp(prefix + name);
            });

            value.props.forEach(function (prop) {
                if ( !remove.values[prop] ) {
                    remove.values[prop] = [];
                }
                remove.values[prop] = remove.values[prop].concat(names);
            });
        }

        return remove;
    }
};

module.exports = autoprefixer;
})();

});
require.alias("visionmedia-rework/index.js", "autoprefixer/deps/rework/index.js");
require.alias("visionmedia-rework/lib/rework.js", "autoprefixer/deps/rework/lib/rework.js");
require.alias("visionmedia-rework/lib/utils.js", "autoprefixer/deps/rework/lib/utils.js");
require.alias("visionmedia-rework/lib/visit.js", "autoprefixer/deps/rework/lib/visit.js");
require.alias("visionmedia-rework/lib/properties.js", "autoprefixer/deps/rework/lib/properties.js");
require.alias("visionmedia-rework/lib/plugins/function.js", "autoprefixer/deps/rework/lib/plugins/function.js");
require.alias("visionmedia-rework/lib/plugins/url.js", "autoprefixer/deps/rework/lib/plugins/url.js");
require.alias("visionmedia-rework/lib/plugins/vars.js", "autoprefixer/deps/rework/lib/plugins/vars.js");
require.alias("visionmedia-rework/lib/plugins/ease.js", "autoprefixer/deps/rework/lib/plugins/ease.js");
require.alias("visionmedia-rework/lib/plugins/at2x.js", "autoprefixer/deps/rework/lib/plugins/at2x.js");
require.alias("visionmedia-rework/lib/plugins/colors.js", "autoprefixer/deps/rework/lib/plugins/colors.js");
require.alias("visionmedia-rework/lib/plugins/extend.js", "autoprefixer/deps/rework/lib/plugins/extend.js");
require.alias("visionmedia-rework/lib/plugins/mixin.js", "autoprefixer/deps/rework/lib/plugins/mixin.js");
require.alias("visionmedia-rework/lib/plugins/keyframes.js", "autoprefixer/deps/rework/lib/plugins/keyframes.js");
require.alias("visionmedia-rework/lib/plugins/references.js", "autoprefixer/deps/rework/lib/plugins/references.js");
require.alias("visionmedia-rework/lib/plugins/opacity.js", "autoprefixer/deps/rework/lib/plugins/opacity.js");
require.alias("visionmedia-rework/lib/plugins/prefix-selectors.js", "autoprefixer/deps/rework/lib/plugins/prefix-selectors.js");
require.alias("visionmedia-rework/lib/plugins/prefix-value.js", "autoprefixer/deps/rework/lib/plugins/prefix-value.js");
require.alias("visionmedia-rework/lib/plugins/media.js", "autoprefixer/deps/rework/lib/plugins/media.js");
require.alias("visionmedia-rework/lib/plugins/prefix.js", "autoprefixer/deps/rework/lib/plugins/prefix.js");
require.alias("visionmedia-rework/index.js", "rework/index.js");
require.alias("visionmedia-css/index.js", "visionmedia-rework/deps/css/index.js");
require.alias("visionmedia-css-parse/index.js", "visionmedia-css/deps/css-parse/index.js");

require.alias("visionmedia-css-stringify/index.js", "visionmedia-css/deps/css-stringify/index.js");

require.alias("visionmedia-debug/index.js", "visionmedia-rework/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "visionmedia-rework/deps/debug/debug.js");

require.alias("component-color-parser/index.js", "visionmedia-rework/deps/color-parser/index.js");
require.alias("component-color-parser/colors.js", "visionmedia-rework/deps/color-parser/colors.js");

require.alias("component-path/index.js", "visionmedia-rework/deps/path/index.js");

require.alias("autoprefixer/lib/autoprefixer.js", "autoprefixer/index.js");

require.register('visionmedia-rework/lib/plugins/inline.js', function(_, _, module){
module.exports = function () {};
});

var autoprefixer = require('autoprefixer/lib/autoprefixer.js');
autoprefixer.inspect = require('autoprefixer/lib/autoprefixer/inspect.js');
if (typeof exports == 'object') {
  module.exports = autoprefixer;
} else if (typeof define == 'function' && define.amd) {
  define(function(){ return autoprefixer; });
} else {
  this['autoprefixer'] = autoprefixer;
} })();
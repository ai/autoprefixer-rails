;(function(){

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
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
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
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
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
    column = ~i ? str.length - i : column + str.length;
  }

  /**
   * Mark position and patch `node.position`.
   */

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
   * Error `msg`.
   */

  function error(msg) {
    var err = new Error(msg + ' near line ' + lineno + ':' + column);
    err.line = lineno;
    err.column = column;
    err.source = css;
    throw err;
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
    while (css.charAt(0) != '}' && (node = atrule() || rule())) {
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
    if ('/' != css.charAt(0) || '*' != css.charAt(1)) return;

    var i = 2;
    while (null != css.charAt(i) && ('*' != css.charAt(i) || '/' != css.charAt(i + 1))) ++i;
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
    return trim(m[0]).split(/\s*,\s*/);
  }

  /**
   * Parse declaration.
   */

  function declaration() {
    var pos = position();

    // prop
    var prop = match(/^(\*?[-\/\*\w]+)\s*/);
    if (!prop) return;
    prop = trim(prop[0]);

    // :
    if (!match(/^:\s*/)) return error("property missing ':'");

    // val
    var val = match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/);
    if (!val) return error('property missing value');

    var ret = pos({
      type: 'declaration',
      property: prop,
      value: trim(val[0])
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

    if (!open()) return error("missing '{'");
    comments(decls);

    // declarations
    var decl;
    while (decl = declaration()) {
      decls.push(decl);
      comments(decls);
    }

    if (!close()) return error("missing '}'");
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
    if (!m) return error("@keyframes missing name");
    var name = m[1];

    if (!open()) return error("@keyframes missing '{'");

    var frame;
    var frames = comments();
    while (frame = keyframe()) {
      frames.push(frame);
      frames = frames.concat(comments());
    }

    if (!close()) return error("@keyframes missing '}'");

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
    var supports = trim(m[1]);

    if (!open()) return error("@supports missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@supports missing '}'");

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
    var media = trim(m[1]);

    if (!open()) return error("@media missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@media missing '}'");

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

    if (!open()) return error("@page missing '{'");
    var decls = comments();

    // declarations
    var decl;
    while (decl = declaration()) {
      decls.push(decl);
      decls = decls.concat(comments());
    }

    if (!close()) return error("@page missing '}'");

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

    var vendor = trim(m[1]);
    var doc = trim(m[2]);

    if (!open()) return error("@document missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@document missing '}'");

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
    ret[name] = trim(m[1]);
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

/**
 * Trim `str`.
 */

function trim(str) {
  return (str || '').replace(/^\s+|\s+$/g, '');
}

});
require.register("visionmedia-css-stringify/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Compressed = require('./lib/compress');
var Identity = require('./lib/identity');

/**
 * Stringfy the given AST `node`.
 *
 * @param {Object} node
 * @param {Object} [options]
 * @return {String}
 * @api public
 */

module.exports = function(node, options){
  options = options || {};

  var compiler = options.compress
    ? new Compressed(options)
    : new Identity(options);

  return compiler.compile(node);
};


});
require.register("visionmedia-css-stringify/lib/compress.js", function(exports, require, module){

/**
 * Expose compiler.
 */

module.exports = Compiler;

/**
 * Initialize a new `Compiler`.
 */

function Compiler(options) {
  options = options || {};
}

/**
 * Compile `node`.
 */

Compiler.prototype.compile = function(node){
  return node.stylesheet
    .rules.map(this.visit, this)
    .join('');
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
  return '@media '
    + node.media
    + '{'
    + node.rules.map(this.visit, this).join('')
    + '}';
};

/**
 * Visit document node.
 */

Compiler.prototype.document = function(node){
  var doc = '@' + (node.vendor || '') + 'document ' + node.document;

  return doc
    + '{'
    + node.rules.map(this.visit, this).join('')
    + '}';
};

/**
 * Visit charset node.
 */

Compiler.prototype.charset = function(node){
  return '@charset ' + node.charset + ';';
};

/**
 * Visit supports node.
 */

Compiler.prototype.supports = function(node){
  return '@supports '
    + node.supports
    + ' {\n'
    + this.indent(1)
    + node.rules.map(this.visit, this).join('\n\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit keyframes node.
 */

Compiler.prototype.keyframes = function(node){
  return '@'
    + (node.vendor || '')
    + 'keyframes '
    + node.name
    + '{'
    + node.keyframes.map(this.visit, this).join('')
    + '}';
};

/**
 * Visit keyframe node.
 */

Compiler.prototype.keyframe = function(node){
  var decls = node.declarations;

  return node.values.join(',')
    + '{'
    + decls.map(this.visit, this).join('')
    + '}';
};

/**
 * Visit page node.
 */

Compiler.prototype.page = function(node){
  var sel = node.selectors.length
    ? node.selectors.join(', ') + ' '
    : '';

  return '@page ' + sel
    + '{\n'
    + this.indent(1)
    + node.declarations.map(this.visit, this).join('\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit rule node.
 */

Compiler.prototype.rule = function(node){
  var decls = node.declarations;
  if (!decls.length) return '';

  return node.selectors.join(',')
    + '{'
    + decls.map(this.visit, this).join('')
    + '}';
};

/**
 * Visit declaration node.
 */

Compiler.prototype.declaration = function(node){
  return node.property + ':' + node.value + ';';
};


});
require.register("visionmedia-css-stringify/lib/identity.js", function(exports, require, module){

/**
 * Expose compiler.
 */

module.exports = Compiler;

/**
 * Initialize a new `Compiler`.
 */

function Compiler(options) {
  options = options || {};
  this.indentation = options.indent;
}

/**
 * Compile `node`.
 */

Compiler.prototype.compile = function(node){
  return node.stylesheet
    .rules.map(this.visit, this)
    .join('\n\n');
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
  return this.indent() + '/*' + node.comment + '*/';
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
  return '@charset ' + node.charset + ';\n';
};

/**
 * Visit supports node.
 */

Compiler.prototype.supports = function(node){
  return '@supports '
    + node.supports
    + ' {\n'
    + this.indent(1)
    + node.rules.map(this.visit, this).join('\n\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit keyframes node.
 */

Compiler.prototype.keyframes = function(node){
  return '@'
    + (node.vendor || '')
    + 'keyframes '
    + node.name
    + ' {\n'
    + this.indent(1)
    + node.keyframes.map(this.visit, this).join('\n')
    + this.indent(-1)
    + '}';
};

/**
 * Visit keyframe node.
 */

Compiler.prototype.keyframe = function(node){
  var decls = node.declarations;

  return this.indent()
    + node.values.join(', ')
    + ' {\n'
    + this.indent(1)
    + decls.map(this.visit, this).join('\n')
    + this.indent(-1)
    + '\n' + this.indent() + '}\n';
};

/**
 * Visit page node.
 */

Compiler.prototype.page = function(node){
  var sel = node.selectors.length
    ? node.selectors.join(', ') + ' '
    : '';

  return '@page ' + sel
    + '{\n'
    + this.indent(1)
    + node.declarations.map(this.visit, this).join('\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit rule node.
 */

Compiler.prototype.rule = function(node){
  var indent = this.indent();
  var decls = node.declarations;
  if (!decls.length) return '';

  return node.selectors.map(function(s){ return indent + s }).join(',\n')
    + ' {\n'
    + this.indent(1)
    + decls.map(this.visit, this).join('\n')
    + this.indent(-1)
    + '\n' + this.indent() + '}';
};

/**
 * Visit declaration node.
 */

Compiler.prototype.declaration = function(node){
  return this.indent() + node.property + ': ' + node.value + ';';
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
require.register("autoprefixer/data/browsers.js", function(exports, require, module){
(function() {
  module.exports = {
    android: {
      prefix: "-webkit-",
      minor: true,
      versions: [4.2, 4.1, 4, 3, 2.3, 2.2, 2.1],
      popularity: [0.385341, 2.01563, 1.33387, 0.00592833, 1.96228, 0.148208, 0.0711399]
    },
    bb: {
      prefix: "-webkit-",
      minor: true,
      versions: [10, 7],
      popularity: [0, 0.14265]
    },
    chrome: {
      prefix: "-webkit-",
      future: [31, 30],
      versions: [29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
      popularity: [6.7568, 22.9846, 0.7872, 0.5658, 0.4428, 0.3198, 0.2788, 0.2706, 0.5248, 0.082, 0.082, 0.1394, 0.082, 0.0984, 0.123, 0.1066, 0.1066, 0.1148, 0.164, 0.0902, 0.0246, 0.0328, 0.0246, 0.0328, 0.0246, 0.0246]
    },
    ff: {
      prefix: "-moz-",
      future: [25, 24],
      versions: [23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3.6, 3.5, 3, 2],
      popularity: [6.1582, 6.068, 0.3772, 0.2296, 0.1886, 0.1558, 0.2214, 0.328, 0.1804, 0.123, 0.1312, 0.2378, 0.1148, 0.1312, 0.0738, 0.0738, 0.0492, 0.0492, 0.0574, 0.082, 0.287, 0.0492, 0.0902, 0.0246]
    },
    ie: {
      prefix: "-ms-",
      future: [11],
      versions: [10, 9, 8, 7, 6, 5.5],
      popularity: [9.459, 4.33746, 6.89823, 0.39204, 0.191849, 0.009298]
    },
    ios: {
      prefix: "-webkit-",
      versions: [7, 6, 6.1, 5, 5.1, 4.2, 4.3, 4, 4.1, 3.2],
      popularity: [0, 3.477105, 3.477105, 0.306353, 0.306353, 0.04595295, 0.04595295, 0.0076588, 0.0076588, 0.00765882]
    },
    opera: {
      prefix: "-o-",
      future: [17],
      versions: [16, 15, 12.1, 12, 11.6, 11.5, 11.1, 11, 10.6, 10.5, 10, 10.1, 9.5, 9.6],
      popularity: [0.0246, 0.1394, 0.5494, 0.0574, 0.0328, 0.0164, 0.0082, 0.0082, 0.0082, 0.008392, 0.0123, 0.0123, 0.0041, 0.0041]
    },
    safari: {
      prefix: "-webkit-",
      future: [7],
      versions: [6, 5.1, 5, 4, 3.2, 3.1],
      popularity: [2.0008, 1.2874, 0.328, 0.0984, 0.008692, 0]
    }
  };

}).call(this);

});
require.register("autoprefixer/data/prefixes.js", function(exports, require, module){
(function() {
  module.exports = {
    "::placeholder": {
      selector: true,
      browsers: ["chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ie 10", "ie 11", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "::selection": {
      selector: true,
      browsers: ["ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25"]
    },
    ":fullscreen": {
      selector: true,
      browsers: ["chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ie 11", "opera 15", "opera 16", "opera 17", "safari 5.1", "safari 6", "safari 7"]
    },
    "@keyframes": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 12", "opera 15", "opera 16", "opera 17", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "align-content": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    "align-items": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    "align-self": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    animation: {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 12", "opera 15", "opera 16", "opera 17", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "animation-delay": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 12", "opera 15", "opera 16", "opera 17", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "animation-direction": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 12", "opera 15", "opera 16", "opera 17", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "animation-duration": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 12", "opera 15", "opera 16", "opera 17", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "animation-fill-mode": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 12", "opera 15", "opera 16", "opera 17", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "animation-iteration-count": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 12", "opera 15", "opera 16", "opera 17", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "animation-name": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 12", "opera 15", "opera 16", "opera 17", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "animation-play-state": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 12", "opera 15", "opera 16", "opera 17", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "animation-timing-function": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 12", "opera 15", "opera 16", "opera 17", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "backface-visibility": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ie 9", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 10.5", "opera 10.6", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "background-clip": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "ff 3.6", "opera 10", "opera 10.1"]
    },
    "background-origin": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "ff 3.6", "opera 10", "opera 10.1"]
    },
    "background-size": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "ff 3.6", "opera 10", "opera 10.1"]
    },
    "border-bottom-left-radius": {
      mistakes: ["-ms-"],
      browsers: ["android 2.1", "chrome 4", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ios 3.2", "safari 3.1", "safari 3.2", "safari 4"],
      transition: true
    },
    "border-bottom-right-radius": {
      mistakes: ["-ms-"],
      browsers: ["android 2.1", "chrome 4", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ios 3.2", "safari 3.1", "safari 3.2", "safari 4"],
      transition: true
    },
    "border-image": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "opera 12.1", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1"]
    },
    "border-radius": {
      mistakes: ["-ms-"],
      browsers: ["android 2.1", "chrome 4", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ios 3.2", "safari 3.1", "safari 3.2", "safari 4"],
      transition: true
    },
    "border-top-left-radius": {
      mistakes: ["-ms-"],
      browsers: ["android 2.1", "chrome 4", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ios 3.2", "safari 3.1", "safari 3.2", "safari 4"],
      transition: true
    },
    "border-top-right-radius": {
      mistakes: ["-ms-"],
      browsers: ["android 2.1", "chrome 4", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ios 3.2", "safari 3.1", "safari 3.2", "safari 4"],
      transition: true
    },
    "box-shadow": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "bb 7", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "ff 3.5", "ff 3.6", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "safari 3.1", "safari 3.2", "safari 4", "safari 5"],
      transition: true
    },
    "box-sizing": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "bb 7", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "safari 3.1", "safari 3.2", "safari 4", "safari 5"]
    },
    "break-after": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "break-before": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "break-inside": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    calc: {
      props: ["*"],
      browsers: ["bb 10", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 6", "ios 6.1", "safari 6"]
    },
    "column-count": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "column-fill": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "column-gap": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"],
      transition: true
    },
    "column-rule": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"],
      transition: true
    },
    "column-rule-color": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"],
      transition: true
    },
    "column-rule-style": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "column-rule-width": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"],
      transition: true
    },
    "column-span": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    "column-width": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"],
      transition: true
    },
    columns: {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"],
      transition: true
    },
    "display-flex": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    "fill-available": {
      props: ["width", "min-width", "max-width", "height", "min-height", "max-height"],
      browsers: ["bb 10", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 7", "opera 15", "opera 16", "opera 17", "safari 7"]
    },
    filter: {
      browsers: ["bb 10", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 6", "safari 7"],
      transition: true
    },
    "fit-content": {
      props: ["width", "min-width", "max-width", "height", "min-height", "max-height"],
      browsers: ["bb 10", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 7", "opera 15", "opera 16", "opera 17", "safari 7"]
    },
    flex: {
      transition: true,
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    "flex-basis": {
      transition: true,
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    "flex-direction": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    "flex-flow": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    "flex-grow": {
      transition: true,
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    "flex-shrink": {
      transition: true,
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    "flex-wrap": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    "font-feature-settings": {
      browsers: ["bb 10", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 7", "opera 15", "opera 16", "opera 17", "safari 7"]
    },
    "font-kerning": {
      browsers: ["bb 10", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 7", "opera 15", "opera 16", "opera 17", "safari 7"]
    },
    "font-language-override": {
      browsers: ["bb 10", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 7", "opera 15", "opera 16", "opera 17", "safari 7"]
    },
    "font-variant-ligatures": {
      browsers: ["bb 10", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 7", "opera 15", "opera 16", "opera 17", "safari 7"]
    },
    hyphens: {
      browsers: ["ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ie 10", "ie 11", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "safari 5.1", "safari 6", "safari 7"]
    },
    "justify-content": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    "linear-gradient": {
      props: ["background", "background-image", "border-image"],
      mistakes: ["-ms-"],
      browsers: ["android 2.1 old", "android 2.2 old", "android 2.3 old", "android 3 old", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "safari 4", "safari 5", "safari 5.1", "safari 6"]
    },
    "max-content": {
      props: ["width", "min-width", "max-width", "height", "min-height", "max-height"],
      browsers: ["bb 10", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 7", "opera 15", "opera 16", "opera 17", "safari 7"]
    },
    "min-content": {
      props: ["width", "min-width", "max-width", "height", "min-height", "max-height"],
      browsers: ["bb 10", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ios 7", "opera 15", "opera 16", "opera 17", "safari 7"]
    },
    order: {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4 2009", "chrome 5 2009", "chrome 6 2009", "chrome 7 2009", "chrome 8 2009", "chrome 9 2009", "chrome 10 2009", "chrome 11 2009", "chrome 12 2009", "chrome 13 2009", "chrome 14 2009", "chrome 15 2009", "chrome 16 2009", "chrome 17 2009", "chrome 18 2009", "chrome 19 2009", "chrome 20 2009", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ie 10", "ios 3.2 2009", "ios 4 2009", "ios 4.1 2009", "ios 4.2 2009", "ios 4.3 2009", "ios 5 2009", "ios 5.1 2009", "ios 6 2009", "ios 6.1 2009", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1 2009", "safari 3.2 2009", "safari 4 2009", "safari 5 2009", "safari 5.1 2009", "safari 6 2009", "safari 7"]
    },
    perspective: {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ie 9", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 10.5", "opera 10.6", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"],
      transition: true
    },
    "perspective-origin": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ie 9", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 10.5", "opera 10.6", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"],
      transition: true
    },
    "radial-gradient": {
      props: ["background", "background-image", "border-image"],
      mistakes: ["-ms-"],
      browsers: ["android 2.1 old", "android 2.2 old", "android 2.3 old", "android 3 old", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "safari 4", "safari 5", "safari 5.1", "safari 6"]
    },
    "repeating-linear-gradient": {
      props: ["background", "background-image", "border-image"],
      mistakes: ["-ms-"],
      browsers: ["android 2.1 old", "android 2.2 old", "android 2.3 old", "android 3 old", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "safari 4", "safari 5", "safari 5.1", "safari 6"]
    },
    "repeating-radial-gradient": {
      props: ["background", "background-image", "border-image"],
      mistakes: ["-ms-"],
      browsers: ["android 2.1 old", "android 2.2 old", "android 2.3 old", "android 3 old", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "safari 4", "safari 5", "safari 5.1", "safari 6"]
    },
    "tab-size": {
      browsers: ["ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "opera 10.6", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "opera 12.1"]
    },
    transform: {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ie 9", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 10.5", "opera 10.6", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"],
      transition: true
    },
    "transform-origin": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ie 9", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 10.5", "opera 10.6", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"],
      transition: true
    },
    "transform-style": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ie 9", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 10.5", "opera 10.6", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    },
    transition: {
      mistakes: ["-ms-"],
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "opera 10.5", "opera 10.6", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6"]
    },
    "transition-delay": {
      mistakes: ["-ms-"],
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "opera 10.5", "opera 10.6", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6"]
    },
    "transition-duration": {
      mistakes: ["-ms-"],
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "opera 10.5", "opera 10.6", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6"]
    },
    "transition-property": {
      mistakes: ["-ms-"],
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "opera 10.5", "opera 10.6", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6"]
    },
    "transition-timing-function": {
      mistakes: ["-ms-"],
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 4", "chrome 5", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "opera 10.5", "opera 10.6", "opera 11", "opera 11.1", "opera 11.5", "opera 11.6", "opera 12", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6"]
    },
    "user-select": {
      browsers: ["android 2.1", "android 2.2", "android 2.3", "android 3", "android 4", "android 4.1", "android 4.2", "bb 7", "bb 10", "chrome 6", "chrome 7", "chrome 8", "chrome 9", "chrome 10", "chrome 11", "chrome 12", "chrome 13", "chrome 14", "chrome 15", "chrome 16", "chrome 17", "chrome 18", "chrome 19", "chrome 20", "chrome 21", "chrome 22", "chrome 23", "chrome 24", "chrome 25", "chrome 26", "chrome 27", "chrome 28", "chrome 29", "chrome 30", "chrome 31", "ff 2", "ff 3", "ff 3.5", "ff 3.6", "ff 4", "ff 5", "ff 6", "ff 7", "ff 8", "ff 9", "ff 10", "ff 11", "ff 12", "ff 13", "ff 14", "ff 15", "ff 16", "ff 17", "ff 18", "ff 19", "ff 20", "ff 21", "ff 22", "ff 23", "ff 24", "ff 25", "ie 10", "ie 11", "ios 3.2", "ios 4", "ios 4.1", "ios 4.2", "ios 4.3", "ios 5", "ios 5.1", "ios 6", "ios 6.1", "ios 7", "opera 15", "opera 16", "opera 17", "safari 3.1", "safari 3.2", "safari 4", "safari 5", "safari 5.1", "safari 6", "safari 7"]
    }
  };

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer.js", function(exports, require, module){
(function() {
  var Autoprefixer, Browsers, CSS, Prefixes, autoprefixer, inspectCache, parse, stringify,
    __slice = [].slice,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  parse = require('css-parse');

  stringify = require('css-stringify');

  Browsers = require('./autoprefixer/browsers');

  Prefixes = require('./autoprefixer/prefixes');

  CSS = require('./autoprefixer/css');

  inspectCache = null;

  autoprefixer = function() {
    var browsers, prefixes, reqs;
    reqs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (reqs.length === 1 && reqs[0] instanceof Array) {
      reqs = reqs[0];
    } else if (reqs.length === 0 || (reqs.length === 1 && (reqs[0] == null))) {
      reqs = void 0;
    }
    if (reqs == null) {
      reqs = autoprefixer["default"];
    }
    browsers = new Browsers(autoprefixer.data.browsers, reqs);
    prefixes = new Prefixes(autoprefixer.data.prefixes, browsers);
    return new Autoprefixer(prefixes, autoprefixer.data);
  };

  autoprefixer.data = {
    browsers: require('../data/browsers'),
    prefixes: require('../data/prefixes')
  };

  Autoprefixer = (function() {
    function Autoprefixer(prefixes, data) {
      this.prefixes = prefixes;
      this.data = data;
      this.rework = __bind(this.rework, this);
      this.browsers = this.prefixes.browsers.selected;
    }

    Autoprefixer.prototype.compile = function(str) {
      var nodes,
        _this = this;
      nodes = this.catchParseErrors(function() {
        return parse(_this.removeBadComments(str));
      });
      this.rework(nodes.stylesheet);
      return stringify(nodes);
    };

    Autoprefixer.prototype.rework = function(stylesheet) {
      var css;
      css = new CSS(stylesheet);
      this.prefixes.processor.add(css);
      return this.prefixes.processor.remove(css);
    };

    Autoprefixer.prototype.inspect = function() {
      inspectCache || (inspectCache = require('./autoprefixer/inspect'));
      return inspectCache(this.prefixes);
    };

    Autoprefixer.prototype.catchParseErrors = function(callback) {
      var e, error;
      try {
        return callback();
      } catch (_error) {
        e = _error;
        error = new Error("Can't parse CSS: " + e.message);
        error.stack = e.stack;
        error.css = true;
        throw error;
      }
    };

    Autoprefixer.prototype.removeBadComments = function(css) {
      return css.replace(/\/\*[^\*]*\}[^\*]*\*\//g, '');
    };

    return Autoprefixer;

  })();

  autoprefixer["default"] = ['> 1%', 'last 2 versions', 'ff 17', 'opera 12.1'];

  autoprefixer.loadDefault = function() {
    return this.defaultCache || (this.defaultCache = autoprefixer(this["default"]));
  };

  autoprefixer.compile = function(str) {
    return this.loadDefault().compile(str);
  };

  autoprefixer.rework = function(stylesheet) {
    return this.loadDefault().rework(stylesheet);
  };

  autoprefixer.inspect = function() {
    return this.loadDefault().inspect();
  };

  module.exports = autoprefixer;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/browsers.js", function(exports, require, module){
(function() {
  var Browsers, utils;

  utils = require('./utils');

  Browsers = (function() {
    function Browsers(data, requirements) {
      this.data = data;
      this.selected = this.parse(requirements);
    }

    Browsers.prototype.parse = function(requirements) {
      var selected,
        _this = this;
      if (!(requirements instanceof Array)) {
        requirements = [requirements];
      }
      selected = [];
      requirements.map(function(req) {
        var i, match, name, _ref;
        _ref = _this.requirements;
        for (name in _ref) {
          i = _ref[name];
          if (match = req.match(i.regexp)) {
            selected = selected.concat(i.select.apply(_this, match.slice(1)));
            return;
          }
        }
        return utils.error("Unknown browser requirement `" + req + "`");
      });
      return utils.uniq(selected);
    };

    Browsers.prototype.requirements = {
      none: {
        regexp: /^none$/i,
        select: function() {
          return [];
        }
      },
      lastVersions: {
        regexp: /^last (\d+) versions?$/i,
        select: function(versions) {
          return this.browsers(function(data) {
            if (data.minor) {
              return [];
            } else {
              return data.versions.slice(0, versions);
            }
          });
        }
      },
      globalStatistics: {
        regexp: /^> (\d+(\.\d+)?)%$/,
        select: function(popularity) {
          return this.browsers(function(data) {
            return data.versions.filter(function(version, i) {
              return data.popularity[i] > popularity;
            });
          });
        }
      },
      newerThen: {
        regexp: /^(\w+) (>=?)\s*([\d\.]+)/,
        select: function(browser, sign, version) {
          var data, filter;
          data = this.data[browser];
          version = parseFloat(version);
          if (!data) {
            utils.error("Unknown browser " + browser);
          }
          if (sign === '>') {
            filter = function(v) {
              return v > version;
            };
          } else if (sign === '>=') {
            filter = function(v) {
              return v >= version;
            };
          }
          return data.versions.filter(filter).map(function(v) {
            return "" + browser + " " + v;
          });
        }
      },
      direct: {
        regexp: /^(\w+) ([\d\.]+)$/,
        select: function(browser, version) {
          var data, first, last;
          data = this.data[browser];
          version = parseFloat(version);
          if (!data) {
            utils.error("Unknown browser " + browser);
          }
          last = data.future ? data.future[0] : data.versions[0];
          first = data.versions[data.versions.length - 1];
          if (version > last) {
            version = last;
          } else if (version < first) {
            version = first;
          }
          return ["" + browser + " " + version];
        }
      }
    };

    Browsers.prototype.browsers = function(criteria) {
      var browser, data, selected, versions, _ref;
      selected = [];
      _ref = this.data;
      for (browser in _ref) {
        data = _ref[browser];
        versions = criteria(data).map(function(version) {
          return "" + browser + " " + version;
        });
        selected = selected.concat(versions);
      }
      return selected;
    };

    Browsers.prototype.prefixes = function() {
      var i, name;
      return this.prefixesCache || (this.prefixesCache = utils.uniq((function() {
        var _ref, _results;
        _ref = this.data;
        _results = [];
        for (name in _ref) {
          i = _ref[name];
          _results.push(i.prefix);
        }
        return _results;
      }).call(this)).sort(function(a, b) {
        return b.length - a.length;
      }));
    };

    Browsers.prototype.prefix = function(browser) {
      var name, version, _ref;
      _ref = browser.split(' '), name = _ref[0], version = _ref[1];
      if (name === 'opera' && parseFloat(version) >= 15) {
        return '-webkit-';
      } else {
        return this.data[name].prefix;
      }
    };

    Browsers.prototype.isSelected = function(browser) {
      return this.selected.indexOf(browser) !== -1;
    };

    return Browsers;

  })();

  module.exports = Browsers;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/css.js", function(exports, require, module){
(function() {
  var CSS, Declaration, Keyframes, Rules;

  Rules = require('./rules');

  Keyframes = require('./keyframes');

  Declaration = require('./declaration');

  CSS = (function() {
    function CSS(stylesheet) {
      this.stylesheet = stylesheet;
    }

    CSS.prototype.eachKeyframes = function(callback) {
      var rule;
      this.number = 0;
      while (this.number < this.stylesheet.rules.length) {
        rule = this.stylesheet.rules[this.number];
        if (rule.keyframes) {
          callback(new Keyframes(this, this.number, rule));
        }
        this.number += 1;
      }
      return false;
    };

    CSS.prototype.containKeyframes = function(rule) {
      return this.stylesheet.rules.some(function(i) {
        return i.keyframes && i.name === rule.name && i.vendor === rule.vendor;
      });
    };

    CSS.prototype.addKeyframes = function(position, rule) {
      if (this.containKeyframes(rule)) {
        return;
      }
      this.stylesheet.rules.splice(position, 0, rule);
      return this.number += 1;
    };

    CSS.prototype.removeKeyframes = function(position) {
      this.stylesheet.rules.splice(position, 1);
      return this.number -= 1;
    };

    CSS.prototype.eachRule = function(callback) {
      return Rules.each(this.stylesheet.rules, callback);
    };

    CSS.prototype.eachDeclaration = function(callback) {
      return this.eachRule(function(rule) {
        return rule.each(callback);
      });
    };

    return CSS;

  })();

  module.exports = CSS;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/declaration.js", function(exports, require, module){
(function() {
  var Declaration, utils;

  utils = require('./utils');

  Declaration = (function() {
    Declaration.register = function(klass) {
      var name, _i, _len, _ref, _results;
      _ref = klass.names;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        _results.push(this.hacks[name] = klass);
      }
      return _results;
    };

    Declaration.hacks = {};

    Declaration.load = function(rule, number, node) {
      var klass, prefix, unprefixed, _ref;
      _ref = this.split(node.property), prefix = _ref[0], unprefixed = _ref[1];
      klass = this.hacks[unprefixed];
      if (klass) {
        return new klass(rule, number, node, prefix, unprefixed);
      } else {
        return new Declaration(rule, number, node, prefix, unprefixed);
      }
    };

    Declaration.split = function(prop) {
      var prefix, separator, unprefixed;
      if (prop[0] === '-') {
        separator = prop.indexOf('-', 1) + 1;
        prefix = prop.slice(0, separator);
        unprefixed = prop.slice(separator);
        return [prefix, unprefixed];
      } else {
        return ['', prop];
      }
    };

    function Declaration(rule, number, node, prefix, unprefixed) {
      this.rule = rule;
      this.number = number;
      this.node = node;
      this.prefix = prefix;
      this.unprefixed = unprefixed;
      this.prop = this.node.property;
      this.value = this.node.value;
      this.valuesCache = {};
    }

    Declaration.prototype.valueContain = function(strings) {
      var _this = this;
      return strings.some(function(i) {
        return _this.value.indexOf(i) !== -1;
      });
    };

    Declaration.prototype.prefixProp = function(prefix, value) {
      if (value == null) {
        value = this.value;
      }
      if (this.rule.contain(prefix + this.unprefixed)) {
        return;
      }
      return this.insertBefore(prefix + this.unprefixed, value);
    };

    Declaration.prototype.insertBefore = function(prop, value) {
      var clone;
      if (this.rule.contain(prop, value)) {
        return;
      }
      clone = utils.clone(this.node, {
        property: prop,
        value: value
      });
      this.rule.add(this.number, clone);
      return this.number += 1;
    };

    Declaration.prototype.remove = function() {
      return this.rule.removeDecl(this.number);
    };

    Declaration.prototype.prefixValue = function(prefix, value) {
      var val;
      val = this.valuesCache[prefix] || this.value;
      return this.valuesCache[prefix] = value.addPrefix(prefix, val);
    };

    Declaration.prototype.setValue = function(value) {
      return this.value = this.node.value = value;
    };

    Declaration.prototype.saveValues = function() {
      var prefix, value, vendor, _ref, _results;
      _ref = this.valuesCache;
      _results = [];
      for (prefix in _ref) {
        value = _ref[prefix];
        vendor = utils.removeNote(prefix);
        if (this.rule.prefix && vendor !== this.rule.prefix) {
          continue;
        }
        if (vendor === this.prefix) {
          _results.push(this.setValue(value));
        } else if (!this.rule.byProp(vendor + this.unprefixed)) {
          _results.push(this.insertBefore(this.prop, value));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Declaration;

  })();

  module.exports = Declaration;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/align-content.js", function(exports, require, module){
(function() {
  var AlignContent, FlexDeclaration,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  AlignContent = (function(_super) {
    __extends(AlignContent, _super);

    AlignContent.names = ['align-content', 'flex-line-pack'];

    AlignContent.oldValues = {
      'flex-end': 'end',
      'flex-start': 'start',
      'space-between': 'justify',
      'space-around': 'distribute'
    };

    function AlignContent() {
      AlignContent.__super__.constructor.apply(this, arguments);
      this.unprefixed = 'align-content';
      this.prop = this.prefix + this.unprefixed;
    }

    AlignContent.prototype.prefixProp = function(prefix) {
      var oldValue, spec, _ref;
      _ref = this.flexSpec(prefix), spec = _ref[0], prefix = _ref[1];
      if (spec === '2012') {
        oldValue = AlignContent.oldValues[this.value] || this.value;
        return this.insertBefore(prefix + 'flex-line-pack', oldValue);
      } else if (spec === 'final') {
        return AlignContent.__super__.prefixProp.apply(this, arguments);
      }
    };

    return AlignContent;

  })(FlexDeclaration);

  module.exports = AlignContent;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/align-items.js", function(exports, require, module){
(function() {
  var AlignItems, FlexDeclaration,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  AlignItems = (function(_super) {
    __extends(AlignItems, _super);

    AlignItems.names = ['align-items', 'flex-align', 'box-align'];

    AlignItems.oldValues = {
      'flex-end': 'end',
      'flex-start': 'start'
    };

    function AlignItems() {
      AlignItems.__super__.constructor.apply(this, arguments);
      this.unprefixed = 'align-items';
      this.prop = this.prefix + this.unprefixed;
    }

    AlignItems.prototype.prefixProp = function(prefix) {
      var oldValue, spec, _ref;
      _ref = this.flexSpec(prefix), spec = _ref[0], prefix = _ref[1];
      oldValue = AlignItems.oldValues[this.value] || this.value;
      if (spec === '2009') {
        return this.insertBefore(prefix + 'box-align', oldValue);
      } else if (spec === '2012') {
        return this.insertBefore(prefix + 'flex-align', oldValue);
      } else if (spec === 'final') {
        return AlignItems.__super__.prefixProp.apply(this, arguments);
      }
    };

    return AlignItems;

  })(FlexDeclaration);

  module.exports = AlignItems;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/align-self.js", function(exports, require, module){
(function() {
  var AlignSelf, FlexDeclaration,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  AlignSelf = (function(_super) {
    __extends(AlignSelf, _super);

    AlignSelf.names = ['align-self', 'flex-item-align'];

    AlignSelf.oldValues = {
      'flex-end': 'end',
      'flex-start': 'start'
    };

    function AlignSelf() {
      AlignSelf.__super__.constructor.apply(this, arguments);
      this.unprefixed = 'align-self';
      this.prop = this.prefix + this.unprefixed;
    }

    AlignSelf.prototype.prefixProp = function(prefix) {
      var oldValue, spec, _ref;
      _ref = this.flexSpec(prefix), spec = _ref[0], prefix = _ref[1];
      if (spec === '2012') {
        oldValue = AlignSelf.oldValues[this.value] || this.value;
        return this.insertBefore(prefix + 'flex-item-align', oldValue);
      } else if (spec === 'final') {
        return AlignSelf.__super__.prefixProp.apply(this, arguments);
      }
    };

    return AlignSelf;

  })(FlexDeclaration);

  module.exports = AlignSelf;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/border-image.js", function(exports, require, module){
(function() {
  var BorderImage, Declaration, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Declaration = require('../declaration');

  BorderImage = (function(_super) {
    __extends(BorderImage, _super);

    function BorderImage() {
      _ref = BorderImage.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BorderImage.names = ['border-image'];

    BorderImage.prototype.prefixProp = function(prefix) {
      return BorderImage.__super__.prefixProp.call(this, prefix, this.value.replace(/\s+fill(\s)/, '$1'));
    };

    return BorderImage;

  })(Declaration);

  module.exports = BorderImage;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/border-radius.js", function(exports, require, module){
(function() {
  var BorderRadius, Declaration,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Declaration = require('../declaration');

  BorderRadius = (function(_super) {
    var hor, mozilla, normal, ver, _i, _j, _len, _len1, _ref, _ref1;

    __extends(BorderRadius, _super);

    BorderRadius.names = ['border-radius'];

    BorderRadius.toMozilla = {};

    BorderRadius.toNormal = {};

    _ref = ['top', 'bottom'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      ver = _ref[_i];
      _ref1 = ['left', 'right'];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        hor = _ref1[_j];
        normal = "border-" + ver + "-" + hor + "-radius";
        mozilla = "border-radius-" + ver + hor;
        BorderRadius.names.push(normal);
        BorderRadius.names.push(mozilla);
        BorderRadius.toMozilla[normal] = mozilla;
        BorderRadius.toNormal[mozilla] = normal;
      }
    }

    function BorderRadius() {
      BorderRadius.__super__.constructor.apply(this, arguments);
      if (this.prefix === '-moz-') {
        this.unprefixed = BorderRadius.toNormal[this.unprefixed] || this.unprefixed;
        this.prop = this.prefix + this.unprefixed;
      }
    }

    BorderRadius.prototype.prefixProp = function(prefix) {
      var prop;
      if (prefix === '-moz-') {
        prop = BorderRadius.toMozilla[this.unprefixed] || this.unprefixed;
        if (this.rule.contain(prefix + prop)) {
          return;
        }
        return this.insertBefore(prefix + prop, this.value);
      } else {
        return BorderRadius.__super__.prefixProp.apply(this, arguments);
      }
    };

    return BorderRadius;

  })(Declaration);

  module.exports = BorderRadius;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/display-flex.js", function(exports, require, module){
(function() {
  var DisplayFlex, FlexDeclaration,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  DisplayFlex = (function(_super) {
    __extends(DisplayFlex, _super);

    DisplayFlex.names = ['display'];

    function DisplayFlex() {
      var name, prefix, _ref;
      DisplayFlex.__super__.constructor.apply(this, arguments);
      _ref = FlexDeclaration.split(this.value), prefix = _ref[0], name = _ref[1];
      if (name === 'flex' || name === 'box' || name === 'flexbox') {
        this.prefix = prefix;
        this.unprefixed = 'display-flex';
        this.prop = this.prefix + this.unprefixed;
      } else if (name === 'inline-flex' || name === 'inline-flexbox') {
        this.prefix = prefix;
        this.unprefixed = 'display-flex';
        this.prop = this.prefix + this.unprefixed;
        this.inline = true;
      }
    }

    DisplayFlex.prototype.prefixProp = function(prefix) {
      var spec, _ref;
      if (this.unprefixed !== 'display-flex') {
        return DisplayFlex.__super__.prefixProp.apply(this, arguments);
      } else {
        _ref = this.flexSpec(prefix), spec = _ref[0], prefix = _ref[1];
        if (spec === '2009') {
          if (!this.inline) {
            return this.prefixDisplay(prefix, 'box');
          }
        } else if (spec === '2012') {
          return this.prefixDisplay(prefix, this.inline ? 'inline-flexbox' : 'flexbox');
        } else if (spec === 'final') {
          return this.prefixDisplay(prefix, this.inline ? 'inline-flex' : 'flex');
        }
      }
    };

    DisplayFlex.prototype.prefixDisplay = function(prefix, name) {
      return this.insertBefore('display', prefix + name);
    };

    return DisplayFlex;

  })(FlexDeclaration);

  module.exports = DisplayFlex;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/fill-available.js", function(exports, require, module){
(function() {
  var FillAvailable, OldValue, Value, utils, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  OldValue = require('../old-value');

  Value = require('../value');

  utils = require('../utils');

  FillAvailable = (function(_super) {
    __extends(FillAvailable, _super);

    function FillAvailable() {
      _ref = FillAvailable.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    FillAvailable.names = ['fill-available'];

    FillAvailable.prototype.addPrefix = function(prefix, string) {
      if (prefix === '-moz-') {
        return string.replace(this.regexp, '$1-moz-available$3');
      } else {
        return FillAvailable.__super__.addPrefix.apply(this, arguments);
      }
    };

    FillAvailable.prototype.old = function(prefix) {
      if (prefix === '-moz-') {
        return new OldValue('-moz-available');
      } else {
        return FillAvailable.__super__.old.apply(this, arguments);
      }
    };

    return FillAvailable;

  })(Value);

  module.exports = FillAvailable;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/filter.js", function(exports, require, module){
(function() {
  var Declaration, Filter,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Declaration = require('../declaration');

  Filter = (function(_super) {
    __extends(Filter, _super);

    Filter.names = ['filter'];

    function Filter() {
      Filter.__super__.constructor.apply(this, arguments);
      if (this.value.indexOf('DXImageTransform.Microsoft') !== -1 || this.value.indexOf('alpha(') !== -1) {
        this.unprefixed = this.prop = '-ms-filter';
      }
    }

    return Filter;

  })(Declaration);

  module.exports = Filter;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/flex-basis.js", function(exports, require, module){
(function() {
  var FlexBasis, FlexDeclaration, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  FlexBasis = (function(_super) {
    __extends(FlexBasis, _super);

    function FlexBasis() {
      _ref = FlexBasis.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    FlexBasis.names = ['flex-basis'];

    FlexBasis.prototype.prefixProp = function(prefix) {
      var spec, _ref1;
      _ref1 = this.flexSpec(prefix), spec = _ref1[0], prefix = _ref1[1];
      if (spec === '2012') {
        return this.insertBefore(prefix + 'flex', '0 1 ' + this.value);
      } else if (spec === 'final') {
        return FlexBasis.__super__.prefixProp.apply(this, arguments);
      }
    };

    return FlexBasis;

  })(FlexDeclaration);

  module.exports = FlexBasis;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/flex-declaration.js", function(exports, require, module){
(function() {
  var Declaration, FlexDeclaration, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Declaration = require('../declaration');

  FlexDeclaration = (function(_super) {
    __extends(FlexDeclaration, _super);

    function FlexDeclaration() {
      _ref = FlexDeclaration.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    FlexDeclaration.prototype.flexSpec = function(prefix) {
      var spec;
      spec = prefix === '-webkit- 2009' || prefix === '-moz-' ? '2009' : prefix === '-ms-' ? '2012' : prefix === '-webkit-' ? 'final' : void 0;
      if (prefix === '-webkit- 2009') {
        prefix = '-webkit-';
      }
      return [spec, prefix];
    };

    return FlexDeclaration;

  })(Declaration);

  module.exports = FlexDeclaration;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/flex-direction.js", function(exports, require, module){
(function() {
  var FlexDeclaration, FlexDirection,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  FlexDirection = (function(_super) {
    __extends(FlexDirection, _super);

    FlexDirection.names = ['flex-direction', 'box-direction', 'box-orient'];

    function FlexDirection() {
      FlexDirection.__super__.constructor.apply(this, arguments);
      this.unprefixed = 'flex-direction';
      this.prop = this.prefix + this.unprefixed;
    }

    FlexDirection.prototype.prefixProp = function(prefix) {
      var dir, orient, spec, _ref;
      _ref = this.flexSpec(prefix), spec = _ref[0], prefix = _ref[1];
      if (spec === '2009') {
        orient = this.value.indexOf('row') !== -1 ? 'horizontal' : 'vertical';
        this.insertBefore(prefix + 'box-orient', orient);
        dir = this.value.indexOf('reverse') !== -1 ? 'reverse' : 'normal';
        return this.insertBefore(prefix + 'box-direction', dir);
      } else {
        return FlexDirection.__super__.prefixProp.apply(this, arguments);
      }
    };

    return FlexDirection;

  })(FlexDeclaration);

  module.exports = FlexDirection;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/flex-flow.js", function(exports, require, module){
(function() {
  var FlexDeclaration, FlexFlow, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  FlexFlow = (function(_super) {
    __extends(FlexFlow, _super);

    function FlexFlow() {
      _ref = FlexFlow.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    FlexFlow.names = ['flex-flow'];

    FlexFlow.prototype.prefixProp = function(prefix) {
      var spec, _ref1;
      _ref1 = this.flexSpec(prefix), spec = _ref1[0], prefix = _ref1[1];
      if (spec === '2012') {
        return FlexFlow.__super__.prefixProp.apply(this, arguments);
      } else if (spec === 'final') {
        return FlexFlow.__super__.prefixProp.apply(this, arguments);
      }
    };

    return FlexFlow;

  })(FlexDeclaration);

  module.exports = FlexFlow;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/flex-grow.js", function(exports, require, module){
(function() {
  var Flex, FlexDeclaration, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  Flex = (function(_super) {
    __extends(Flex, _super);

    function Flex() {
      _ref = Flex.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Flex.names = ['flex-grow'];

    Flex.prototype.prefixProp = function(prefix) {
      var spec, _ref1;
      _ref1 = this.flexSpec(prefix), spec = _ref1[0], prefix = _ref1[1];
      if (spec === '2009') {
        return this.insertBefore(prefix + 'box-flex', this.value);
      } else if (spec === '2012') {
        return this.insertBefore(prefix + 'flex', this.value);
      } else if (spec === 'final') {
        return Flex.__super__.prefixProp.apply(this, arguments);
      }
    };

    return Flex;

  })(FlexDeclaration);

  module.exports = Flex;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/flex-shrink.js", function(exports, require, module){
(function() {
  var FlexDeclaration, FlexShrink, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  FlexShrink = (function(_super) {
    __extends(FlexShrink, _super);

    function FlexShrink() {
      _ref = FlexShrink.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    FlexShrink.names = ['flex-shrink'];

    FlexShrink.prototype.prefixProp = function(prefix) {
      var spec, _ref1;
      _ref1 = this.flexSpec(prefix), spec = _ref1[0], prefix = _ref1[1];
      if (spec === '2012') {
        return this.insertBefore(prefix + 'flex', '0 ' + this.value);
      } else if (spec === 'final') {
        return FlexShrink.__super__.prefixProp.apply(this, arguments);
      }
    };

    return FlexShrink;

  })(FlexDeclaration);

  module.exports = FlexShrink;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/flex-wrap.js", function(exports, require, module){
(function() {
  var FlexDeclaration, FlexWrap, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  FlexWrap = (function(_super) {
    __extends(FlexWrap, _super);

    function FlexWrap() {
      _ref = FlexWrap.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    FlexWrap.names = ['flex-wrap'];

    FlexWrap.prototype.prefixProp = function(prefix) {
      var spec, _ref1;
      _ref1 = this.flexSpec(prefix), spec = _ref1[0], prefix = _ref1[1];
      if (spec === '2012') {
        return FlexWrap.__super__.prefixProp.apply(this, arguments);
      } else if (spec === 'final') {
        return FlexWrap.__super__.prefixProp.apply(this, arguments);
      }
    };

    return FlexWrap;

  })(FlexDeclaration);

  module.exports = FlexWrap;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/flex.js", function(exports, require, module){
(function() {
  var Flex, FlexDeclaration,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  Flex = (function(_super) {
    __extends(Flex, _super);

    Flex.names = ['flex', 'box-flex'];

    function Flex() {
      Flex.__super__.constructor.apply(this, arguments);
      this.unprefixed = 'flex';
      this.prop = this.prefix + this.unprefixed;
    }

    Flex.prototype.prefixProp = function(prefix) {
      var first, spec, _ref;
      _ref = this.flexSpec(prefix), spec = _ref[0], prefix = _ref[1];
      if (spec === '2009') {
        first = this.value.split(' ')[0];
        return this.insertBefore(prefix + 'box-flex', first);
      } else if (spec === '2012') {
        return Flex.__super__.prefixProp.apply(this, arguments);
      } else if (spec === 'final') {
        return Flex.__super__.prefixProp.apply(this, arguments);
      }
    };

    return Flex;

  })(FlexDeclaration);

  module.exports = Flex;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/fullscreen.js", function(exports, require, module){
(function() {
  var Fullscreen, Selector, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Selector = require('../selector');

  Fullscreen = (function(_super) {
    __extends(Fullscreen, _super);

    function Fullscreen() {
      _ref = Fullscreen.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Fullscreen.names = [':fullscreen'];

    Fullscreen.prototype.prefixed = function(prefix) {
      if ('-webkit-' === prefix) {
        return ':-webkit-full-screen';
      } else if ('-moz-' === prefix) {
        return ':-moz-full-screen';
      } else {
        return ":" + prefix + "fullscreen";
      }
    };

    return Fullscreen;

  })(Selector);

  module.exports = Fullscreen;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/gradient.js", function(exports, require, module){
(function() {
  var Gradient, OldValue, Value, isDirection, utils,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  OldValue = require('../old-value');

  Value = require('../value');

  utils = require('../utils');

  isDirection = new RegExp('(top|left|right|bottom)', 'gi');

  Gradient = (function(_super) {
    var i, _i, _len, _ref;

    __extends(Gradient, _super);

    Gradient.names = ['linear-gradient', 'repeating-linear-gradient', 'radial-gradient', 'repeating-radial-gradient'];

    Gradient.regexps = {};

    _ref = Gradient.names;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      Gradient.regexps[i] = new RegExp('(^|\\s|,)' + i + '\\((.+)\\)', 'gi');
    }

    function Gradient(name, prefixes) {
      this.name = name;
      this.prefixes = prefixes;
      this.regexp = Gradient.regexps[this.name];
    }

    Gradient.prototype.addPrefix = function(prefix, string) {
      var _this = this;
      return string.replace(this.regexp, function(all, before, args) {
        var params;
        params = _this.splitParams(args);
        params = _this.newDirection(params);
        if (prefix === '-webkit- old') {
          if (_this.name !== 'linear-gradient') {
            return all;
          }
          if (params[0] && params[0].indexOf('deg') !== -1) {
            return all;
          }
          if (args.indexOf('-corner') !== -1) {
            return all;
          }
          if (args.indexOf('-side') !== -1) {
            return all;
          }
          params = _this.oldDirection(params);
          params = _this.colorStops(params);
          return '-webkit-gradient(linear, ' + params.join(', ') + ')';
        } else {
          if (params.length > 0) {
            if (params[0].slice(0, 3) === 'to ') {
              params[0] = _this.fixDirection(params[0]);
            } else if (params[0].indexOf('deg') !== -1) {
              params[0] = _this.fixAngle(params[0]);
            } else if (params[0].indexOf(' at ') !== -1) {
              _this.fixRadial(params);
            }
          }
          return before + prefix + _this.name + '(' + params.join(', ') + ')';
        }
      });
    };

    Gradient.prototype.directions = {
      top: 'bottom',
      left: 'right',
      bottom: 'top',
      right: 'left'
    };

    Gradient.prototype.oldDirections = {
      'top': 'bottom left, top left',
      'left': 'top right, top left',
      'bottom': 'top left, bottom left',
      'right': 'top left, top right',
      'top right': 'bottom left, top right',
      'top left': 'bottom right, top left',
      'bottom right': 'top left, bottom right',
      'bottom left': 'top right, bottom left'
    };

    Gradient.prototype.splitParams = function(params) {
      var array, char, func, param, _j, _len1;
      array = [];
      param = '';
      func = 0;
      for (_j = 0, _len1 = params.length; _j < _len1; _j++) {
        char = params[_j];
        if (char === ')' && func > 0) {
          func -= 1;
          param += char;
        } else if (char === '(') {
          param += char;
          func += 1;
        } else if (func > 0) {
          param += char;
        } else if (char === ',') {
          array.push(param.trim());
          param = '';
        } else {
          param += char;
        }
      }
      array.push(param.trim());
      return array;
    };

    Gradient.prototype.newDirection = function(params) {
      var first, value;
      first = params[0];
      if (first.indexOf('to ') === -1 && isDirection.test(first)) {
        first = first.split(' ');
        first = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = first.length; _j < _len1; _j++) {
            value = first[_j];
            _results.push(this.directions[value.toLowerCase()] || value);
          }
          return _results;
        }).call(this);
        params[0] = 'to ' + first.join(' ');
      }
      return params;
    };

    Gradient.prototype.fixDirection = function(param) {
      var value;
      param = param.split(' ');
      param.splice(0, 1);
      param = (function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = param.length; _j < _len1; _j++) {
          value = param[_j];
          _results.push(this.directions[value.toLowerCase()] || value);
        }
        return _results;
      }).call(this);
      return param.join(' ');
    };

    Gradient.prototype.roundFloat = function(float, digits) {
      return parseFloat(float.toFixed(digits));
    };

    Gradient.prototype.fixAngle = function(param) {
      param = parseFloat(param);
      param = Math.abs(450 - param) % 360;
      param = this.roundFloat(param, 3);
      return "" + param + "deg";
    };

    Gradient.prototype.fixRadial = function(params) {
      var first;
      first = params[0].split(/\s+at\s+/);
      return params.splice(0, 1, first[1], first[0]);
    };

    Gradient.prototype.oldDirection = function(params) {
      var direction;
      if (params.length === 0) {
        params;
      }
      if (params[0].indexOf('to ') !== -1) {
        direction = params[0].replace(/^to\s+/, '');
        direction = this.oldDirections[direction];
        params[0] = direction;
        return params;
      } else {
        direction = this.oldDirections.bottom;
        return [direction].concat(params);
      }
    };

    Gradient.prototype.colorStops = function(params) {
      return params.map(function(param, i) {
        var color, position, separator;
        if (i === 0) {
          return param;
        }
        separator = param.lastIndexOf(' ');
        if (separator === -1) {
          color = param;
          position = void 0;
        } else {
          color = param.slice(0, separator);
          position = param.slice(separator + 1);
        }
        if (position && position.indexOf(')') !== -1) {
          color += ' ' + position;
          position = void 0;
        }
        if (i === 1) {
          return "from(" + color + ")";
        } else if (i === params.length - 1) {
          return "to(" + color + ")";
        } else if (position) {
          return "color-stop(" + position + ", " + color + ")";
        } else {
          return "color-stop(" + color + ")";
        }
      });
    };

    Gradient.prototype.old = function(prefix) {
      var regexp, string, type;
      if (prefix === '-webkit-') {
        type = this.name === 'linear-gradient' ? 'linear' : 'radial';
        string = '-gradient';
        regexp = utils.regexp("-webkit-(" + type + "-gradient|gradient\\(\\s*" + type + ")", false);
        return new OldValue(prefix + this.name, string, regexp);
      } else {
        return Gradient.__super__.old.apply(this, arguments);
      }
    };

    return Gradient;

  })(Value);

  module.exports = Gradient;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/justify-content.js", function(exports, require, module){
(function() {
  var FlexDeclaration, JustifyContent,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  JustifyContent = (function(_super) {
    __extends(JustifyContent, _super);

    JustifyContent.names = ['justify-content', 'flex-pack', 'box-pack'];

    JustifyContent.oldValues = {
      'flex-end': 'end',
      'flex-start': 'start',
      'space-between': 'justify',
      'space-around': 'distribute'
    };

    function JustifyContent() {
      JustifyContent.__super__.constructor.apply(this, arguments);
      this.unprefixed = 'justify-content';
      this.prop = this.prefix + this.unprefixed;
    }

    JustifyContent.prototype.prefixProp = function(prefix) {
      var oldValue, spec, _ref;
      _ref = this.flexSpec(prefix), spec = _ref[0], prefix = _ref[1];
      oldValue = JustifyContent.oldValues[this.value] || this.value;
      if (spec === '2009') {
        if (this.value !== 'space-around') {
          return this.insertBefore(prefix + 'box-pack', oldValue);
        }
      } else if (spec === '2012') {
        return this.insertBefore(prefix + 'flex-pack', oldValue);
      } else if (spec === 'final') {
        return JustifyContent.__super__.prefixProp.apply(this, arguments);
      }
    };

    return JustifyContent;

  })(FlexDeclaration);

  module.exports = JustifyContent;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/order.js", function(exports, require, module){
(function() {
  var FlexDeclaration, Order,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FlexDeclaration = require('./flex-declaration');

  Order = (function(_super) {
    __extends(Order, _super);

    Order.names = ['order', 'flex-order', 'box-ordinal-group'];

    function Order() {
      Order.__super__.constructor.apply(this, arguments);
      this.unprefixed = 'order';
      this.prop = this.prefix + this.unprefixed;
    }

    Order.prototype.prefixProp = function(prefix) {
      var oldValue, spec, _ref;
      _ref = this.flexSpec(prefix), spec = _ref[0], prefix = _ref[1];
      if (spec === '2009') {
        oldValue = parseInt(this.value) + 1;
        return this.insertBefore(prefix + 'box-ordinal-group', oldValue.toString());
      } else if (spec === '2012') {
        return this.insertBefore(prefix + 'flex-order', this.value);
      } else if (spec === 'final') {
        return Order.__super__.prefixProp.apply(this, arguments);
      }
    };

    return Order;

  })(FlexDeclaration);

  module.exports = Order;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/placeholder.js", function(exports, require, module){
(function() {
  var Placeholder, Selector, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Selector = require('../selector');

  Placeholder = (function(_super) {
    __extends(Placeholder, _super);

    function Placeholder() {
      _ref = Placeholder.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Placeholder.names = ['::placeholder'];

    Placeholder.prototype.prefixed = function(prefix) {
      if ('-webkit-' === prefix) {
        return '::-webkit-input-placeholder';
      } else if ('-ms-' === prefix) {
        return ':-ms-input-placeholder';
      } else {
        return "::" + prefix + "placeholder";
      }
    };

    return Placeholder;

  })(Selector);

  module.exports = Placeholder;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/hacks/transition.js", function(exports, require, module){
(function() {
  var Declaration, Transition, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Declaration = require('../declaration');

  Transition = (function(_super) {
    __extends(Transition, _super);

    function Transition() {
      _ref = Transition.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Transition.names = ['transition', 'transition-property'];

    Transition.prototype.prefixValue = function(prefix, value) {
      if (prefix === '-ms-' && value.name === 'transform') {

      } else {
        return Transition.__super__.prefixValue.apply(this, arguments);
      }
    };

    return Transition;

  })(Declaration);

  module.exports = Transition;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/inspect.js", function(exports, require, module){
(function() {
  var capitalize, names, prefix;

  capitalize = function(str) {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
  };

  names = {
    ie: 'IE',
    ff: 'Firefox',
    ios: 'iOS'
  };

  prefix = function(name, transition, prefixes) {
    var out;
    out = '  ' + name + (transition ? '*' : '') + ': ';
    out += prefixes.map(function(i) {
      return i.replace(/^-(.*)-$/g, '$1');
    }).join(', ');
    out += "\n";
    return out;
  };

  module.exports = function(prefixes) {
    var browser, data, list, name, needTransition, out, props, string, transitionProp, useTransition, value, values, version, versions, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4;
    if (prefixes.browsers.selected.length === 0) {
      return "No browsers selected";
    }
    versions = [];
    _ref = prefixes.browsers.selected;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      browser = _ref[_i];
      _ref1 = browser.split(' '), name = _ref1[0], version = _ref1[1];
      name = names[name] || capitalize(name);
      if (versions[name]) {
        versions[name].push(version);
      } else {
        versions[name] = [version];
      }
    }
    out = "Browsers:\n";
    for (browser in versions) {
      list = versions[browser];
      list = list.sort(function(a, b) {
        return parseFloat(b) - parseFloat(a);
      });
      out += '  ' + browser + ': ' + list.join(', ') + "\n";
    }
    values = '';
    props = '';
    useTransition = false;
    needTransition = (_ref2 = prefixes.add.transition) != null ? _ref2.prefixes : void 0;
    _ref3 = prefixes.add;
    for (name in _ref3) {
      data = _ref3[name];
      if (data.prefixes) {
        transitionProp = needTransition && prefixes.data[name].transition;
        if (transitionProp) {
          useTransition = true;
        }
        props += prefix(name, transitionProp, data.prefixes);
      }
      if (!data.values) {
        continue;
      }
      if (prefixes.transitionProps.some(function(i) {
        return i === name;
      })) {
        continue;
      }
      _ref4 = data.values;
      for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
        value = _ref4[_j];
        string = prefix(value.name, false, value.prefixes);
        if (values.indexOf(string) === -1) {
          values += string;
        }
      }
    }
    if (useTransition) {
      props += "  * - can be used in transition\n";
    }
    if (props !== '') {
      out += "\nProperties:\n" + props;
    }
    if (values !== '') {
      out += "\nValues:\n" + values;
    }
    return out;
  };

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/keyframes.js", function(exports, require, module){
(function() {
  var Keyframes, utils;

  utils = require('./utils');

  Keyframes = (function() {
    function Keyframes(css, number, rule) {
      this.css = css;
      this.number = number;
      this.rule = rule;
      this.prefix = this.rule.vendor;
    }

    Keyframes.prototype.clone = function() {
      return utils.clone(this.rule, {
        keyframes: this.rule.keyframes.map(function(i) {
          if (i.type === 'keyframe') {
            return utils.clone(i, {
              values: i.values.slice(),
              declarations: i.declarations.map(function(decl) {
                return utils.clone(decl);
              })
            });
          } else {
            return utils.clone(i);
          }
        })
      });
    };

    Keyframes.prototype.cloneWithPrefix = function(prefix) {
      var clone;
      clone = this.clone();
      clone.vendor = prefix;
      this.css.addKeyframes(this.number, clone);
      return this.number += 1;
    };

    Keyframes.prototype.remove = function() {
      return this.css.removeKeyframes(this.number);
    };

    return Keyframes;

  })();

  module.exports = Keyframes;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/old-value.js", function(exports, require, module){
(function() {
  var OldValue, utils;

  utils = require('./utils');

  OldValue = (function() {
    function OldValue(name, string, regexp) {
      this.name = name;
      this.string = string;
      this.regexp = regexp;
      this.regexp || (this.regexp = utils.regexp(this.name));
      this.string || (this.string = this.name);
    }

    OldValue.prototype.check = function(value) {
      if (value.indexOf(this.string) !== -1) {
        return !!value.match(this.regexp);
      } else {
        return false;
      }
    };

    return OldValue;

  })();

  module.exports = OldValue;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/prefixes.js", function(exports, require, module){
(function() {
  var Prefixes, Processor, Selector, Value, utils;

  utils = require('./utils');

  Processor = require('./processor');

  Selector = require('./selector');

  Value = require('./value');

  Value.register(require('./hacks/gradient'));

  Value.register(require('./hacks/fill-available'));

  Selector.register(require('./hacks/fullscreen'));

  Selector.register(require('./hacks/placeholder'));

  Prefixes = (function() {
    function Prefixes(data, browsers) {
      var _ref;
      this.data = data;
      this.browsers = browsers;
      _ref = this.preprocess(this.select(this.data)), this.add = _ref[0], this.remove = _ref[1];
      this.otherCache = {};
      this.processor = new Processor(this);
    }

    Prefixes.prototype.transitionProps = ['transition', 'transition-property'];

    Prefixes.prototype.select = function(list) {
      var add, all, data, name, selected,
        _this = this;
      selected = {
        add: {},
        remove: {}
      };
      for (name in list) {
        data = list[name];
        add = data.browsers.map(function(i) {
          var params;
          params = i.split(' ');
          return {
            browser: params[0] + ' ' + params[1],
            note: params[2]
          };
        });
        add = add.filter(function(i) {
          return _this.browsers.isSelected(i.browser);
        }).map(function(i) {
          var prefix;
          prefix = _this.browsers.prefix(i.browser);
          if (i.note) {
            return prefix + ' ' + i.note;
          } else {
            return prefix;
          }
        });
        add = utils.uniq(add).sort(function(a, b) {
          return b.length - a.length;
        });
        all = data.browsers.map(function(i) {
          return _this.browsers.prefix(i);
        });
        if (data.mistakes) {
          all = all.concat(data.mistakes);
        }
        all = utils.uniq(all);
        if (add.length) {
          selected.add[name] = add;
          if (add.length < all.length) {
            selected.remove[name] = all.filter(function(i) {
              return add.indexOf(i) === -1;
            });
          }
        } else {
          selected.remove[name] = all;
        }
      }
      return selected;
    };

    Prefixes.prototype.preprocess = function(selected) {
      var add, name, old, prefix, prefixed, prefixes, prop, props, remove, selector, value, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1;
      add = {
        selectors: []
      };
      _ref = selected.add;
      for (name in _ref) {
        prefixes = _ref[name];
        if (this.data[name].selector) {
          add.selectors.push(Selector.load(name, prefixes));
        } else {
          props = this.data[name].transition ? this.transitionProps : this.data[name].props;
          if (props) {
            value = Value.load(name, prefixes);
            for (_i = 0, _len = props.length; _i < _len; _i++) {
              prop = props[_i];
              if (!add[prop]) {
                add[prop] = {};
              }
              if (!add[prop].values) {
                add[prop].values = [];
              }
              add[prop].values.push(value);
            }
          }
          if (!this.data[name].props) {
            if (!add[name]) {
              add[name] = {};
            }
            add[name].prefixes = prefixes;
          }
        }
      }
      remove = {
        selectors: []
      };
      _ref1 = selected.remove;
      for (name in _ref1) {
        prefixes = _ref1[name];
        if (this.data[name].selector) {
          selector = Selector.load(name, prefixes);
          for (_j = 0, _len1 = prefixes.length; _j < _len1; _j++) {
            prefix = prefixes[_j];
            remove.selectors.push(selector.prefixed(prefix));
          }
        } else {
          props = this.data[name].transition ? this.transitionProps : this.data[name].props;
          if (props) {
            value = Value.load(name);
            for (_k = 0, _len2 = prefixes.length; _k < _len2; _k++) {
              prefix = prefixes[_k];
              old = value.old(prefix);
              for (_l = 0, _len3 = props.length; _l < _len3; _l++) {
                prop = props[_l];
                if (!remove[prop]) {
                  remove[prop] = {};
                }
                if (!remove[prop].values) {
                  remove[prop].values = [];
                }
                remove[prop].values.push(old);
              }
            }
          }
          if (!this.data[name].props) {
            for (_m = 0, _len4 = prefixes.length; _m < _len4; _m++) {
              prefix = prefixes[_m];
              prefixed = prefix + name;
              if (!remove[prefixed]) {
                remove[prefixed] = {};
              }
              remove[prefixed].remove = true;
            }
          }
        }
      }
      return [add, remove];
    };

    Prefixes.prototype.other = function(prefix) {
      var _base;
      return (_base = this.otherCache)[prefix] || (_base[prefix] = this.browsers.prefixes().filter(function(i) {
        return i !== prefix;
      }));
    };

    Prefixes.prototype.each = function(prop, callback) {
      var prefix, _i, _len, _ref, _results;
      if (this.add[prop] && this.add[prop].prefixes) {
        _ref = this.add[prop].prefixes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          prefix = _ref[_i];
          _results.push(callback(prefix));
        }
        return _results;
      }
    };

    Prefixes.prototype.isCustom = function(prefix) {
      return this.browsers.prefixes().indexOf(prefix) === -1;
    };

    Prefixes.prototype.values = function(type, prop) {
      var data, global, values, _ref, _ref1;
      data = this[type];
      global = (_ref = data['*']) != null ? _ref.values : void 0;
      values = (_ref1 = data[prop]) != null ? _ref1.values : void 0;
      if (global && values) {
        return utils.uniq(global.concat(values));
      } else {
        return global || values || [];
      }
    };

    Prefixes.prototype.toRemove = function(prop) {
      var _ref;
      return (_ref = this.remove[prop]) != null ? _ref.remove : void 0;
    };

    return Prefixes;

  })();

  module.exports = Prefixes;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/processor.js", function(exports, require, module){
(function() {
  var Processor, utils;

  utils = require('./utils');

  Processor = (function() {
    function Processor(prefixes) {
      this.prefixes = prefixes;
    }

    Processor.prototype.add = function(css) {
      var selector, _i, _len, _ref,
        _this = this;
      css.eachKeyframes(function(keyframes) {
        if (keyframes.prefix) {
          return;
        }
        return _this.prefixes.each('@keyframes', function(prefix) {
          return keyframes.cloneWithPrefix(prefix);
        });
      });
      _ref = this.prefixes.add.selectors;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        selector = _ref[_i];
        css.eachRule(function(rule) {
          if (!rule.selectors) {
            return;
          }
          if (selector.check(rule.selectors)) {
            return rule.prefixSelector(selector);
          }
        });
      }
      css.eachDeclaration(function(decl, vendor) {
        if (_this.prefixes.isCustom(vendor)) {
          vendor = null;
        }
        return _this.prefixes.each(decl.prop, function(prefix) {
          if (vendor && vendor !== utils.removeNote(prefix)) {
            return;
          }
          if (decl.valueContain(_this.prefixes.other(prefix))) {
            return;
          }
          return decl.prefixProp(prefix);
        });
      });
      return css.eachDeclaration(function(decl, vendor) {
        var prefix, value, _j, _k, _len1, _len2, _ref1, _ref2;
        if (_this.prefixes.isCustom(vendor)) {
          vendor = null;
        }
        _ref1 = _this.prefixes.values('add', decl.unprefixed);
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          value = _ref1[_j];
          if (!value.check(decl.value)) {
            continue;
          }
          _ref2 = value.prefixes;
          for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
            prefix = _ref2[_k];
            if (vendor && vendor !== utils.removeNote(prefix)) {
              continue;
            }
            decl.prefixValue(prefix, value);
          }
        }
        return decl.saveValues();
      });
    };

    Processor.prototype.remove = function(css) {
      var selector, _i, _len, _ref,
        _this = this;
      css.eachKeyframes(function(keyframes) {
        if (_this.prefixes.toRemove(keyframes.prefix + '@keyframes')) {
          return keyframes.remove();
        }
      });
      _ref = this.prefixes.remove.selectors;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        selector = _ref[_i];
        css.eachRule(function(rule) {
          if (!rule.selectors) {
            return;
          }
          if (rule.selectors.indexOf(selector) !== -1) {
            return rule.remove();
          }
        });
      }
      return css.eachDeclaration(function(decl, vendor) {
        var checker, _j, _len1, _ref1;
        if (_this.prefixes.toRemove(decl.prop)) {
          if (decl.rule.byProp(decl.unprefixed)) {
            decl.remove();
            return;
          }
        }
        _ref1 = _this.prefixes.values('remove', decl.unprefixed);
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          checker = _ref1[_j];
          if (checker.check(decl.value)) {
            decl.remove();
            return;
          }
        }
      });
    };

    return Processor;

  })();

  module.exports = Processor;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/rule.js", function(exports, require, module){
(function() {
  var Declaration, Rule, utils;

  utils = require('./utils');

  Declaration = require('./declaration');

  Declaration.register(require('./hacks/filter'));

  Declaration.register(require('./hacks/border-radius'));

  Declaration.register(require('./hacks/flex'));

  Declaration.register(require('./hacks/order'));

  Declaration.register(require('./hacks/flex-grow'));

  Declaration.register(require('./hacks/flex-wrap'));

  Declaration.register(require('./hacks/flex-flow'));

  Declaration.register(require('./hacks/transition'));

  Declaration.register(require('./hacks/align-self'));

  Declaration.register(require('./hacks/flex-basis'));

  Declaration.register(require('./hacks/flex-shrink'));

  Declaration.register(require('./hacks/align-items'));

  Declaration.register(require('./hacks/border-image'));

  Declaration.register(require('./hacks/display-flex'));

  Declaration.register(require('./hacks/align-content'));

  Declaration.register(require('./hacks/flex-direction'));

  Declaration.register(require('./hacks/justify-content'));

  Rule = (function() {
    function Rule(rules, number, node, prefix) {
      this.rules = rules;
      this.number = number;
      this.node = node;
      this.prefix = prefix;
      this.type = this.node.type;
      this.declarations = this.node.declarations;
      if (this.type === 'rule') {
        this.selectors = this.node.selectors.join(', ');
      }
    }

    Rule.prototype.each = function(callback) {
      var decl, item;
      this.number = 0;
      while (this.number < this.declarations.length) {
        item = this.declarations[this.number];
        if (item.property) {
          decl = Declaration.load(this, this.number, item);
          callback(decl, decl.prefix || this.prefix);
        }
        this.number += 1;
      }
      return false;
    };

    Rule.prototype.prefixSelector = function(selector) {
      var clone, prefix, prefixed, _i, _len, _ref, _results;
      _ref = selector.prefixes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        prefix = _ref[_i];
        prefixed = selector.replace(this.selectors, prefix);
        if (!this.rules.contain(prefixed)) {
          clone = utils.clone(this.node, {
            selectors: prefixed.split(', ')
          });
          _results.push(this.rules.add(this.number, clone));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Rule.prototype.contain = function(prop, value) {
      if (value != null) {
        return this.declarations.some(function(i) {
          return i.property === prop && i.value === value;
        });
      } else {
        return this.declarations.some(function(i) {
          return i.property === prop;
        });
      }
    };

    Rule.prototype.byProp = function(prop) {
      var decl, i, node, _i, _len, _ref;
      _ref = this.declarations;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        node = _ref[i];
        if (node.property) {
          decl = Declaration.load(this, i, node);
          if (decl.prop === prop) {
            return decl;
          }
        }
      }
      return null;
    };

    Rule.prototype.remove = function() {
      return this.rules.remove(this.number);
    };

    Rule.prototype.add = function(position, decl) {
      this.declarations.splice(position, 0, decl);
      return this.number += 1;
    };

    Rule.prototype.removeDecl = function(position) {
      this.declarations.splice(position, 1);
      return this.number -= 1;
    };

    return Rule;

  })();

  module.exports = Rule;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/rules.js", function(exports, require, module){
(function() {
  var Rule, Rules;

  Rule = require('./rule');

  Rules = (function() {
    Rules.each = function(list, callback) {
      var rules;
      rules = new Rules(list);
      return rules.each(callback);
    };

    function Rules(list) {
      this.list = list;
    }

    Rules.prototype.each = function(callback) {
      var i, keyframe, rule, _i, _len, _ref;
      this.number = 0;
      while (this.number < this.list.length) {
        i = this.list[this.number];
        if (i.rules) {
          Rules.each(i.rules, callback);
        }
        if (i.keyframes) {
          _ref = i.keyframes;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            keyframe = _ref[_i];
            if (keyframe.type === 'keyframe') {
              rule = new Rule(this, this.number, keyframe, i.vendor);
              callback(rule);
            }
          }
        }
        if (i.declarations) {
          rule = new Rule(this, this.number, i, i.vendor);
          callback(rule);
        }
        this.number += 1;
      }
      return false;
    };

    Rules.prototype.contain = function(selector) {
      var i, _i, _len, _ref;
      _ref = this.list;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        if (!i.selectors) {
          continue;
        }
        if (i.selectors.join(', ') === selector) {
          return true;
        }
      }
      return false;
    };

    Rules.prototype.add = function(position, rule) {
      this.list.splice(position, 0, rule);
      return this.number += 1;
    };

    Rules.prototype.remove = function(position) {
      this.list.splice(position, 1);
      return this.number -= 1;
    };

    return Rules;

  })();

  module.exports = Rules;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/selector.js", function(exports, require, module){
(function() {
  var Selector, utils;

  utils = require('./utils');

  Selector = (function() {
    Selector.register = function(klass) {
      var name, _i, _len, _ref, _results;
      _ref = klass.names;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        _results.push(this.hacks[name] = klass);
      }
      return _results;
    };

    Selector.hacks = {};

    Selector.load = function(name, prefixes) {
      var klass;
      klass = this.hacks[name];
      if (klass) {
        return new klass(name, prefixes);
      } else {
        return new Selector(name, prefixes);
      }
    };

    function Selector(name, prefixes) {
      this.name = name;
      this.prefixes = prefixes != null ? prefixes : [];
      this.prefixes = this.prefixes.sort(function(a, b) {
        return a.length - b.length;
      });
    }

    Selector.prototype.check = function(selectors) {
      return selectors.indexOf(this.name) !== -1;
    };

    Selector.prototype.prefixed = function(prefix) {
      return this.name.replace(/^([^\w]*)/, '$1' + prefix);
    };

    Selector.prototype.regexp = function() {
      return this.regexpCache || (this.regexpCache = new RegExp(utils.escapeRegexp(this.name), 'gi'));
    };

    Selector.prototype.replace = function(selectors, prefix) {
      return selectors.replace(this.regexp(), this.prefixed(prefix));
    };

    return Selector;

  })();

  module.exports = Selector;

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/updater.js", function(exports, require, module){
(function() {
  var coffee, fs, https;

  coffee = require('coffee-script');

  https = require('https');

  fs = require('fs');

  module.exports = {
    browsers: {
      firefox: 'ff',
      chrome: 'chrome',
      safari: 'safari',
      ios_saf: 'ios',
      opera: 'opera',
      ie: 'ie',
      bb: 'bb',
      android: 'android'
    },
    run: function() {
      var i, updaters, _i, _len, _ref, _results;
      updaters = __dirname + '/../../updaters/';
      _ref = fs.readdirSync(updaters).sort();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        if (!i.match(/\.(coffee|js)$/)) {
          continue;
        }
        _results.push(require(updaters + i).apply(this));
      }
      return _results;
    },
    requests: 0,
    doneCallbacks: [],
    requestCallbacks: [],
    done: function(callback) {
      this.doneCallbacks || (this.doneCallbacks = []);
      return this.doneCallbacks.push(callback);
    },
    request: function(callback) {
      this.requestCallbacks || (this.requestCallbacks = []);
      return this.requestCallbacks.push(callback);
    },
    github: function(path, callback) {
      var _this = this;
      this.requests += 1;
      return https.get("https://raw.github.com/" + path, function(res) {
        var data;
        data = '';
        res.on('data', function(chunk) {
          return data += chunk;
        });
        return res.on('end', function() {
          var func, _i, _j, _len, _len1, _ref, _ref1, _results;
          callback(JSON.parse(data));
          _this.requests -= 1;
          _ref = _this.requestCallbacks;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            func = _ref[_i];
            func();
          }
          if (_this.requests === 0) {
            _ref1 = _this.doneCallbacks.reverse();
            _results = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              func = _ref1[_j];
              _results.push(func());
            }
            return _results;
          }
        });
      });
    },
    sort: function(browsers) {
      return browsers.sort(function(a, b) {
        a = a.split(' ');
        b = b.split(' ');
        if (a[0] > b[0]) {
          return 1;
        } else if (a[0] < b[0]) {
          return -1;
        } else {
          return parseFloat(a[1]) - parseFloat(b[1]);
        }
      });
    },
    parse: function(data) {
      var browser, interval, need, support, version, versions, _i, _len, _ref, _ref1;
      need = [];
      _ref = data.stats;
      for (browser in _ref) {
        versions = _ref[browser];
        for (interval in versions) {
          support = versions[interval];
          _ref1 = interval.split('-');
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            version = _ref1[_i];
            if (this.browsers[browser] && support.match(/\sx($|\s)/)) {
              version = version.replace(/\.0$/, '');
              need.push(this.browsers[browser] + ' ' + version);
            }
          }
        }
      }
      return this.sort(need);
    },
    feature: function(file, callback) {
      var url,
        _this = this;
      url = "Fyrd/caniuse/master/features-json/" + file + ".json";
      return this.github(url, function(data) {
        return callback(_this.parse(data));
      });
    },
    fork: function(fork, file, callback) {
      var branch, url, user, _ref,
        _this = this;
      _ref = fork.split('/'), user = _ref[0], branch = _ref[1];
      url = "" + user + "/caniuse/" + branch + "/features-json/" + file;
      return this.github(url, function(data) {
        return callback(_this.parse(data));
      });
    },
    all: function(callback) {
      var browsers, data, list, name, version, _i, _len, _ref;
      browsers = require('../../data/browsers');
      list = [];
      for (name in browsers) {
        data = browsers[name];
        _ref = data.versions;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          version = _ref[_i];
          list.push(name + ' ' + version);
        }
      }
      return callback(this.sort(list));
    },
    map: function(browsers, callback) {
      var browser, name, version, _i, _len, _ref, _results;
      _results = [];
      for (_i = 0, _len = browsers.length; _i < _len; _i++) {
        browser = browsers[_i];
        _ref = browser.split(' '), name = _ref[0], version = _ref[1];
        version = parseFloat(version);
        _results.push(callback(browser, name, version));
      }
      return _results;
    },
    stringify: function(obj, indent) {
      var key, local, processed, value,
        _this = this;
      if (indent == null) {
        indent = '';
      }
      if (obj instanceof Array) {
        local = indent + '  ';
        return ("[\n" + local) + obj.map(function(i) {
          return _this.stringify(i, local);
        }).join("\n" + local) + ("\n" + indent + "]");
      } else if (typeof obj === 'object') {
        local = indent + '  ';
        processed = [];
        for (key in obj) {
          value = obj[key];
          if (key.match(/'|-|@|:/)) {
            key = "\"" + key + "\"";
          }
          value = this.stringify(value, local);
          if (value[0] !== "\n") {
            value = ' ' + value;
          }
          processed.push(key + ':' + value);
        }
        return "\n" + local + processed.join("\n" + local) + "\n";
      } else {
        return JSON.stringify(obj);
      }
    },
    changed: [],
    save: function(name, json) {
      var content, file, key, sorted, _i, _len, _ref;
      sorted = {};
      _ref = Object.keys(json).sort();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        sorted[key] = json[key];
      }
      file = __dirname + ("/../../data/" + name);
      content = "# Don't edit this files, because it's autogenerated.\n" + "# See updaters/ dir for generator. Run bin/update to update." + "\n\n";
      content += "module.exports =" + this.stringify(sorted) + ";\n";
      if (fs.existsSync(file + '.js')) {
        file += '.js';
        content = coffee.compile(content);
      } else {
        file += '.coffee';
      }
      if (fs.readFileSync(file).toString() !== content) {
        this.changed.push(name);
        return fs.writeFileSync(file, content);
      }
    }
  };

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/utils.js", function(exports, require, module){
(function() {
  module.exports = {
    error: function(text) {
      var err;
      err = new Error(text);
      err.autoprefixer = true;
      throw err;
    },
    uniq: function(array) {
      var filtered, i, _i, _len;
      filtered = [];
      for (_i = 0, _len = array.length; _i < _len; _i++) {
        i = array[_i];
        if (filtered.indexOf(i) === -1) {
          filtered.push(i);
        }
      }
      return filtered;
    },
    clone: function(obj, changes) {
      var clone, key, value;
      if (changes == null) {
        changes = {};
      }
      clone = {};
      for (key in obj) {
        value = obj[key];
        if (!changes[key]) {
          clone[key] = value;
        }
      }
      for (key in changes) {
        value = changes[key];
        clone[key] = value;
      }
      return clone;
    },
    removeNote: function(string) {
      if (string.indexOf(' ') === -1) {
        return string;
      } else {
        return string.split(' ')[0];
      }
    },
    escapeRegexp: function(string) {
      return string.replace(/([.?*+\^\$\[\]\\(){}|\-])/g, "\\$1");
    },
    regexp: function(word, escape) {
      if (escape == null) {
        escape = true;
      }
      if (escape) {
        word = this.escapeRegexp(word);
      }
      return new RegExp('(^|\\s|,|\\()(' + word + '($|\\s|\\(|,))', 'gi');
    }
  };

}).call(this);

});
require.register("autoprefixer/lib/autoprefixer/value.js", function(exports, require, module){
(function() {
  var OldValue, Value, utils;

  utils = require('./utils');

  OldValue = require('./old-value');

  Value = (function() {
    Value.register = function(klass) {
      var name, _i, _len, _ref, _results;
      _ref = klass.names;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        _results.push(this.hacks[name] = klass);
      }
      return _results;
    };

    Value.hacks = {};

    Value.load = function(name, prefixes) {
      var klass;
      klass = this.hacks[name];
      if (klass) {
        return new klass(name, prefixes);
      } else {
        return new Value(name, prefixes);
      }
    };

    Value.regexps = {};

    Value.regexp = function(name) {
      var _base;
      return (_base = this.regexps)[name] || (_base[name] = utils.regexp(name));
    };

    function Value(name, prefixes) {
      this.name = name;
      this.prefixes = prefixes;
      this.regexp = Value.regexp(this.name);
    }

    Value.prototype.check = function(value) {
      if (value.indexOf(this.name) !== -1) {
        return !!value.match(this.regexp);
      } else {
        return false;
      }
    };

    Value.prototype.old = function(prefix) {
      return new OldValue(prefix + this.name);
    };

    Value.prototype.addPrefix = function(prefix, string) {
      return string.replace(this.regexp, '$1' + prefix + '$2');
    };

    return Value;

  })();

  module.exports = Value;

}).call(this);

});
require.register("autoprefixer/updaters/browsers.js", function(exports, require, module){
(function() {
  module.exports = function() {
    var minor,
      _this = this;
    minor = ['bb', 'android'];
    return this.github('Fyrd/caniuse/master/data.json', function(data) {
      var agent, browsers, caniuse, internal, intervals, normalize, _ref;
      normalize = function(array) {
        return array.reverse().filter(function(i) {
          return i;
        });
      };
      intervals = function(array) {
        var i, interval, result, splited, sub, _i, _len;
        result = [];
        for (_i = 0, _len = array.length; _i < _len; _i++) {
          interval = array[_i];
          splited = interval.split('-');
          sub = (function() {
            var _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = splited.length; _j < _len1; _j++) {
              i = splited[_j];
              _results.push([i, interval, splited.length]);
            }
            return _results;
          })();
          result = result.concat(sub);
        }
        return result;
      };
      agent = function(name) {
        var future, info, result, versions;
        info = data.agents[name];
        future = normalize(info.versions.slice(-2)).map(function(i) {
          return parseFloat(i);
        });
        versions = intervals(normalize(info.versions.slice(0, -2)));
        result = {
          prefix: "-" + info.prefix + "-"
        };
        if (minor.indexOf(name) !== -1) {
          result.minor = true;
        }
        if (future.length) {
          result.future = future;
        }
        result.versions = versions.map(function(i) {
          return parseFloat(i[0]);
        });
        result.popularity = versions.map(function(i) {
          return info.usage_global[i[1]] / i[2];
        });
        return result;
      };
      browsers = {};
      _ref = _this.browsers;
      for (caniuse in _ref) {
        internal = _ref[caniuse];
        browsers[internal] = agent(caniuse);
      }
      return _this.save('browsers', browsers);
    });
  };

}).call(this);

});
require.register("autoprefixer/updaters/prefixes.js", function(exports, require, module){
(function() {
  var __slice = [].slice;

  module.exports = function(updater) {
    var prefix, prefixes,
      _this = this;
    prefixes = {};
    prefix = function() {
      var data, name, names, _i, _j, _len, _results;
      names = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), data = arguments[_i++];
      _results = [];
      for (_j = 0, _len = names.length; _j < _len; _j++) {
        name = names[_j];
        _results.push(prefixes[name] = data);
      }
      return _results;
    };
    this.feature('border-radius', function(browsers) {
      return prefix('border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius', {
        mistakes: ['-ms-'],
        browsers: browsers,
        transition: true
      });
    });
    this.feature('css-boxshadow', function(browsers) {
      return prefix('box-shadow', {
        browsers: browsers,
        transition: true
      });
    });
    this.feature('css-animation', function(browsers) {
      return prefix('animation', 'animation-name', 'animation-duration', 'animation-delay', 'animation-direction', 'animation-fill-mode', 'animation-iteration-count', 'animation-play-state', 'animation-timing-function', '@keyframes', {
        browsers: browsers
      });
    });
    this.feature('css-transitions', function(browsers) {
      return prefix('transition', 'transition-property', 'transition-duration', 'transition-delay', 'transition-timing-function', {
        mistakes: ['-ms-'],
        browsers: browsers
      });
    });
    this.feature('transforms2d', function(browsers) {
      prefix('transform', 'transform-origin', 'perspective', 'perspective-origin', {
        browsers: browsers,
        transition: true
      });
      return prefix('transform-style', 'backface-visibility', {
        browsers: browsers
      });
    });
    this.feature('css-gradients', function(browsers) {
      browsers = _this.map(browsers, function(browser, name, version) {
        if (name === 'android' && version < 4) {
          return browser + ' old';
        } else {
          return browser;
        }
      });
      return prefix('linear-gradient', 'repeating-linear-gradient', 'radial-gradient', 'repeating-radial-gradient', {
        props: ['background', 'background-image', 'border-image'],
        mistakes: ['-ms-'],
        browsers: browsers
      });
    });
    this.feature('css3-boxsizing', function(browsers) {
      return prefix('box-sizing', {
        browsers: browsers
      });
    });
    this.feature('css-filters', function(browsers) {
      return prefix('filter', {
        browsers: browsers,
        transition: true
      });
    });
    this.feature('multicolumn', function(browsers) {
      prefix('columns', 'column-width', 'column-gap', 'column-rule', 'column-rule-color', 'column-rule-width', {
        browsers: browsers,
        transition: true
      });
      return prefix('column-count', 'column-rule-style', 'column-span', 'column-fill', 'break-before', 'break-after', 'break-inside', {
        browsers: browsers
      });
    });
    this.feature('user-select-none', function(browsers) {
      return prefix('user-select', {
        browsers: browsers
      });
    });
    this.feature('flexbox', function(browsers) {
      browsers = _this.map(browsers, function(browser, name, version) {
        if ((name === 'safari' || name === 'ios') && version < 7) {
          return browser + ' 2009';
        } else if (name === 'chrome' && version < 21) {
          return browser + ' 2009';
        } else {
          return browser;
        }
      });
      prefix('display-flex', {
        browsers: browsers
      });
      prefix('flex', 'flex-grow', 'flex-shrink', 'flex-basis', {
        transition: true,
        browsers: browsers
      });
      return prefix('flex-direction', 'flex-wrap', 'flex-flow', 'justify-content', 'order', 'align-items', 'align-self', 'align-content', {
        browsers: browsers
      });
    });
    this.feature('calc', function(browsers) {
      return prefix('calc', {
        props: ['*'],
        browsers: browsers
      });
    });
    this.feature('background-img-opts', function(browsers) {
      return prefix('background-clip', 'background-origin', 'background-size', {
        browsers: browsers
      });
    });
    this.feature('font-feature', function(browsers) {
      return prefix('font-feature-settings', 'font-variant-ligatures', 'font-language-override', 'font-kerning', {
        browsers: browsers
      });
    });
    this.feature('border-image', function(browsers) {
      return prefix('border-image', {
        browsers: browsers
      });
    });
    this.feature('css-selection', function(browsers) {
      return prefix('::selection', {
        selector: true,
        browsers: browsers
      });
    });
    this.feature('css-placeholder', function(browsers) {
      return prefix('::placeholder', {
        selector: true,
        browsers: browsers
      });
    });
    this.feature('css-hyphens', function(browsers) {
      return prefix('hyphens', {
        browsers: browsers
      });
    });
    this.feature('fullscreen', function(browsers) {
      return prefix(':fullscreen', {
        selector: true,
        browsers: browsers
      });
    });
    this.feature('css3-tabsize', function(browsers) {
      return prefix('tab-size', {
        browsers: browsers
      });
    });
    this.feature('intrinsic-width', function(browsers) {
      return prefix('max-content', 'min-content', 'fit-content', 'fill-available', {
        props: ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height'],
        browsers: browsers
      });
    });
    return this.done(function() {
      return _this.save('prefixes', prefixes);
    });
  };

}).call(this);

});


require.alias("visionmedia-css-parse/index.js", "autoprefixer/deps/css-parse/index.js");
require.alias("visionmedia-css-parse/index.js", "css-parse/index.js");

require.alias("visionmedia-css-stringify/index.js", "autoprefixer/deps/css-stringify/index.js");
require.alias("visionmedia-css-stringify/lib/compress.js", "autoprefixer/deps/css-stringify/lib/compress.js");
require.alias("visionmedia-css-stringify/lib/identity.js", "autoprefixer/deps/css-stringify/lib/identity.js");
require.alias("visionmedia-css-stringify/index.js", "css-stringify/index.js");

require.alias("autoprefixer/lib/autoprefixer.js", "autoprefixer/index.js");if (typeof exports == "object") {
  module.exports = require("autoprefixer");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("autoprefixer"); });
} else {
  this["autoprefixer"] = require("autoprefixer");
}})();
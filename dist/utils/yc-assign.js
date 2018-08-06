'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isPlainObject = require('lodash.isplainobject');
function assign() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var target = args.shift(),
      sourceObjs = args,
      len = sourceObjs.length,
      deep = args[args.length - 1],
      i = void 0,
      key = void 0,
      clone = void 0,
      source = void 0;
  if ((typeof target === 'undefined' ? 'undefined' : _typeof(target)) !== 'object') {
    throw new Error('the target is not Object');
  }
  if (deep === true || typeof deep === 'function') {
    --len;
    sourceObjs.pop();
  }
  for (i = 0; i < len; i++) {
    source = sourceObjs[i];
    for (key in source) {
      if ((deep === true || typeof deep === 'function' && deep(key, source[key])) && _typeof(source[key]) === 'object' && Object.prototype.toString.call(source[key]) !== '[object RegExp]' && source[key] !== null) {
        if (Array.isArray(source[key])) {
          clone = target[key] && Array.isArray(target[key]) ? target[key] : [];
        } else {
          clone = target[key] && isPlainObject(target[key]) ? target[key] : {};
        }
        target[key] = assign(clone, source[key], deep);
      } else if (source[key] !== undefined) {
        target[key] = source[key];
      }
    }
  }
  return target;
}
module.exports = assign;
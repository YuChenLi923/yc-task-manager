const isPlainObject = require('lodash.isplainobject');
function assign(...args) {
  let target = args.shift(),
      sourceObjs = args,
      len = sourceObjs.length,
      deep = args[args.length - 1],
      i,
      key,
      clone,
      source;
  if (typeof target !== 'object') {
    throw new Error('the target is not Object');
  }
  if (deep === true || typeof deep === 'function') {
    --len;
    sourceObjs.pop();
  }
  for (i = 0; i < len; i++) {
    source = sourceObjs[i];
    for (key in source) {
      if ((deep === true || (typeof deep === 'function' && deep(key, source[key]))) && typeof source[key] === 'object' &&
        Object.prototype.toString.call(source[key]) !== '[object RegExp]' && source[key] !== null) {
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

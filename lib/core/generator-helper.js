var co = require("co");
var self = module.exports;

/**
 * 检查是否是生成器函数
 **/
self.isGenerator = function(fn) {
  return typeof (fn) === 'function'
    && fn.constructor
    && fn.constructor.name === 'GeneratorFunction';
}

/**
 * 包装生成器函数
 **/
self.wrap = function(obj) {
  if (!obj || obj.__generator_converted) {
    return obj;
  }
  for (name in obj) {
    if (!self.isGenerator(obj[name])) {
      continue;
    }
    obj[name] = co.wrap(obj[name]);
  }
  obj.__generator_converted = true;
  return obj;
};
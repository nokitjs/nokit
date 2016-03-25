var co = require("co");
var thunkify = require("thunkify");
var utils = require("./utils");

var self = module.exports;

/**
 * 包装一个对象的所有生成器成员函数
 **/
self._wrapByMap = function(obj) {
  var self = this;
  //普通对象
  for (name in obj) {
    if (!self.isGenerator(obj[name])) {
      continue;
    }
    obj[name] = co.wrap(obj[name]);
  }
};

/**
 * 检查是否是生成器函数
 **/
self.isGenerator = function(fn) {
  return typeof (fn) === 'function'
    && fn.constructor
    && fn.constructor.name === 'GeneratorFunction';
};

/**
 * 包装生成器函数
 **/
self.wrap = function(obj) {
  if (!obj) return obj;
  //检查是否已包装过
  var objProto = obj.__proto__
  obj.__proto__ = {};
  if (obj.__generator_wrapped) {
    return obj;
  }
  obj.__generator_wrapped = true;
  obj.__proto__ = objProto;
  //如果 obj 就是一个生成器函数
  if (self.isGenerator(obj)) {
    return co.wrap(obj);
  }
  self._wrapByMap(obj);
  //如果是一个普通函数
  if (utils.isFunction(obj)) {
    self._wrapByMap(obj.prototype);
  };
  return obj;
};

/**
 * 转换为 thunk 函数
 **/
self.thunkify = function(fn, ctx) {
  var thunk = thunkify(fn);
  if (ctx) {
    thunk = thunk.bind(ctx);
  }
  return thunk;
};

/**
 * 休眠函数，仅用于测试
 **/
self.sleep = function(delay) {
  return function(callback) {
    setTimeout(function() {
      callback(null, delay);
    }, delay);
  }
};
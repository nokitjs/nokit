var utils = require("real-utils");
var fs = require('fs');
var path = require('path');

var owner = module.exports = utils;

/**
 * 同步读取 JSON
 **/
owner.readJSONSync = function(jsonFile, useRequire) {
  if (fs.existsSync(jsonFile)) {
    var jsonText = useRequire ?
      JSON.stringify(require(jsonFile)) :
      fs.readFileSync(jsonFile);
    if (utils.isNull(jsonText)) {
      return null
    }
    return JSON.parse(jsonText.toString());
  } else {
    return null;
  }
};

/**
 * 同步写入 JSON
 **/
owner.writeJSONSync = function(jsonFile, data) {
  var jsonText = JSON.stringify(data || {});
  fs.writeFileSync(jsonFile, jsonText, null);
};

/**
 * 拷贝一个目录
 */
owner.copyDir = function(src, dst) {
  var self = this;
  if (fs.existsSync(src)) {
    if (!fs.existsSync(dst)) {
      fs.mkdirSync(dst);
    }
    var files = fs.readdirSync(src);
    files.forEach(function(file, index) {
      var subSrc = src + "/" + file;
      var subDst = dst + "/" + file;
      if (fs.statSync(subSrc).isDirectory()) {
        self.copyDir(subSrc, subDst);
      } else {
        var buffer = fs.readFileSync(subSrc);
        fs.writeFileSync(subDst, buffer);
      }
    });
  }
};

/**
 * 正规化 url
 */
owner.normalizeUrl = function(url) {
  if (!url) return url;
  url = path.normalize(url);
  while (url.indexOf('\\') > -1 || url.indexOf('//') > -1) {
    url = url.replace('\\', '/').replace('//', '/');
  }
  return url;
};

/**
 * Helper function for creating a getter on an object.
 *
 * @param {Object} obj
 * @param {String} name
 * @param {Function} getter
 * @private
 */
owner.defineGetter = function(obj, name, getter) {
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: true,
    get: getter
  });
};

/**
 * 定义释放器
 **/
owner.defineDisposer = function(props) {
  return function() {
    var self = this;
    if (self.__disposed || !props) return;
    self.__disposed = true;
    props.forEach(function(prop) {
      if (self[prop] && self[prop].dispose) {
        self[prop].dispose();
      }
      self[prop] = null;
    });
    props = null;
    self.dispose = null;
  };
};

/**
 * 定义只能调用一次的 function
 **/
owner.defineOnceFunc = function(obj, name, func) {
  if (!obj || !name || !func) return;
  var mark = '__' + name + '__called__';
  obj[name] = function() {
    if (obj[mark]) return;
    obj[mark] = true;
    return func.apply(obj, arguments);
  };
};

/**
 * 不做任何操作
 **/
owner.noop = function() { };

/**
 * 检查执行一个 promise
 **/
owner.checkPromise = function(promise, onReject, onResolve) {
  var self = this;
  if (!promise || !promise.catch || !promise.then) {
    return;
  }
  return promise.then(onResolve).catch(onReject);
};
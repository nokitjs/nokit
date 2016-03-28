var path = require("path");
var fs = require("fs");
var qs = require("querystring");
var url = require("url");
var zlib = require("zlib");
var Stream = require('stream');
var BufferStream = require('bufstream');
var Cookie = require("./cookie");
var utils = require('./utils');
var Session = require("./session");
var Request = require("./request");
var Response = require("./response");

/**
 * http 请求上下文对象
 */
var Context = function(server, req, res) {
  var self = this;
  //基本成员
  self.beginTime = Date.now();
  self.ignoreHandlers = [];
  self.ignoreUrls = [];
  self.server = server;
  self.configs = server.configs;
  self.configs.cache = self.configs.cache || {};
  self.configs.compress = self.configs.compress || [];
  self.shouldCompress = false;
  self.shouldCache = false;
  self.request = self.req = req;
  self.response = self.res = res;
  //对象初始化
  self.init();
  self.logger = self.server.logger;
  self.cookie = new Cookie(self);
  self.locale = self.server.localeMgr.getByContext(self) || {};
  self.session = new Session(self);
  //bind 
  self.error = self.error.bind(self);
  self.send = self.send.bind(self);
};

/**
 * 初始化
 **/
Context.prototype.init = function() {
  var self = this;
  Request.init(self);
  Response.init(self);
};

/**
 * 释放资源
 **/
Context.prototype.dispose = utils.defineDisposer([
  "request",
  "req",
  "response",
  "res",
  "cookie",
  "session"
]);

/**
 * 设定 locale
 **/
Context.prototype.setLocale = function(localeName) {
  var self = this;
  self.locale = self.server.localeMgr.get(localeName) || {};
};

/**
 * 检查资源是否可缓存
 **/
Context.prototype._checkCache = function(type) {
  var self = this;
  if (!self.configs.cache.enabled || !self.shouldCache) {
    return false;
  }
  var url = self.request.withoutQueryStringURL;
  var checkVal = false;
  utils.each(self.configs.cache.match, function(expr, status) {
    if (new RegExp(expr).test(url)) {
      checkVal = status;
    }
  });
  return checkVal;
};

/**
 * 检查资源是否可压缩
 **/
Context.prototype._checkCompress = function() {
  var self = this;
  if (!self.configs.compress.enabled || !self.shouldCompress) {
    return false;
  }
  var checkVal = false;
  utils.each(self.configs.compress.type, function(mimeType, status) {
    if (mimeType == self.response.mime) {
      checkVal = status;
    }
  });
  return checkVal;
};

/**
 * 设定 ContentType
 **/
Context.prototype.contentType = function(mime) {
  var self = this;
  if (mime) {
    self.response.getHeader('Content-Type', mime);
  } else {
    return self.response.getHeader('Content-Type') || self.request.mime;
  }
};

/**
 * 向浏览器输出流
 **/
Context.prototype.stream = function(contentStream, mime, statusCode, headers) {
  var self = this;
  if (self.isEnd) return;
  self.response.mime = mime || self.response.getHeader('Content-Type') || self.request.mime;
  self.response.contentStream = contentStream;
  self.response.statusCode = statusCode || self.response.statusCode || 200;
  self.filterInvoker.invoke('onResponse', self, function(err) {
    if (err) {
      return self.error(err);
    }
    //处理客户端缓存开始
    var maxAge = self.configs.cache.maxAge;
    if (maxAge && maxAge > 0 && self._checkCache()) {
      var expires = new Date();
      expires.setTime(expires.getTime() + maxAge * 1000);
      self.response.setHeader("Expires", expires.toUTCString());
      self.response.setHeader("Cache-Control", "max-age=" + maxAge);
    }
    //处理客户端缓存结束
    headers = headers || {};
    headers["Content-Type"] = self.response.mime;
    var responseStream = self.response.contentStream;
    //处理压缩开始
    if (self.response.contentStream !== null &&
      self.response.contentStream !== undefined &&
      self._checkCompress()) {
      var acceptEncoding = self.request.headers['accept-encoding'] || "";
      var gzip = (acceptEncoding.match(/\bgzip\b/) || [])[0];
      var deflate = (acceptEncoding.match(/\bdeflate\b/) || [])[0];
      if (gzip) {
        headers['Content-Encoding'] = gzip;
        responseStream = self.response.contentStream.pipe(zlib.createGzip());
      } else if (deflate) {
        headers['Content-Encoding'] = deflate;
        responseStream = self.response.contentStream.pipe(zlib.createDeflate());
      }
    }
    //处理压缩结束
    self.response.writeHead(self.response.statusCode, headers);
    if (responseStream !== null &&
      responseStream !== undefined) {
      self.response.writeStream(responseStream);
    } else {
      self.response.end();
    }
  });
};

/**
 * 向浏览器发送 Buffer
 **/
Context.prototype.buffer = function(buffer, mime, statusCode, headers) {
  var self = this;
  self.stream(new BufferStream(buffer), mime, statusCode, headers);
};

/**
 * 向浏览器输出文本
 **/
Context.prototype.text = function(text, mime, statusCode, headers) {
  var self = this;
  if (text === null) {
    return self.stream(text, mime, statusCode, headers);
  }
  //强制转换为 string
  text = String(text);
  //转换为流
  var contentStream = new Stream.Readable();
  contentStream.push(text);
  contentStream.push(null);
  self.stream(contentStream, mime, statusCode, headers);
};

/**
 * 向浏览器输出一个文件
 **/
Context.prototype.file = function(filePath, mime, statusCode, headers) {
  var self = this;
  var fileReadStream = fs.createReadStream(filePath);
  self.stream(fileReadStream, null, null, headers);
};

/**
 * 向浏览器输出文本或流
 **/
Context.prototype.send = Context.prototype.write = function(content, mime, statusCode, headers) {
  var self = this;
  var isStream = content instanceof Stream.Readable;
  if (isStream || utils.isNull(content)) {
    self.stream(content, mime, statusCode, headers);
  } else if (utils.isString(content) ||
    utils.isNumber(content) ||
    utils.isBoolean(content)) {
    self.text(content, mime, statusCode, headers);
  } else if (Buffer.isBuffer(content)) {
    self.buffer(content, mime, statusCode, headers);
  } else {
    self.json(content, mime, statusCode, headers);
  }
};

/**
 * 向浏览器发送的 json 字符串
 **/
Context.prototype.json = function(jsonObject) {
  var self = this;
  var jsonText = null;
  try {
    jsonText = JSON.stringify(jsonObject);
  } catch (err) {
    return self.error(err);
  }
  self.text(jsonText, self.server.mime('.json'));
};

/**
 * 向浏览器发送 jsonp
 **/
Context.prototype.jsonp = function(jsonObject) {
  var self = this;
  var jsonText = null;
  try {
    jsonText = JSON.stringify(jsonObject);
  } catch (err) {
    return self.error(err);
  }
  var jsonpCallback = self.param(self.configs.jsonpParam);
  if (jsonpCallback) {
    self.text("/**/" + jsonpCallback + "(" + jsonText + ")", self.server.mime('.js'));
  } else {
    self.error('jsonp need "' + self.configs.jsonpParam + '" parameter');
  }
};

/**
 * 查询参数
 **/
utils.defineGetter(Context.prototype, "query", function() {
  var self = this;
  if (!self.request) return {};
  return self.request.query || {};
});

/**
 * form 数据
 **/
utils.defineGetter(Context.prototype, "form", function() {
  var self = this;
  if (!self.request) return {};
  return self.request.body || self.request.form || {};
});

/**
 * 上传文件
 **/
utils.defineGetter(Context.prototype, "files", function() {
  var self = this;
  if (!self.request) return {};
  return self.request.files || {};
});

/**
 * 路由参数
 **/
utils.defineGetter(Context.prototype, "params", function() {
  var self = this;
  if (!self.route) return {};
  return self.route.params || {};
});

/**
 * 获取参数 route>query>form>files
 **/
Context.prototype.data = Context.prototype.param = function(name, defaultValue) {
  var self = this;
  return self.params[name] ||
    self.query[name] ||
    self.form[name] ||
    self.files[name] ||
    defaultValue;
};

/**
 * 向浏览器输出一个模板
 **/
Context.prototype.template = function(template, model, mime, statusCode, headers) {
  var self = this;
  var templateFunc = utils.isFunction(template) ? template :
    self.server.templatePage(template);
  var contentBuffer = templateFunc ? templateFunc(model) : null;
  self.shouldCompress = self.configs.template.compress;
  self.text(contentBuffer, mime, statusCode, headers);
};

/**
 * 向浏览器响应一个状态（并根据模板输入内容）
 **/
Context.prototype.statusWithContent = function(statusCode, options, headers) {
  var self = this;
  options = options || {};
  if (utils.isString(options)) {
    options = {
      "template": options
    };
  }
  var mime = self.server.mime('.html');
  var template = options.template ?
    (utils.isFunction(options.template) ? options.template : self.server.viewEngine.compileText(options.template)) :
    statusCode;
  var model = options.model || {};
  model.context = self;
  model.server = self.server;
  model.request = self.request;
  model.response = self.response;
  self.template(template, model, mime, statusCode, headers);
};

/**
 * 向浏览器响应一个状态
 **/
Context.prototype.status = function(statusCode, headers) {
  var self = this;
  self.stream(null, null, statusCode, headers);
};

/**
 * 向浏览器输出一个错误
 **/
Context.prototype.error = function(err, template) {
  var self = this;
  err = err || new Error('Unknown server error');
  if (!(err instanceof Error)) {
    err = new Error(err);
  }
  self.shouldCache = false;
  self.logger.error(err);
  self.lastError = err;
  self.filterInvoker.invoke('onError', self, function(err) {
    self.statusWithContent(500, {
      "template": template,
      "model": {
        "lastError": (self.lastError || err || {}),
        "showErrorDetail": self.configs.showErrorDetail
      }
    });
  });
};

/**
 * 响应 404
 **/
Context.prototype.notFound = function(template, model) {
  var self = this;
  self.statusWithContent(404, {
    "template": template,
    "model": model
  });
};

/**
 * 响应 403
 **/
Context.prototype.forbidden = function(template, model) {
  var self = this;
  self.statusWithContent(403, {
    "template": template,
    "model": model
  });
};

/**
 * 响应 405
 **/
Context.prototype.notAllowed = function(template, model) {
  var self = this;
  self.statusWithContent(405, {
    "template": template,
    "model": model
  });
};

/**
 * 302 重定向
 **/
Context.prototype.redirect = function(_toUrl) {
  var self = this;
  //处理相对路径
  var toUrl = url.resolve(self.request.url, _toUrl);
  self.status(302, {
    'Location': toUrl
  });
};

/**
 * 301 重定向
 **/
Context.prototype.permanentRedirect = function(_toUrl) {
  var self = this;
  //处理相对路径
  var toUrl = url.resolve(self.request.url, _toUrl);
  self.status(301, {
    'Location': toUrl
  });
};

/**
 * URL 重写
 **/
Context.prototype.transfer = function(_toUrl) {
  var self = this;
  //处理相对路径
  var toUrl = url.resolve(self.request.url, _toUrl);
  //检查循环
  if (utils.contains(self.ignoreUrls, toUrl)) {
    return self.error('Rewritten to "' + toUrl + '" found circulating');
  }
  self.ignoreUrls.push(toUrl);
  self.request.setUrl(toUrl);
  self.ignoreHandlers = [];
  //下划线开头的方法，为私有方法，不要随意调用
  //这里只能这个方法达到 ignoreHandlers 为空的目的
  //以使新的 url 能有机会被相应的 handler 接收到
  self.server._matchHandlerAndHandleRequest(self);
};

/**
 * 响应 304
 **/
Context.prototype.noChange = function() {
  var self = this;
  self.status(304);
};

/**
 * 响应 promise
 **/
Context.prototype.promise = function(promise, onResolve, onReject) {
  var self = this;
  if (!promise || !promise.catch || !promise.then) {
    return self.error('context.promise require a promise parameter');
  }
  onReject = onReject || self.error;
  onResolve = onResolve || self.send;
  return promise.then(onResolve).catch(onReject);
};

/**
 * 响应一个 thunk
 **/
Context.prototype.thunk = function(thunk, callback) {
  var self = this;
  if (!utils.isFunction(thunk)) {
    return self.error('context.thunk require a thunk function');
  }
  callback = callback || function(err, result) {
    if (err) return self.error(err);
    self.send(result);
  };
  thunk(callback);
};

module.exports = Context;
/*end*/
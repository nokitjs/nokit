/* global process */
const http = require('http');
const https = require('https');
const fs = require('fs');
const util = require("util");
const events = require("events");
const cluster = require("cluster");
const path = require('path');
const console = require("./console");
const utils = require("./utils");
const pkg = require("../../package.json");
const env = require("./env");
const Context = require("./context");
const domain = require('domain');
const FilterInvoker = require('./filter-invoker');
const Logger = require("./logger");
const LocaleMgr = require("./locale-mgr");
const exitCode = require("./exit-code");
const generator = require("./generator");
const Confman = require("confman").Parser;

//------------------------------------------------------------------

const SYSTEM_CONFIG_NAME = 'system';
const APP_CONFIG_NAME = 'config';
const DEFAULT_HANDLER_NAME = "static";
const MODULE_DEFAULT_EXTENSION = '.js';
const UNCAUGHT_EXCEPTION_EXIT_DELAY = 5000;

//------------------------------------------------------------------

/**
 * 定义 Server 类
 **/
const Server = function (options) {
  var self = this;
  events.EventEmitter.call(self);
  self.STATUS_CODES = http.STATUS_CODES;
  self.options = options || {};
  self.pkg = pkg;
  self.env = env;
  self.installPath = env.INSTALL_PATH;
  self.utils = utils;
  self._init(options);
};

/**
 * 继承 EventEmitter
 **/
util.inherits(Server, events.EventEmitter);

//------------------------------------------------------------------

/**
 * 初始化
 **/
Server.prototype._init = function (options) {
  var self = this;
  self.options.root = self.options.root || './';
  if (!fs.existsSync(self.options.root)) {
    throw new Error("Error in creating Server instance, because you must specify an existing root directory");
  }
  self._bindFunc();
  self._initConfigs();
  self._initLogger();
  self._loadPlugins();
  self._initSessionStore();
  self._initGlobal();
  self._loadViewEngine();
  self._loadLocaleMgr();
  self._loadRouter();
  self._loadParsers();
  self._loadFilters();
  self._loadHandlers();
  self._loadTemplatePages();
  self._createServer();
};

/**
 * 绑定 server 的一些函数
 **/
Server.prototype._bindFunc = function () {
  var self = this;
  self._processExitHandler = self._processExitHandler.bind(self);
  self._processExceptionHandler = self._processExceptionHandler.bind(self);
};

/**
 * 进程异常处理函数
 **/
Server.prototype._processExceptionHandler = function (err) {
  var self = this;
  self.lastError = err;
  //添加不再 keep alive 的标记
  //在异常发生后进程退出前，所有进来的请求，不再 keep alive
  self._doNotKeepAlive = true;
  //记录日志
  self.logger.error(self.lastError);
  //在 console 输出错误
  console.error(self.lastError);
  //当前工作进程停止接收新请求
  if (self.httpServer && self.httpServer.started) {
    self.httpServer.close();
  }
  //关闭和 master 的 ipc 通讯，以通知 master fork 新的工作进程
  if (cluster.isWorker) {
    process._channel.close();
    //cluster.worker.disconnect();
  }
  //发生未处理的异常时，直接结束进程，否则 nodejs 进程将可能出现内存无法释放的问题
  //延时以使已经接受的请求尽可能的处理完成，然后结束当前工作进程
  setTimeout(function () {
    process.exit(exitCode.WORKER_SERVER_ERR);
  }, UNCAUGHT_EXCEPTION_EXIT_DELAY);
};

/**
 * 进程退出处理函数
 **/
Server.prototype._processExitHandler = function (code) {
  var self = this;
  var exitInfo = "exit " + code + " #" + process.pid;
  //记录日志
  if (self.lastError) {
    self.lastError.message = self.lastError.message || self.lastError || "unknow";
    self.lastError.message = self.lastError.message + " , " + exitInfo;
    self.logger.error(self.lastError, { sync: true });
  } else {
    self.logger.info(exitInfo, { sync: true });
  }
};

/**
 * 开始处理未知错误
 **/
Server.prototype._startWatchProcessException = function () {
  var self = this;
  if (self.configs.doNotWatchProcessException) {
    return;
  }
  //清除所有 uncaughtException 事件的监听
  self._stopWatchProcessException();
  //process.setMaxListeners(0);
  //on error
  process.on("exit", self._processExitHandler);
  //on uncaughtException
  process.on("uncaughtException", self._processExceptionHandler);
  return self;
};

/**
 * 停止处理未知错误
 **/
Server.prototype._stopWatchProcessException = function () {
  var self = this;
  if (self.configs.doNotWatchProcessException) {
    return;
  }
  process.removeListener("uncaughtException", self._processExceptionHandler);
  process.removeListener("exit", self._processExitHandler);
  return self;
};

/**
 * 读取并合并配置
 **/
Server.prototype._initConfigs = function (callback) {
  var self = this;
  //实例配置加载器
  self.confman = new Confman({
    env: self.options.env || process.env.NODE_ENV || ""
  });
  //公共配置
  var systemConfigFile = path.resolve(self.installPath, SYSTEM_CONFIG_NAME);
  //应用配置，confman 会自动处理「环境配置」
  var appConfigFile = path.resolve(self.options.root, self.options.config || APP_CONFIG_NAME);
  //合并所有配置
  self.configs = self.confman.load([systemConfigFile, appConfigFile]);
  self.configs = utils.mix(self.configs, self.options);
  if (callback) callback();
};

//------------------------------------------------------------------
/**
 * 添加或设置一个插件
 **/
Server.prototype.plugin = function (name, plugin) {
  var self = this;
  self.plugins = self.plugins || {};
  if (utils.isNull(plugin)) {
    return self.plugins[name]
  }
  if (plugin.init &&
    utils.isFunction(plugin.init)) {
    plugin.init(self);
  }
  self.plugins[name] = plugin;
};

/**
 * 加载所有 server 插件
 **/
Server.prototype._loadPlugins = function () {
  var self = this;
  utils.each(self.configs.plugins, function (name, pluginPath) {
    if (!pluginPath) {
      return;
    }
    var Plugin = self.require(pluginPath);
    if (utils.isFunction(Plugin)) {
      self.plugin(name, new Plugin(self));
    } else {
      throw 'Plugin "' + name + '" there is something error';
    }
  });
};

//------------------------------------------------------------------

/**
 * 解析 filter、handler 需要配置的 “表达式”
 **/
Server.prototype._parseExpr = function (exprStr) {
  exprStr = exprStr || "";
  var exprParts = exprStr.split(" ");
  var expr = {};
  expr.str = exprStr;
  if (exprParts.length > 1) {
    expr.methods = exprParts[0].split(',').map(function (method) {
      return method.toUpperCase();
    });
  } else {
    exprParts[1] = exprParts[0];
  }
  exprParts = exprParts[1].split("@");
  expr.pattern = exprParts[0];
  expr.name = exprParts[1];
  return expr;
};

/**
 * 检查 url 匹配表达式
 **/
Server.prototype._checkPattern = function (pattern) {
  //不合法的 name 直接忽略
  return pattern !== null &&
    pattern !== undefined &&
    pattern != '*' &&
    pattern != '.';
};

//------------------------------------------------------------------

/**
 * 加载 Router 模块
 **/
Server.prototype._loadRouter = function () {
  var self = this;
  var routerPath = self.resolvePath(self.configs.router);
  var Router = require(routerPath);
  self.Router = Router;
};

//------------------------------------------------------------------

/**
 * 加载 ViewEngine 模块
 **/
Server.prototype._loadViewEngine = function () {
  var self = this;
  var viewEnginePath = self.resolvePath(self.configs.viewEngine.provider);
  var ViewEngine = require(viewEnginePath);
  self.viewEngine = new ViewEngine(self);
};

//------------------------------------------------------------------

/**
 * 加载本地化资源
 **/
Server.prototype._loadLocaleMgr = function () {
  var self = this;
  self.localeMgr = new LocaleMgr(self);
  self.localeMgr.load();
};

//------------------------------------------------------------------

/**
 * 配置解析器
 **/
Server.prototype.parser = function (contentType, parser) {
  var self = this;
  self._parsers = self._parsers || {};
  if (parser) {
    generator.wrap(parser);
    parser.contentType = contentType;
    self._parsers[contentType] = parser;
  } else {
    return self._parsers[contentType];
  }
};

/**
 * 加载系统内置解析器(通过 system.json)
 **/
Server.prototype._loadParsers = function () {
  var self = this;
  utils.each(self.configs.parsers, function (contentType, parserPath) {
    if (!parserPath) {
      return;
    }
    var Parser = self.require(parserPath);
    if (utils.isFunction(Parser)) {
      self.parser(contentType, new Parser(self));
    } else {
      throw new Error('Parser "' + parserPath + '" there is something error');
    }
  });
};

/**
 * 查找匹配的 parser
 **/
Server.prototype._matchParser = function (context) {
  var self = this;
  var contentType = context.request.headers['content-type'] || '';
  var contentTypeParts = contentType.split(';');
  var parser = utils.each(self._parsers, function (_contentType, _parser) {
    if (utils.contains(contentTypeParts, _contentType)) {
      return _parser;
    }
  });
  return parser || self.parser("*");
};

//------------------------------------------------------------------

/**
 * 配置 Filter
 **/
Server.prototype.filter = function (exprStr, filter) {
  var self = this;
  self._filters = self._filters || {};
  var expr = self._parseExpr(exprStr);
  if (filter) {
    generator.wrap(filter);
    filter.expr = expr;
    self._filters[expr.str] = filter;
  } else {
    return self._filters[expr.str];
  }
};

/**
 * 通过 name 获取 Filter
 **/
Server.prototype.getFilterByName = function (name) {
  var self = this;
  var filter = utils.each(self._filters, function (exprStr, _filter) {
    if (name === _filter.expr.name) {
      return _filter;
    }
  });
  return filter;
};

/**
 * 加载所有已配置的 filter
 **/
Server.prototype._loadFilters = function () {
  var self = this;
  utils.each(self.configs.filters, function (exprStr, filterPath) {
    if (!filterPath) {
      return;
    }
    var Filter = self.require(filterPath);
    if (utils.isFunction(Filter)) {
      self.filter(exprStr, new Filter(self));
    } else {
      throw new Error('Filter "' + filterPath + '" there is something error');
    }
  });
};

/**
 * 匹配可用的 filter
 **/
Server.prototype._matchFilters = function (context) {
  var self = this;
  var usedFilters = [self.global];
  utils.each(self._filters, function (exprStr, filter) {
    var pattern = filter.expr.pattern;
    //不合法的 name 直接忽略
    if (!self._checkPattern(pattern)) {
      return;
    }
    //检查 verbs
    if (filter.expr.methods &&
      filter.expr.methods.length > 0 &&
      filter.expr.methods.indexOf(context.request.method) < 0) {
      return;
    }
    //检查 pattern
    var exp = new RegExp(pattern);
    if (exp.test(context.request.withoutQueryStringURL)) {
      usedFilters.push(filter);
    }
  });
  return usedFilters;
};

//------------------------------------------------------------------

/**
 * 配置 Handler 
 **/
Server.prototype.handler = function (exprStr, handler) {
  var self = this;
  self._handlers = self._handlers || {};
  var expr = self._parseExpr(exprStr);
  if (handler) {
    generator.wrap(handler);
    handler.expr = expr;
    // handler 的 next 会排除自身
    handler.next = function (context) {
      context.ignoreHandlers.push(this);
      return self._matchHandlerAndHandleRequest(context);
    };
    self._handlers[expr.str] = handler;
  } else {
    return self._handlers[expr.str];
  }
};

/**
 * 通过 name 获取 handler
 **/
Server.prototype.getHandlerByName = function (name) {
  var self = this;
  var handler = utils.each(self._handlers, function (exprStr, _handler) {
    if (name === _handler.expr.name) {
      return _handler;
    }
  });
  return handler;
};

/**
 * 加载所有已配置的 handler
 **/
Server.prototype._loadHandlers = function () {
  var self = this;
  utils.each(self.configs.handlers, function (exprStr, handlerPath) {
    if (!handlerPath) {
      return;
    }
    var Handler = self.require(handlerPath);
    if (utils.isFunction(Handler)) {
      self.handler(exprStr, new Handler(self));
    } else {
      throw new Error('Handler "' + handlerPath + '" there is something error');
    }
  });
};

/**
 * 匹配可用的 handler
 **/
Server.prototype._matchHandler = function (context) {
  var self = this;
  var handler = utils.each(self._handlers, function (exprStr, _handler) {
    var pattern = _handler.expr.pattern;
    //不合法的 name 直接忽略
    if (!self._checkPattern(pattern)) {
      return;
    }
    //检查 verbs
    if (_handler.expr.methods &&
      _handler.expr.methods.length > 0 &&
      _handler.expr.methods.indexOf(context.request.method) < 0) {
      return;
    }
    //检查 pattern
    var exp = new RegExp(pattern);
    if (!utils.contains(context.ignoreHandlers, _handler) &&
      exp.test(context.request.withoutQueryStringURL)) {
      return _handler;
    }
  });
  handler = handler || self.getHandlerByName(DEFAULT_HANDLER_NAME);
  return handler;
};

/**
 * 找到匹配的请求并处理
 **/
Server.prototype._matchHandlerAndHandleRequest = function (context) {
  var self = this;
  context.handler = self._matchHandler(context);
  var ps = context.handler.handle(context);
  utils.checkPromise(ps, context.error);
};

//------------------------------------------------------------------

/**
 * 加载模板
 **/
Server.prototype._loadTemplatePages = function () {
  var self = this;
  utils.each(self.configs.template.pages, function (name, path) {
    self.templatePage(name, path);
  });
};

/**
 * 配置模板页
 **/
Server.prototype.templatePage = function (name, tmplPath) {
  var self = this;
  self._templatePages = self._templatePages || {};
  if (tmplPath) {
    tmplPath = self.resolvePath(tmplPath);
    self._templatePages[name] = self.viewEngine.compileFile(tmplPath);
  } else {
    return self._templatePages[name];
  }
};

//------------------------------------------------------------------

/**
 * 检查是否为未绑定的主机头
 **/
Server.prototype._isBoundHost = function (context) {
  var self = this;
  var req = context.request;
  var checkVal = false;
  //检查是否是绑定的域名或IP（host）
  var hosts = self.configs.hosts;
  //如果没有明确绑定，则认为全部允许
  if (!hosts || hosts.length < 1) {
    return checkVal;
  }
  utils.each(hosts, function (hostExpr, status) {
    if (hostExpr == "*" ||
      hostExpr == "0.0.0.0" ||
      new RegExp(hostExpr).test(req.clientInfo.host)) {
      checkVal = status;
    }
  });
  return checkVal;
};

/**
 * 检查是否是拒绝访问的资源
 **/
Server.prototype._isForbidden = function (context) {
  var self = this;
  var checkVal = false;
  var req = context.request;
  //检查是否是禁止访问的资源
  var url = req.withoutQueryStringURL;
  utils.each(self.configs.forbiddens, function (expr, status) {
    if (RegExp(expr).test(url)) {
      checkVal = status;
    }
  });
  return checkVal;
};

/**
 * 处理请求
 **/
Server.prototype._handleRequest = function (context) {
  var self = this;
  //设置 server 头信息
  self._setHeaders(context);
  //找到可用的 filter
  context.filters = self._matchFilters(context);
  context.filterInvoker = new FilterInvoker(context.filters, context.error);
  //检查是否为允许的 “主机头”
  if (!self._isBoundHost(context)) {
    return context.forbidden('Refused to use " ' + context.request.clientInfo.host + '" visit');
  }
  //检查是否禁止访问
  if (self._isForbidden(context)) {
    return context.forbidden();
  }
  //执行 filter 事件
  context.filterInvoker.invoke('onRequest', context, function (err) {
    if (err) {
      return context.error(err);
    }
    //查找内容解析器
    context.parser = self._matchParser(context);
    if (!context.parser) {
      return context.error('Content parser is not found');
    }
    //解析内容
    var ps = context.parser.parse(context, function (err) {
      if (err) {
        return context.error(err);
      }
      context.filterInvoker.invoke('onReceived', context, function (err) {
        if (err) {
          return context.error(err);
        }
        self._matchHandlerAndHandleRequest(context);
      });
    });
    utils.checkPromise(ps, context.error);
  });
};

//------------------------------------------------------------------

/**
 * 初始化日志提供程序
 **/
Server.prototype._initLogger = function (callback) {
  var self = this;
  var logConfigs = self.configs.log || {};
  if (!logConfigs.enabled) {
    self.logger = console;
    return;
  }
  var LogWriter = self.require(logConfigs.provider);
  self.logWriter = new LogWriter(self);
  generator.wrap(self.logWriter);
  if (self.logWriter.init) {
    self.logWriter.init(self, callback);
    //全局日志对象
    self.logger = new Logger(self.logWriter);
  } else {
    throw new Error('Log Writer not found "init" method');
  }
};

/**
 * 初始化 session 提供程序
 **/
Server.prototype._initSessionStore = function (callback) {
  var self = this;
  var sessionConfigs = self.configs.session || {};
  if (!sessionConfigs.enabled) {
    return;
  }
  var SessionStore = self.require(sessionConfigs.provider);
  self.sessionStore = new SessionStore(self);
  generator.wrap(self.sessionStore);
  if (self.sessionStore.init) {
    self.sessionStore.init(self, callback);
  } else {
    throw new Error('Session provider not found "init" method');
  }
};

/**
 * 初始化全局应用程序类
 **/
Server.prototype._initGlobal = function () {
  var self = this;
  self.global = {};
  if (self.configs.global) {
    var gloablPath = self.resolvePath(self.configs.global);
    var regexp = new RegExp(MODULE_DEFAULT_EXTENSION + "$");
    if (!regexp.test(gloablPath)) {
      gloablPath += MODULE_DEFAULT_EXTENSION;
    }
    if (fs.existsSync(gloablPath)) {
      var Global = self.require(gloablPath);
      self.global = new Global(self);
      generator.wrap(self.global);
    }
  }
  self.filterInvoker = new FilterInvoker([self.global],
    self.logger.error.bind(self.logger));
};

/**
 * 添加固定响应头信息
 **/
Server.prototype._setHeaders = function (context) {
  var self = this;
  var res = context.response;
  res.setHeader('X-Powered-By', self.pkg.displayName);
  utils.each(self.configs.headers, function (name, value) {
    res.setHeader(name, value);
  });
  //如果发生未处理的异常在进程结束前 _doNotKeepAlive 会设为 true
  if (self._doNotKeepAlive) {
    res.setHeader('Connection', 'close');
  }
};

/**
 * 创建请求监听函数
 **/
Server.prototype._createListener = function () {
  var self = this;
  return (function (req, res) {
    var context = null;
    //创建 context 实例
    try {
      context = new Context(self, req, res);
    } catch (ex) {
      self.logger.error(ex);
      res.statusCode = 500;
      return res.end("context error: " + ex.message);
    }
    //开始处理当前 context 
    var dm = domain.create();
    dm.on('error', function (err) {
      context.error(err);
    });
    dm.add(req);
    dm.add(res);
    dm.add(context);
    dm.run(function () {
      self._handleRequest(context);
    });
  });
};

/**
 * 可以用于 express 的中间件
 * server 本身的 https、port 等配置将会被忽略
 * 最终取决于 express 的配置
 **/
Server.prototype.middleware = function () {
  var self = this;
  return self._createListener();
};

/**
 * 生成 https 选项
 **/
Server.prototype._getHttpsOptions = function (httpsConfigs) {
  var self = this;
  var httpsOptions = {};
  if (httpsConfigs.key) {
    httpsOptions.key = fs.readFileSync(self.resolvePath(httpsConfigs.key));
  }
  if (httpsConfigs.cert) {
    httpsOptions.cert = fs.readFileSync(self.resolvePath(httpsConfigs.cert));
  }
  if (httpsConfigs.pfx) {
    httpsOptions.pfx = fs.readFileSync(self.resolvePath(httpsConfigs.pfx));
  }
  return httpsOptions;
};

/**
 * 创建 http>https 的跳转服务
 **/
Server.prototype._createHttpToHttpsServer = function (callback) {
  var self = this;
  var configs = self.configs;
  self._httpToHttpsServer = new Server({
    "root": self.resolvePath("$./empty"),
    "port": configs.https.redirectPort,
    "httpsPort": configs.https.port || configs.httpsPort || configs.port,
    "https": {
      "enabled": false
    },
    "session": {
      "enabled": false
    },
    "log": {
      "enabled": false
    },
    "doNotWatchProcessException": true
  });
  var HttpToHttpsFilter = self.require("$./filters/http-to-https");
  self._httpToHttpsServer.filter("/", new HttpToHttpsFilter(self._httpToHttpsServer));
};

/**
 * 创建 http server 并处理
 **/
Server.prototype._createServer = function () {
  var self = this;
  var configs = self.configs;
  if (configs.https && configs.https.enabled) {
    //启用了 https
    var httpsOptions = self._getHttpsOptions(configs.https);
    self.httpServer = https.createServer(httpsOptions, self._createListener());
    //如果开启了 http > https 重定向
    if (configs.https.redirectPort) {
      self._createHttpToHttpsServer();
    }
  } else {
    //普通 http 
    self.httpServer = http.createServer(self._createListener());
  }
  //设定初始状态
  self.httpServer.started = false;
  //close 事件
  self.httpServer.on('close', function () {
    self.httpServer.started = false;
  });
};

//------------------------------------------------------------------

/**
 * 处理路径
 **/
Server.prototype.resolvePath = function (_path, formPath) {
  var self = this;
  if (utils.isNull(_path)) {
    _path = "./";
  }
  formPath = formPath || self.options.root;
  if (_path[0] == '$') {
    formPath = self.installPath;
    _path = _path.slice(1);
  }
  if (_path[0] != '.') {
    //其它的认为是 app 依赖的模块
    formPath = path.normalize(formPath + '/node_modules/');
  }
  return path.resolve(formPath, _path);
};

/**
 * 系统 require
 **/
Server.prototype.require = function (_path) {
  var self = this;
  return require(self.resolvePath(_path));
};

//------------------------------------------------------------------

/**
 * 配置 mime 类型
 **/
Server.prototype.mime = function (name, value) {
  var self = this;
  self.configs.mimeType = self.configs.mimeType || {};
  if (value) {
    self.configs.mimeType[name] = value;
  } else {
    return self.configs.mimeType[name] || self.configs.mimeType["*"];
  }
};

//------------------------------------------------------------------

/**
 * 启动Server
 **/
Server.prototype.start = function (callback) {
  var self = this;
  self._startWatchProcessException();
  var port = self.configs.port;
  if (self.configs.https.enabled) {
    port = self.configs.https.port || self.configs.httpsPort || port;
  }
  self.httpServer.listen(port, function () {
    self.httpServer.started = true;
    self.filterInvoker.invoke('onStart', self, function (err) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      var host = (self.configs.hosts || [])[0] || 'localhost';
      var msg = 'The server on "' + host + ':' + port + '" started';
      //如果开启了 http>https 重定向
      if (self._httpToHttpsServer) {
        self._httpToHttpsServer.start(function (err, _msg) {
          if (err) {
            if (callback) callback(err);
            return;
          }
          if (callback) callback(null, [msg, _msg].join(","));
          self.emit('start', self);
        });
      } else {
        if (callback) callback(null, msg);
        self.emit('start', self);
      }
    });
  });
};

/**
 * 停止Server
 **/
Server.prototype.stop = function (callback) {
  var self = this;
  self._stopWatchProcessException();
  self.httpServer.close(function () {
    self.httpServer.started = false;
    self.filterInvoker.invoke('onStop', self, function (err) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      var host = (self.configs.hosts || [])[0] || 'localhost';
      var port = self.configs.port;
      if (self.configs.https.enabled) {
        port = self.configs.https.port || self.configs.httpsPort || port;
      }
      var msg = 'The server on "' + host + ':' + port + '" stoped';
      //如果开启了 http>https 重定向
      if (self._httpToHttpsServer) {
        self._httpToHttpsServer.stop(function (err, _msg) {
          if (err) {
            if (callback) callback(err);
            return;
          }
          if (callback) callback(null, [msg, _msg].join(","));
          self.emit('stop', self);
        });
      } else {
        if (callback) callback(null, msg);
        self.emit('stop', self);
      }
    });
  });
};

generator.wrap(Server.prototype);

module.exports = Server;
/*end*/
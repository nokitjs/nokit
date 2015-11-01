var http = require('http');
var fs = require('fs');
var util = require("util");
var events = require("events");
var path = require('path');
var console = require("./console");
var utils = require("./utils");
var pkg = require("../../package.json");
var env = require("./env");
var Context = require("./context");
var domain = require('domain');
var FilterInvoker = require('./filter-invoker');


//------------------------------------------------------------------

var SYSTEM_CONFIG_FILE = path.normalize('./system.json');
var WEB_CONFIG_FILE = path.normalize('./web.json');
var DEFAULT_HANDLER_NAME = "static";
var MODULE_DEFAULT_EXTENSION = '.js';

//------------------------------------------------------------------

/**
 * 定义 Server 类
 **/
var Server = function (options) {
    var self = this;
    events.EventEmitter.call(self);
    self.options = options || {};
    self.pkg = pkg;
    self.env = env;
    self.installPath = env.INSTALL_PATH;
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
        throw new Error("创建 Server 实例时发生异常，必需指定一个存在的根目录。");
        return;
    }
    self._initConfigs();
    self._initLogger();
    self._initGlobal();
    self._loadParsers();
    self._loadFilters();
    self._loadHandlers();
    self._loadTemplatePages();
    self._createServer();
};

/**
 * 读取并合并配置
 **/
Server.prototype._initConfigs = function (callback) {
    var self = this;
    //公共配置
    var systemConfigFile = path.resolve(self.installPath, SYSTEM_CONFIG_FILE);
    var systemConfigs = utils.readJSONSync(systemConfigFile) || {};
    //应用配置 
    var appConfigFile = path.resolve(self.options.root, self.options.configFile || WEB_CONFIG_FILE);
    var appConfigs = utils.readJSONSync(appConfigFile) || {};
    //合并
    self.configs = {};
    self.configs = utils.mix(self.configs, systemConfigs, true, null, 2, true);
    self.configs = utils.mix(self.configs, appConfigs, true, null, 2, true);
    self.configs = utils.mix(self.configs, self.options, true, null, 2, true);
    if (callback) callback();
};

//------------------------------------------------------------------

/**
 * 解析 filter、handler 需要配置的 “表达式”
 **/
Server.prototype._parseExpr = function (exprStr) {
    exprStr = exprStr || "";
    var exprParts = exprStr.split("::");
    return {
        "str": exprStr,
        "pattern": exprParts[0],
        "name": exprParts[1]
    };
};

/**
 * 检查 url 匹配表达式
 **/
Server.prototype._checkPattern = function (pattern) {
    //不合法的 name 直接忽略
    return pattern != null &&
        pattern != '*' &&
        pattern != '.';
}

//------------------------------------------------------------------

/**
 * 配置解析器
 **/
Server.prototype.parser = function (contentType, parser) {
    var self = this;
    self._parsers = self._parsers || {};
    if (parser) {
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
            throw new Error('parser "' + parserPath + '" 存在错误');
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
            throw new Error('filter "' + filterPath + '" 存在错误');
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
            throw new Error('handler "' + handlerPath + '" 存在错误');
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
    context.handler.handle(context);
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
        self._templatePages[name] = utils.compileTemplateSync(tmplPath);
    } else {
        return self._templatePages[name];
    }
};

//------------------------------------------------------------------

/**
 * 检查是否是拒绝访问的资源
 **/
Server.prototype._isDeny = function (context) {
    var self = this;
    var req = context.request;
    //检查是否是绑定的域名或IP（host）
    var hosts = self.configs.hosts;
    if (hosts != null && hosts.length > 0 && !utils.contains(hosts, req.clientInfo.host)) {
        return {
            "state": true,
            "message": '拒绝使用 "' + req.clientInfo.host + '" 的访问'
        };
    }
    //检查是否是禁止访问的资源
    var url = req.withoutQueryStringURL;
    return utils.each(self.configs.denys, function (i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return {
                "state": true
            };
        }
    });
};

/**
 * 处理请求
 **/
Server.prototype._handleRequest = function (context) {
    var self = this;
    var dm = domain.create();
    dm.on('error', function (err) {
        context.error(err);
    });
    // dm.run = function(fn) {fn();};
    dm.run(function () {
        self._matchHandlerAndHandleRequest(context);
    });
};

//------------------------------------------------------------------

/**
 * 初始化日志
 **/
Server.prototype._initLogger = function () {
    var self = this;
    self.configs.log = self.configs.log || {};
    if (self.configs.log.provider) {
        self.Logger = self.require(self.configs.log.provider);
        if (self.Logger.init) {
            self.Logger.init(self);
        }
        //全局日志对象
        self.logger = new self.Logger();
    }
};

/**
 * 初始化全局应用程序类
 **/
Server.prototype._initGlobal = function () {
    var self = this;
    self.global = {};
    if (!self.configs.global) {
        return;
    }
    var gloablPath = self.resolvePath(self.configs.global);
    if (!gloablPath.endsWith(MODULE_DEFAULT_EXTENSION)) {
        gloablPath += MODULE_DEFAULT_EXTENSION;
    }
    if (fs.existsSync(gloablPath)) {
        var Global = self.require(gloablPath);
        self.global = new Global(self);
    }
};

/**
 * 添加固定响应头信息
 **/
Server.prototype._setHeaders = function (context) {
    var self = this;
    var res = context.response;
    res.setHeader('X-Powered-By', self.pkg.rawName);
    utils.each(self.configs.headers, function (name, value) {
        res.setHeader(name, value);
    });
};

/**
 * 创建 http server 并处理
 **/
Server.prototype._createServer = function () {
    var self = this;
    self.httpServer = http.createServer(function (req, res) {
        var context = new Context(self, req, res);
        //设置 server 头信息
        self._setHeaders(context);
        //找到可用的 filter
        context.filters = self._matchFilters(context);
        context.filterInvoker = new FilterInvoker(context.filters);
        //检查是否禁止访问
        var deny = self._isDeny(context);
        if (deny && deny.state) {
            //在禁止用 "非绑定的host" 访问时，deny.message 才会的值（提示字符串）
            context.deny(deny.message);
            return;
        }
        //执行 filter 事件
        context.filterInvoker.invoke('onRequestBegin', context, function () {
            //查找内容解析器
            context.parser = self._matchParser(context);
            if (!context.parser) {
                context.error('未找到可用的内容解析器');
                return;
            }
            //解析内容
            context.parser.parse(context, function () {
                context.filterInvoker.invoke('onReceived', context, function () {
                    self._handleRequest(context);
                });
            });
        });
    });
};

//------------------------------------------------------------------

/**
 * 处理路径
 **/
Server.prototype.resolvePath = function (_path) {
    var self = this;
    var formPath = self.options.root;
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
    if (self.httpServer) {
        self.httpServer.listen(self.configs.port, function () {
            var filterInvoker = new FilterInvoker([self.global]);
            filterInvoker.invoke('onStart', self, function () {
                var host = (self.configs.hosts || [])[0] || 'localhost';
                var msg = '已在 "http://' + host + ':' + self.configs.port + '" 启动服务。';
                if (callback) callback(null, msg);
                self.emit('start', self);
            });
        });
    } else {
        throw new Error('没有已成功创建的 Server 实例');
    }
};

/**
 * 停止Server
 **/
Server.prototype.stop = function (callback) {
    var self = this;
    if (self.httpServer) {
        self.httpServer.close(function () {
            var filterInvoker = new filterInvoker([self.global]);
            filterInvoker.invoke('onStop', self, function () {
                var host = (self.configs.hosts || [])[0] || 'localhost';
                var msg = '已在 "http://' + host + ':' + self.configs.port + '" 停止服务。';
                if (callback) callback(null, msg);
                self.emit('stop', self);
            });
        });
    } else {
        throw new Error('没有已成功创建的 Server 实例');
    }
};

module.exports = Server;
/*end*/
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
var Filters = require('./filters');

var SYSTEM_CONFIG_FILE = path.normalize('./system.json');
var WEB_CONFIG_FILE = path.normalize('./web.json');

//定义Server.
var Server = function (options) {
    var self = this;
    events.EventEmitter.call(self);
    self.options = options || {};
    self.pkg = pkg;
    self.env = env;
    self.installPath = env.INSTALL_PATH;
    self._init(options);
};

util.inherits(Server, events.EventEmitter);

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
    self._loadSessionProvider();
    self._loadTemplatePages();
    self._createServer();
};

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
    //转换路径
    utils.each(self.configs.parsers, function (name, _path) {
        self.configs.parsers[name] = self.resolvePath(_path);
    });
    utils.each(self.configs.handlers, function (name, _path) {
        self.configs.handlers[name] = self.resolvePath(_path);
    });
    utils.each(self.configs.filters, function (name, _path) {
        self.configs.filters[name] = self.resolvePath(_path);
    });
    if (self.configs.template && self.configs.template.pages) {
        utils.each(self.configs.template.pages, function (name, _path) {
            self.configs.template.pages[name] = self.resolvePath(_path);
        });
    }
    if (self.configs.session && self.configs.session.provider) {
        self.configs.session.provider = self.resolvePath(self.configs.session.provider);
    }
    if (self.configs.log && self.configs.log.provider) {
        self.configs.log.provider = self.resolvePath(self.configs.log.provider);
    }
    if (self.configs.log && self.configs.log.path) {
        self.configs.log.path = self.resolvePath(self.configs.log.path);
    }
    if (self.configs.global) {
        self.configs.global = self.resolvePath(self.configs.global);
    }
    if (callback) callback();
};

Server.prototype._loadParsers = function () {
    var self = this;
    utils.each(self.configs.parsers, function (name, parserPath) {
        var Parser = require(parserPath);
        if (utils.isFunction(Parser)) {
            self.parser(name, new Parser(self));
        } else {
            throw new Error('parser "' + parserPath + '" 存在错误');
        }
    });
};

Server.prototype._matchParser = function (context) {
    var self = this;
    var contentType = context.request.headers['content-type'] || '';
    var contentTypeParts = contentType.split(';');
    var parser = utils.each(self._parsers, function (contentType, _parser) {
        if (utils.contains(contentTypeParts, contentType)) {
            return _parser;
        }
    });
    return parser || self._parsers["*"];
};

/**
 * 加载所有已配置的 filter
 **/
Server.prototype._loadFilters = function () {
    var self = this;
    utils.each(self.configs.filters, function (name, filterPaths) {
        if (!utils.isArray(filterPaths)) {
            filterPaths = [filterPaths];
        }
        filterPaths.forEach(function (filterPath) {
            var Filter = require(filterPath);
            if (utils.isFunction(Filter)) {
                self.filter(name, new Filter(self));
            } else {
                throw new Error('filter "' + filterPath + '" 存在错误');
            }
        });
    });
};

/**
 * 匹配可用的 filter
 **/
Server.prototype._matchFilters = function (context) {
    var self = this;
    var usedFilters = [self.global];
    utils.each(self._filters, function (i, filterArray) {
        filterArray.forEach(function (filter) {
            //不合法的 name 直接忽略
            if (filter.name == null ||
                filter.name == '*' ||
                filter.name == '.') {
                return;
            }
            var exp = new RegExp(filter.name);
            if (exp.test(context.request.url)) {
                usedFilters.push(filter);
            }
        });
    });
    return new Filters(usedFilters);
};

/**
 * 加载所有已配置的 handler
 **/
Server.prototype._loadHandlers = function () {
    var self = this;
    utils.each(self.configs.handlers, function (name, handlerPaths) {
        if (!utils.isArray(handlerPaths)) {
            handlerPaths = [handlerPaths];
        }
        handlerPaths.forEach(function (handlerPath) {
            var Handler = require(handlerPath);
            if (utils.isFunction(Handler)) {
                self.handler(name, new Handler(self));
            } else {
                throw new Error('handler "' + handlerPath + '" 存在错误');
            }
        });
    });
};

/**
 * 获取所有可用的 handler
 **/
Server.prototype._getUsedHandlers = function (context) {
    var self = this;
    var usedHandlers = [];
    context.ignoreHandlers = context.ignoreHandlers || [];
    utils.each(self._handlers, function (name, handlerArray) {
        handlerArray.forEach(function (_handler) {
            if (!utils.contains(context.ignoreHandlers, _handler)) {
                usedHandlers.push(_handler);
            }
        });
    });
    return usedHandlers;
};

Server.prototype.findHandler = function (name) {
    var self = this;
    var handlerArray = self._handlers[name] || [];
    return handlerArray[0];
};

/**
 * 匹配可用的 handler
 **/
Server.prototype._matchHandler = function (context) {
    var self = this;
    var usedHandlers = self._getUsedHandlers(context);
    var handler = utils.each(usedHandlers, function (i, _handler) {
        //不合法的 name 直接忽略
        if (_handler.name == null ||
            _handler.name == '*' ||
            _handler.name == '.') {
            return;
        }
        var exp = new RegExp(_handler.name);
        if (exp.test(context.request.url)) {
            return _handler;
        }
    });
    handler = handler || self.findHandler("*");
    return handler;
};

Server.prototype._loadTemplatePages = function () {
    var self = this;
    utils.each(self.configs.template.pages, function (name, path) {
        self.templatePage(name, path);
    });
};

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

Server.prototype._matchHandlerAndHandleRequest = function (context) {
    var self = this;
    context.handler = self._matchHandler(context);
    context.handler.handle(context);
};

Server.prototype._loadSessionProvider = function () {
    var self = this;
    self.configs.session = self.configs.session || {};
    if (!self.configs.session.state) {
        return;
    }
    if (self.configs.session.provider) {
        self.SessionProvier = self.require(self.configs.session.provider);
        if (self.SessionProvier.init) {
            self.SessionProvier.init(self);
        }
    }
};

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

Server.prototype._initGlobal = function () {
    var self = this;
    if (self.configs.global && fs.existsSync(self.configs.global)) {
        var Global = require(self.configs.global);
        self.global = new Global(self);
    } else {
        self.global = {};
    }
};

Server.prototype._setHeaders = function (context) {
    var self = this;
    var res = context.response;
    res.setHeader('X-Powered-By', self.pkg.rawName);
    utils.each(self.configs.headers, function (name, value) {
        res.setHeader(name, value);
    });
};

Server.prototype._createServer = function () {
    var self = this;
    self.httpServer = http.createServer(function (req, res) {
        var context = new Context(self, req, res);
        //设置 server 头信息
        self._setHeaders(context);
        //找到可用的 filter
        context.filters = self._matchFilters(context);
        //检查是否禁止访问
        var deny = self._isDeny(context);
        if (deny && deny.state) {
            //在禁止用 "非绑定的host" 访问时，deny.message 才会的值（提示字符串）
            context.deny(deny.message);
            return;
        }
        //执行 filter 事件
        context.filters.invoke('onRequestBegin', context, function () {
            //查找内容解析器
            context.parser = self._matchParser(context);
            if (!context.parser) {
                context.error('未找到可用的内容解析器');
                return;
            }
            //解析内容
            context.parser.parse(context, function () {
                context.filters.invoke('onReceived', context, function () {
                    self._handleRequest(context);
                });
            });
        });
    });
};

//处理路径
Server.prototype.resolvePath = function (_path) {
    var self = this;
    if (_path[0] == '$') {
        //$开头的为 nokit 包内文件模块相对路径
        _path = _path.slice(1);
        if (_path[0] == '.') {
            return path.resolve(self.installPath, _path);
        } else {
            return _path;
        }
    } else { //相对于 app 的路径
        if (_path[0] == '.') {
            return path.resolve(self.options.root, _path);
        } else {
            //其它的认为是 app 依赖的模块
            var relativePath = path.normalize(self.options.root + '/node_modules/');
            return path.resolve(relativePath, _path);
        }
    }
};

//系统 require
Server.prototype.require = function (_path) {
    var self = this;
    return require(self.resolvePath(_path));
};

/**
 * 配置解析器
 **/
Server.prototype.parser = function (name, parser) {
    var self = this;
    self._parsers = self._parsers || {};
    if (parser) {
        parser.name = name;
        self._parsers[name] = parser;
    } else {
        return self._parsers[name];
    }
};

Server.prototype.filter = function (name, filter) {
    var self = this;
    self._filters = self._filters || {};
    if (filter) {
        filter.name = name;
        self._filters[name] = self._filters[name] || [];
        self._filters[name].push(filter);
    } else {
        return self._filters[name];
    }
};

Server.prototype.handler = function (name, handler) {
    var self = this;
    self._handlers = self._handlers || {};
    if (handler) {
        handler.name = name;
        // handler 的 next 会排除自身
        handler.next = function (context) {
            context.ignoreHandlers.push(this);
            return self._matchHandlerAndHandleRequest(context);
        };
        self._handlers[name] = self._handlers[name] || [];
        self._handlers[name].push(handler);
    } else {
        return self._handlers[name];
    }
};

Server.prototype.templatePage = function (name, tmplPath) {
    var self = this;
    self._templatePages = self._templatePages || {};
    if (tmplPath) {
        self._templatePages[name] = utils.compileTemplateSync(tmplPath);
    } else {
        return self._templatePages[name];
    }
};

Server.prototype.mime = function (name, value) {
    var self = this;
    self.configs.mimeType = self.configs.mimeType || {};
    if (value) {
        self.configs.mimeType[name] = value;
    } else {
        return self.configs.mimeType[name] || self.configs.mimeType["*"];
    }
};

//启动Server
Server.prototype.start = function (callback) {
    var self = this;
    if (self.httpServer) {
        self.httpServer.listen(self.configs.port, function () {
            var filters = new Filters([self.global]);
            filters.invoke('onStart', self, function () {
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

//停止Server
Server.prototype.stop = function (callback) {
    var self = this;
    if (self.httpServer) {
        self.httpServer.close(function () {
            var filters = new Filters([self.global]);
            filters.invoke('onStop', self, function () {
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
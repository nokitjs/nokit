var http = require('http');
var fs = require('fs');
var path = require('path');
var console = require("./console");
var utils = require("./utils");
var info = require("./info");
var env = require("./env");
var Context = require("./context");
var domain = require('domain');
var Filters = require('./filters');
var Logger = require('./logger');
var Session = require('./session');

var SYSTEM_CONFIG_FILE = './system.json';
var WEB_CONFIG_FILE = './web.json';
var HEADER_MARK_NAME = 'X-Powered-By';

//定义Server.
var Server = function(options) {
    var self = this;
    self.options = options || {};
    self.packageInfo = info;
    self.env = env;
    self.installPath = env.installPath;
    self._init(options);
};

Server.prototype._init = function(options) {
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

Server.prototype._initConfigs = function(callback) {
    var self = this;
    //公共配置
    var systemConfigFile = path.resolve(self.installPath, SYSTEM_CONFIG_FILE);
    var systemConfigs = utils.readJSONSync(systemConfigFile) || {};
    utils.each(systemConfigs.parsers, function(name, _path) {
        systemConfigs.parsers[name] = self.resolveSystemPath(_path);
    });
    utils.each(systemConfigs.handlers, function(name, _path) {
        systemConfigs.handlers[name] = self.resolveSystemPath(_path);
    });
    utils.each(systemConfigs.filters, function(name, _path) {
        systemConfigs.filters[name] = self.resolveSystemPath(_path);
    });
    if (systemConfigs.template && systemConfigs.template.pages) {
        utils.each(systemConfigs.template.pages, function(name, _path) {
            systemConfigs.template.pages[name] = self.resolveSystemPath(_path);
        });
    }
    if (systemConfigs.session && systemConfigs.session.provider) {
        systemConfigs.session.provider = self.resolveSystemPath(systemConfigs.session.provider);
    }
    if (systemConfigs.log && systemConfigs.log.provider) {
        systemConfigs.log.provider = self.resolveSystemPath(systemConfigs.log.provider);
    }
    if (systemConfigs.log && systemConfigs.log.path) {
        //log 目录，系统默认配置也相对于 app 根目录
        systemConfigs.log.path = self.resolveAppPath(systemConfigs.log.path);
    }
    if (systemConfigs.global) {
        //全局类，系统默认配置也相对于 app 根目录
        systemConfigs.global = self.resolveAppPath(systemConfigs.global);
    }
    //应用配置 
    var appConfigFile = path.resolve(self.options.root, self.options.configFile || WEB_CONFIG_FILE);
    var appConfigs = utils.readJSONSync(appConfigFile) || {};
    utils.each(appConfigs.parsers, function(name, _path) {
        if (name === '*') {
            throw '不能配置 name 为 "*" 的 parser';
            return;
        };
        appConfigs.parsers[name] = self.resolveAppPath(_path);
    });
    utils.each(appConfigs.handlers, function(name, _path) {
        if (name === '*') {
            throw '不能配置 name 为 "*" 的 handler';
            return;
        };
        appConfigs.handlers[name] = self.resolveAppPath(_path);
    });
    utils.each(appConfigs.filters, function(name, _path) {
        appConfigs.filters[name] = self.resolveAppPath(_path);
    });
    if (appConfigs.template && appConfigs.template.pages) {
        utils.each(appConfigs.template.pages, function(name, _path) {
            appConfigs.template.pages[name] = self.resolveAppPath(_path);
        });
    }
    if (appConfigs.session && appConfigs.session.provider) {
        appConfigs.session.provider = self.resolveAppPath(appConfigs.session.provider);
    }
    if (appConfigs.log && appConfigs.log.provider) {
        appConfigs.log.provider = self.resolveAppPath(appConfigs.log.provider);
    }
    if (appConfigs.log && appConfigs.log.path) {
        appConfigs.log.path = self.resolveAppPath(appConfigs.log.path);
    }
    if (appConfigs.global) {
        appConfigs.global = self.resolveAppPath(appConfigs.global);
    }
    //合并
    self.configs = {};
    self.configs = utils.mix(self.configs, systemConfigs, true, null, 2, true);
    self.configs = utils.mix(self.configs, appConfigs, true, null, 2, true);
    self.configs = utils.mix(self.configs, self.options, true, null, 2, true);
    //--
    if (callback) callback();
};

Server.prototype._loadParsers = function() {
    var self = this;
    utils.each(self.configs.parsers, function(name, path) {
        var Parser = require(path);
        if (utils.isFunction(Parser)) {
            self.parser(name, new Parser(self));
        } else {
            throw new Error('parser "' + name + '" 存在错误');
        }
    });
};

Server.prototype._matchParser = function(context) {
    var self = this;
    var contentType = context.request.headers['content-type'] || '';
    var contentTypeParts = contentType.split(';');
    var parser = utils.each(self._parsers, function(contentType, _parser) {
        if (utils.contains(contentTypeParts, contentType)) {
            return _parser;
        }
    });
    return parser || self._parsers["*"];
};

Server.prototype._loadFilters = function() {
    var self = this;
    utils.each(self.configs.filters, function(name, path) {
        var Filter = require(path);
        if (utils.isFunction(Filter)) {
            self.filter(name, new Filter(self));
        } else {
            throw new Error('filter "' + name + '" 存在错误');
        }
    });
};

Server.prototype._matchFilters = function(context) {
    var self = this;
    var usedFilters = [self.global];
    utils.each(self._filters, function(name, _filter) {
        //不合法的 name 直接忽略
        if (name == null || name == '*' || name[0] == '.') return;
        //--
        var exp = new RegExp(name);
        if (exp.test(context.request.url)) {
            usedFilters.push(_filter);
        }
    });
    return new Filters(usedFilters);
};

Server.prototype._loadHandlers = function() {
    var self = this;
    utils.each(self.configs.handlers, function(name, path) {
        var Handler = require(path);
        if (utils.isFunction(Handler)) {
            self.handler(name, new Handler(self));
        } else {
            throw new Error('handler "' + name + '" 存在错误');
        }
    });
};

Server.prototype._getUsedHandlers = function(context) {
    var self = this;
    var usedHandlers = null;
    if (context.ignoreHandlers && context.ignoreHandlers.length > 0) {
        usedHandlers = {
            "*": self._handlers["*"]
        };
        utils.each(self._handlers, function(name, _handler) {
            if (!utils.contains(context.ignoreHandlers, _handler)) {
                usedHandlers[name] = _handler;
            }
        });
    } else {
        usedHandlers = self._handlers;
    }
    return usedHandlers;
};

Server.prototype._matchHandler = function(context) {
    var self = this;
    var usedHandlers = self._getUsedHandlers(context);
    var handler = utils.each(usedHandlers, function(name, _handler) {
        //不合法的 name 直接忽略
        if (name == null || name == '*' || name[0] == '.') return;
        //--
        var exp = new RegExp(name);
        if (exp.test(context.request.url)) {
            return _handler;
        }
    });
    return handler || usedHandlers[context.request.extname] || usedHandlers["*"];;
};

Server.prototype._loadTemplatePages = function() {
    var self = this;
    utils.each(self.configs.template.pages, function(name, path) {
        self.templatePage(name, path);
    });
};

Server.prototype._isDeny = function(context) {
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
    return utils.each(self.configs.denys, function(i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return {
                "state": true
            };
        }
    });
};

Server.prototype._handleRequest = function(context) {
    var self = this;
    //交由符合的 handler 处理
    context.handler = self._matchHandler(context);
    var dm = domain.create();
    dm.on('error', function(err) {
        context.error(err);
    });
    // dm.run = function(fn) {
    //     fn();
    // };
    dm.run(function() {
        context.handler.handle(context);
    });
};

Server.prototype._transferRequest = function(context, srcHandler) {
    var self = this;
    if (srcHandler) {
        context.ignoreHandlers.push(srcHandler);
    }
    context.handler = self._matchHandler(context);
    context.handler.handle(context);
};

Server.prototype._setHeaders = function(context) {
    var self = this;
    var req = context.request,
        res = context.response;
    res.setHeader(HEADER_MARK_NAME, self.packageInfo.name);
    utils.each(self.configs.headers, function(name, value) {
        res.setHeader(name, value);
    });
};

Server.prototype._loadSessionProvider = function() {
    var self = this;
    self.configs.session = self.configs.session || {};
    if (!self.configs.session.state) {
        return;
    }
    if (self.configs.session.provider) {
        self.SessionProvier = require(self.configs.session.provider);
    } else {
        self.SessionProvier = Session;
    }
};

Server.prototype._initLogger = function() {
    var self = this;
    self.configs.log = self.configs.log || {};
    if (self.configs.log.provider) {
        self.Logger = require(self.configs.log.provider);
    } else {
        self.Logger = Logger;
    }
    if (self.Logger.init) {
        self.Logger.init(self);
    }
    //全局日志对象
    self.logger = new self.Logger();
};

Server.prototype._initGlobal = function() {
    var self = this;
    if (self.configs.global && fs.existsSync(self.configs.global)) {
        var Global = require(self.configs.global);
        self.global = new Global(self);
    } else {
        self.global = {};
    }
};

Server.prototype._createServer = function() {
    var self = this;
    self.httpServer = http.createServer(function(req, res) {
        var context = new Context(self, req, res);
        self._setHeaders(context);
        //找到可用的 filter
        context.filters = self._matchFilters(context);
        //记录日志
        context.logger.log('来自 "' + req.clientInfo.ip + '" 的 "' + req.method + '" 请求 "' + req.url + '"');
        //检查是否禁止访问
        var deny = self._isDeny(context);
        if (deny && deny.state) {
            //在禁止用 "非绑定的host" 访问时，deny.message 才会的值（提示字符串）
            context.deny(deny.message);
            return;
        }
        //执行 filter 事件
        context.filters.invoke('onRequestBegin', context, function() {
            //查找内容解析器
            context.parser = self._matchParser(context);
            if (!context.parser) {
                context.error('未找到可用的内容解析器');
                return;
            }
            //解析内容
            context.parser.parse(context, function() {
                context.filters.invoke('onReceived', context, function() {
                    self._handleRequest(context);
                });
            });
        });
    });
};


Server.prototype.resolveAppPath = function(_path) {
    var self = this;
    var relativePath = self.options.root;
    if (_path[0] == '$') {
        //$开头的为 nokit 包内文件模块相对路径
        relativePath = self.installPath;
        _path = _path.slice(1);
    } else if (_path[0] == '#') {
        //#开头的为 Node 模块名称 (相对 app 包)
        relativePath = path.normalize(self.options.root + '/node_modules/');
        _path = _path.slice(1);
        return _path;
    } else if (_path[0] == '!') {
        //!开头的为 app 包内文件模块
        _path = _path.slice(1);
    }
    return path.resolve(relativePath, _path);
};

Server.prototype.resolveSystemPath = function(_path) {
    var self = this;
    var relativePath = self.installPath;
    if (_path[0] == '!') {
        //!开头的为 app 包内文件模块
        relativePath = self.options.root;
        _path = _path.slice(1);
    } else if (_path[0] == '#') {
        //#开头的为 Node 模块名称(相对 nokit 包)
        relativePath = path.normalize(self.options.installPath + '/node_modules/');
        _path = _path.slice(1);
    } else if (_path[0] == '$') {
        //$开头的为 nokit 包内文件模块相对路径
        _path = _path.slice(1);
    }
    return path.resolve(self.installPath, _path);
};

Server.prototype.require = function(_path) {
    var self = this;
    return require(self.resolveSystemPath(_path));
};

Server.prototype.appRequire = function(_path) {
    var self = this;
    return require(self.resolveAppPath(_path));
};

Server.prototype.parser = function(name, parser) {
    var self = this;
    self._parsers = self._parsers || {};
    if (parser) {
        self._parsers[name] = parser;
        self._parsers[name].name = name;
    } else {
        return self._parsers[name];
    }
};

Server.prototype.filter = function(name, filter) {
    var self = this;
    self._filters = self._filters || {};
    if (filter) {
        self._filters[name] = filter;
        self._filters[name].name = name;
    } else {
        return self._filters[name];
    }
};

Server.prototype.handler = function(name, handler) {
    var self = this;
    self._handlers = self._handlers || {};
    if (handler) {
        self._handlers[name] = handler;
        self._handlers[name].name = name;
        self._handlers[name].transfer = function(context) {
            var srcHandler = this;
            return self._transferRequest(context, srcHandler);
        };
    } else {
        return self._handlers[name];
    }
};

Server.prototype.templatePage = function(name, tmplPath) {
    var self = this;
    self._templatePages = self._templatePages || {};
    if (tmplPath) {
        self._templatePages[name] = utils.compileTemplateSync(tmplPath);
    } else {
        return self._templatePages[name];
    }
};

Server.prototype.mime = function(name, value) {
    var self = this;
    self.configs.mimeType = self.configs.mimeType || {};
    if (value) {
        self.configs.mimeType[name] = value;
    } else {
        return self.configs.mimeType[name] || self.configs.mimeType["*"];
    }
};

//启动Server
Server.prototype.start = function(callback) {
    var self = this;
    if (self.httpServer) {
        self.httpServer.listen(self.configs.port, function() {
            var filters = new Filters([self.global]);
            filters.invoke('onStart', self, function() {
                var host = (self.configs.hosts || [])[0] || 'localhost';
                var msg = '已在 "http://' + host + ':' + self.configs.port + '" 启动服务。';
                if (callback) callback(null, msg);
            });
        });
    } else {
        throw new Error('没有已成功创建的 Server 实例');
    }
};

//停止Server
Server.prototype.stop = function(callback) {
    var self = this;
    if (self.httpServer) {
        self.httpServer.close(function() {
            var filters = new Filters([self.global]);
            filters.invoke('onStop', self, function() {
                var host = (self.configs.hosts || [])[0] || 'localhost';
                var msg = '已在 "http://' + host + ':' + self.configs.port + '" 停止服务。';
                if (callback) callback(null, msg);
            });
        });
    } else {
        throw new Error('没有已成功创建的 Server 实例');
    }
};

module.exports = Server;
/*end*/
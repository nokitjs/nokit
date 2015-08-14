var http = require('http');
var fs = require('fs');
var path = require('path');
var qs = require("querystring");
var url = require("url");
var console = require("./console");
var utils = require("./utils");
var info = require("./info");
var env = require("./env");
var Context = require("./context");
var Cookie = require("./cookie");
var domain = require('domain');
var Filters = require('./filters');

var CONFIG_FILE = './web.json',
    HEADER_MARK_NAME = 'X-Powered-By',
    SESSION_ID_NAME = 'NSESSIONID';

//定义Server.
var Server = function(options) {
    var self = this;
    self.options = options || {};
    self.cache = {};
    self.packageInfo = info;
    self.env = env;
    self.installPath = env.installPath;
    self.init(options);
};

Server.prototype.resolveAppPath = function(_path) {
    var self = this;
    //#开头的为 Node Module Name
    if (_path[0] == '#') {
        _path = _path.slice(1);
        return _path;
    }
    //$开头的为 nokit 包内文件模块
    var relativePath = self.options.root;
    if (_path[0] == '$') {
        relativePath = self.installPath;
        _path = _path.slice(1);
    } else if (_path[0] == '!') {
        _path = _path.slice(1);
    }
    return path.resolve(relativePath, _path);
};

Server.prototype.resolveSystemPath = function(_path) {
    var self = this;
    //#开头的为 Node Module Name
    if (_path[0] == '#') {
        _path = _path.slice(1);
        return _path;
    }
    //!开头的为 app 包内文件模块
    var relativePath = self.installPath;
    if (_path[0] == '!') {
        relativePath = self.options.root;
        _path = _path.slice(1);
    } else if (_path[0] == '$') {
        _path = _path.slice(1);
    }
    return path.resolve(self.installPath, _path);
};

Server.prototype.initConfigs = function(callback) {
    var self = this;
    //公共配置
    var systemConfigFile = path.resolve(self.installPath, CONFIG_FILE);
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
    var appConfigFile = path.resolve(self.options.root, CONFIG_FILE);
    var appConfigs = utils.readJSONSync(appConfigFile) || {};
    utils.each(appConfigs.parsers, function(name, _path) {
        if (name === '*') {
            throw '不能配置 name 为 "*" 的 parser';
            return;
        };
        appConfigs.parsers[name] = self.resolveSystemPath(_path);
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

Server.prototype.require = function(_path) {
    var self = this;
    return require(path.resolve(self.installPath, _path));
};

Server.prototype.loadHandlers = function() {
    var self = this;
    self.handlers = {};
    utils.each(self.configs.handlers, function(name, path) {
        var Handler = require(path);
        if (utils.isFunction(Handler)) {
            self.handlers[name] = new Handler(self);
            self.handlers[name].name = name;
            self.handlers[name].transferRequest = function(context) {
                var srcHandler = this;
                return self.transferRequest(context, srcHandler);
            };
        } else {
            throw new Error('handler "' + name + '" 存在错误');
        }
    });
};

Server.prototype.loadParsers = function() {
    var self = this;
    self.parsers = {};
    utils.each(self.configs.parsers, function(name, path) {
        var Parser = require(path);
        if (utils.isFunction(Parser)) {
            self.parsers[name] = new Parser(self);
            self.parsers[name].name = name;
        } else {
            throw new Error('parser "' + name + '" 存在错误');
        }
    });
};

Server.prototype.matchParser = function(context) {
    var self = this;
    var contentType = context.request.headers['content-type'] || '';
    var contentTypeParts = contentType.split(';');
    var parser = utils.each(self.parsers, function(contentType, _parser) {
        if (utils.contains(contentTypeParts, contentType)) {
            return _parser;
        }
    });
    return parser || self.parsers["*"];
};

Server.prototype.loadTemplatePages = function() {
    var self = this;
    self.templatePages = {};
    utils.each(self.configs.template.pages, function(name, path) {
        self.templatePages[name] = utils.compileTemplateSync(path);
    });
};

Server.prototype.getUsedHandlers = function(context) {
    var self = this;
    var usedHandlers = null;
    if (context.ignoreHandlers && context.ignoreHandlers.length > 0) {
        usedHandlers = {
            "*": self.handlers["*"]
        };
        utils.each(self.handlers, function(name, _handler) {
            if (!utils.contains(context.ignoreHandlers, _handler)) {
                usedHandlers[name] = _handler;
            }
        });
    } else {
        usedHandlers = self.handlers;
    }
    return usedHandlers;
};

Server.prototype.matchHandler = function(context) {
    var self = this;
    var usedHandlers = self.getUsedHandlers(context);
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

Server.prototype.loadFilters = function() {
    var self = this;
    self.filters = {};
    utils.each(self.configs.filters, function(name, path) {
        var Filter = require(path);
        if (utils.isFunction(Filter)) {
            self.filters[name] = new Filter(self);
            self.filters[name].name = name;
        } else {
            throw new Error('filter "' + name + '" 存在错误');
        }
    });
};

Server.prototype.matchFilters = function(context) {
    var self = this;
    var usedFilters = [self.global];
    utils.each(self.filters, function(name, _filter) {
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

Server.prototype.isDeny = function(context) {
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

Server.prototype.getCache = function(context) {
    var self = this;
    return self.cache[context.request.withoutQueryStringURL];
};

Server.prototype.handleRequest = function(context) {
    var self = this;
    //交由符合的 handler 处理
    context.handler = self.matchHandler(context);
    var dm = domain.create();
    dm.on('error', function(err) {
        context.responseError(err);
    });
    dm.run(function() {
        context.handler.handleRequest(context);
    });
};

Server.prototype.transferRequest = function(context, srcHandler) {
    var self = this;
    context.ignoreHandlers.push(srcHandler);
    context.handler = self.matchHandler(context);
    context.handler.handleRequest(context);
};

Server.prototype.setHeaders = function(context) {
    var self = this;
    var req = context.request,
        res = context.response;
    res.setHeader(HEADER_MARK_NAME, self.packageInfo.name);
    utils.each(self.configs.headers, function(name, value) {
        res.setHeader(name, value);
    });
};

Server.prototype.handleRequestPath = function(context) {
    var self = this;
    var req = context.request,
        res = context.response;
    req._setUrl = function(url) {
        req.url = decodeURI(url || "");
        var urlParts = req.url.split('?');
        req.withoutQueryStringURL = urlParts[0].split('#')[0].replace(/\.\./g, "");
        req.queryString = (urlParts[1] || '').split('#')[0];
    };
    req._setUrl(req.url);
    req.publicPath = path.resolve(self.configs.root, self.configs.folders.public);
    req._setPhysicalPath = function(_path) {
        req.physicalPath = _path;
        req.extname = path.extname(req.physicalPath);
        req.mime = self.configs.mimeType[req.extname] || self.configs.mimeType["*"];
        req.physicalPathExists = fs.existsSync(req.physicalPath);
        if (req.physicalPathExists) {
            req.physicalPathStats = fs.statSync(req.physicalPath);
            req.physicalPathType = req.physicalPathStats.isDirectory() ? 'folder' : 'file'
        }
    };
    req._setPhysicalPath(path.normalize(req.publicPath + '/' + req.withoutQueryStringURL));
};

Server.prototype.handleCookie = function(context) {
    var self = this;
    var req = context.request,
        res = context.response;
    req.cookie = new Cookie({
        content: req.headers["cookie"]
    });
    res.cookie = new Cookie({
        response: res
    });
};

Server.prototype.handleSession = function(context) {
    var self = this;
    if (!self.configs.session.state) return;
    var req = context.request,
        res = context.response;
    req.sessionId = req.cookie.get(SESSION_ID_NAME);
    if (!req.sessionId) {
        req.sessionId = utils.newGuid().split('-').join('');
        res.cookie.add(SESSION_ID_NAME, req.sessionId);
    }
    //--
    context.session = new self.SessionProvier({
        sessionId: req.sessionId,
        server: self
    });
};

Server.prototype.loadSessionProvider = function() {
    var self = this;
    if (!self.configs.session.state) return;
    self.SessionProvier = require(self.configs.session.provider);
};

Server.prototype.initLogger = function() {
    var self = this;
    var Logger = require(self.configs.log.provider);
    self.logger = new Logger(self);
};

Server.prototype.initGlobal = function() {
    var self = this;
    if (self.configs.global && fs.existsSync(self.configs.global)) {
        var Global = require(self.configs.global);
        self.global = new Global(self);
    } else {
        self.global = {};
    }
};

Server.prototype.handleQueryString = function(context) {
    var self = this;
    var req = context.request;
    req.queryData = qs.parse(req.queryString) || {};
};

Server.prototype.handleClientInfo = function(context) {
    var self = this;
    var req = context.request;
    req.clientInfo = req.clientInfo || {};
    req.clientInfo.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    var hostParts = (req.headers['host'] || '').split(':');
    req.clientInfo.host = hostParts[0];
    req.clientInfo.port = hostParts[1];
    req.clientInfo.userAgent = req.headers['user-agent'];
};

Server.prototype.createServer = function() {
    var self = this;
    self.httpServer = http.createServer(function(req, res) {
        var context = new Context(self, req, res);
        //找到可用的 filter
        context.filters = self.matchFilters(context);
        self.handleClientInfo(context);
        self.handleRequestPath(context);
        self.setHeaders(context);
        self.handleCookie(context);
        self.handleSession(context);
        self.handleQueryString(context);
        //--
        //记录日志
        self.logger.log('来自 "' + req.clientInfo.ip + '" ' + req.method + ' 请求 "' + req.url + '"');
        //检查是否禁止访问
        var deny = self.isDeny(context);
        if (deny && deny.state) {
            //在禁止用 "非绑定的host" 访问时，deny.message 才会的值（提示字符串）
            context.responseDeny(deny.message);
            return;
        }
        //执行 filter 事件
        context.filters.invoke('onRequestBegin', context, function() {
            //查找内容解析器
            context.parser = self.matchParser(context);
            if (!context.parser) {
                context.responseError('未找到可用的内容解析器');
                return;
            }
            //解析内容
            context.parser.parse(context, function() {
                context.filters.invoke('onReceived', context, function() {
                    self.handleRequest(context);
                });
            });
        });
    });
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

Server.prototype.init = function(options) {
    var self = this;
    self.options.root = self.options.root || './';
    if (!fs.existsSync(self.options.root)) {
        throw new Error("创建 Server 实例时发生异常，必需指定一个存在的根目录。");
        return;
    }
    self.initConfigs();
    self.initLogger();
    self.initGlobal();
    self.loadParsers();
    self.loadFilters();
    self.loadHandlers();
    self.loadSessionProvider();
    self.loadTemplatePages();
    self.createServer();
};

module.exports = Server;
/*end*/
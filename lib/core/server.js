var http = require('http');
var fs = require('fs');
var path = require('path');
var qs = require("querystring");
var url = require("url");
var console = require("./console");
var utils = require("./utils");
var Context = require("./context");
var Cookie = require("./cookie");
var domain = require('domain');
var Filters = require('./filters');

var CONFIG_FILE = './web.json',
    PACKAGE_FILE = '../package.json',
    HEADER_MARK_NAME = 'X-Powered-By',
    SESSION_ID_NAME = 'NSESSIONID';

//定义Server.
var Server = function(options) {
    var self = this;
    self.options = options || {};
    self.cache = {};
    self.installPath = path.dirname(path.dirname(module.filename));
    self.init(options);
};

Server.prototype.loadPackageInfo = function() {
    var self = this;
    var packageFile = path.resolve(self.installPath, PACKAGE_FILE);
    self.packageInfo = utils.readJSONSync(packageFile);
    //因为提交到 npm 时已有同名包，加了 -runtime 后缀，在此去掉
    self.packageInfo.name = utils.firstUpper(self.packageInfo.name.split('-')[0]);
};

Server.prototype.resolveAppPath = function(_path) {
    var self = this;
    var relativePath = self.options.root;
    if (_path[0] == '$') {
        relativePath = self.installPath;
        _path = _path.slice(1);
    }
    return path.resolve(relativePath, _path);
};

Server.prototype.resolveSystemPath = function(_path) {
    var self = this;
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
    utils.each(systemConfigs.responsePages, function(name, _path) {
        systemConfigs.responsePages[name] = self.resolveSystemPath(_path);
    });
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
    utils.each(appConfigs.responsePages, function(name, _path) {
        appConfigs.responsePages[name] = self.resolveAppPath(_path);
    });
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
        self.handlers[name] = new Handler(self);
    });
};

Server.prototype.loadParsers = function() {
    var self = this;
    self.parsers = {};
    utils.each(self.configs.parsers, function(name, path) {
        var Parser = require(path);
        self.parsers[name] = new Parser(self);
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

Server.prototype.loadResponsePages = function() {
    var self = this;
    self.responsePages = {};
    utils.each(self.configs.responsePages, function(name, path) {
        self.responsePages[name] = utils.compileTemplateSync(path);
    });
};

Server.prototype.matchHandler = function(context) {
    var self = this;
    var handler = (function() {
        return utils.each(self.handlers, function(name, _handler) {
            //不合法的 name 直接忽略
            if (name == null || name == '*' || name[0] == '.') return;
            //--
            var exp = new RegExp(name);
            if (exp.test(context.request.url)) {
                return _handler;
            }
        });
    }()) || self.handlers[context.request.extname] || self.handlers["*"];
    return handler;
};

Server.prototype.loadFilters = function() {
    var self = this;
    self.filters = {};
    utils.each(self.configs.filters, function(name, path) {
        var Filter = require(path);
        self.filters[name] = new Filter(self);
    });
};

Server.prototype.matchFilters = function(context) {
    var self = this;
    var useFilters = [self.global];
    utils.each(self.filters, function(name, _filter) {
        //不合法的 name 直接忽略
        if (name == null || name == '*' || name[0] == '.') return;
        //--
        var exp = new RegExp(name);
        if (exp.test(context.request.url)) {
            useFilters.push(_filter);
        }
    });
    return new Filters(useFilters);
};

Server.prototype.isDeny = function(url) {
    var self = this;
    return utils.each(self.configs.denys, function(i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return true;
        }
    });
};

Server.prototype.handleRequest = function(context) {
    var self = this;
    //检查是否禁止访问的资源
    if (self.isDeny(context.request.withoutQueryStringURL)) {
        context.responseDeny();
        return;
    }
    //检查缓存
    var cache = self.cache[context.request.withoutQueryStringURL];
    if (cache) {
        context.responseContent(cache.content, cache.mime);
        return;
    }
    //交由符合的 handler 处理
    var handler = self.matchHandler(context);
    var dm = domain.create();
    dm.on('error', function(err) {
        context.responseError(err);
    });
    dm.run(function() {
        handler.handleRequest(context);
    });
};

//查找默认文档
Server.prototype.findDefaultFile = function(folder) {
    var self = this;
    return utils.each(self.configs.defaults, function(i, filename) {
        var defaultFile = path.resolve(folder, filename);
        if (fs.existsSync(defaultFile)) {
            return defaultFile;
        }
    });
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
    req.url = decodeURI(req.url || "").replace(/\.\./g, "");
    req.withoutQueryStringURL = req.url.split('?')[0].split('#')[0];
    req.queryString = (req.url.split('?')[1] || '').split('#')[0];
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
    if (req.physicalPathType === 'folder') {
        var defaultFile = self.findDefaultFile(req.physicalPath);
        if (defaultFile) {
            req._setPhysicalPath(defaultFile);
        }
    }
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
    req.sessionId = (req.cookie.get(SESSION_ID_NAME) || {}).value;
    if (!req.sessionId) {
        req.sessionId = utils.newGuid();
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
};

Server.prototype.createServer = function() {
    var self = this;
    self.httpServer = http.createServer(function(req, res) {
        var context = new Context(self, req, res);
        self.handleClientInfo(context);
        self.logger.log('来自 "' + req.clientInfo.ip + '" ' + req.method + ' 请求 "' + req.url + '"');
        self.handleRequestPath(context);
        self.setHeaders(context);
        self.handleCookie(context);
        self.handleSession(context);
        self.handleQueryString(context);
        //找到可用的 filter
        context.filters = self.matchFilters(context);
        context.filters.invoke('onRequestBegin', context, function() {
            //查找内容解析器
            var parser = self.matchParser(context);
            if (!parser) {
                context.responseError('未找到可用的内容解析器');
                return;
            }
            //解析内容
            parser.parse(context, function() {
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
    try {
        if (self.httpServer) {
            self.httpServer.listen(self.configs.port, function() {
                var filters = new Filters([self.global]);
                filters.invoke('onStart', self, function() {
                    return console.log('已在 "http://localhost:' + self.configs.port + '" 启动服务。');
                    if (callback) callback();
                });
            });
            return;
        } else {
            return console.log('没有创建 Server 实例');
        }
    } catch (ex) {
        return console.error(ex.message);
    }
};

//停止Server
Server.prototype.stop = function(callback) {
    var self = this;
    try {
        if (self.httpServer) {
            self.httpServer.close(function() {
                var filters = new Filters([self.global]);
                filters.invoke('onStop', self, function() {
                    return console.log('已在 "http://localhost:' + self.configs.port + '" 停止服务。');
                    if (callback) callback();
                });
            });
            return;
        } else {
            return console.log('没有创建 Server 实例');
        }
    } catch (ex) {
        return console.error(ex.message);
    }
};

Server.prototype.init = function(options) {
    var self = this;
    self.options.root = self.options.root || './';
    if (!fs.existsSync(self.options.root)) {
        return console.error("创建 Server 实例时发生异常，必需指定一个存在的根目录。");
    }
    self.loadPackageInfo();
    self.initConfigs();
    self.initLogger();
    self.initGlobal();
    self.loadParsers();
    self.loadFilters();
    self.loadHandlers();
    self.loadSessionProvider();
    self.loadResponsePages();
    self.createServer();
};

module.exports = Server;
/*end*/
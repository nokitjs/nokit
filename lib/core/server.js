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

var CONFIG_FILE = './web.json',
    PACKAGE_FILE = '../package.json',
    HEADER_MARK_NAME = 'X-Powered-By',
    SESSION_ID_NAME = '__session_id__';

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
    utils.each(systemConfigs.handlers, function(name, _path) {
        systemConfigs.handlers[name] = self.resolveSystemPath(_path);
    });
    utils.each(systemConfigs.responsePages, function(name, _path) {
        systemConfigs.responsePages[name] = self.resolveSystemPath(_path);
    });
    if (systemConfigs.session && systemConfigs.session.provider) {
        systemConfigs.session.provider = self.resolveSystemPath(systemConfigs.session.provider);
    }
    //应用配置 
    var appConfigFile = path.resolve(self.options.root, CONFIG_FILE);
    var appConfigs = utils.readJSONSync(appConfigFile) || {};
    utils.each(appConfigs.handlers, function(name, _path) {
        if (name === '*') {
            throw '不能配置 name 为 "*" 的 handler';
            return;
        };
        appConfigs.handlers[name] = self.resolveAppPath(_path);
    });
    utils.each(appConfigs.responsePages, function(name, _path) {
        appConfigs.responsePages[name] = self.resolveAppPath(_path);
    });
    if (appConfigs.session && appConfigs.session.provider) {
        appConfigs.session.provider = self.resolveAppPath(appConfigs.session.provider);
    }
    //合并
    self.configs = {};
    self.configs = utils.mix(self.configs, systemConfigs, true, null, 2, true);
    self.configs = utils.mix(self.configs, appConfigs, true, null, 2, true);
    self.configs = utils.mix(self.configs, self.options, true, null, 2, true);
    //
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
            if (name == null || name == '*' || name[0] == '.') return;
            var exp = new RegExp(name);
            if (exp.test(context.request.url)) {
                return _handler;
            }
        });
    }()) || self.handlers[context.request.extname] || self.handlers["*"];
    return handler;
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
        context.responseContent(cache.content, cache.mime, true);
        return;
    }
    //交由符合的 handler 处理
    var handler = self.matchHandler(context);
    var dm = domain.create();
    dm.on('error', function(err) {
        //console.log(err);
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
    req.url = decodeURI(req.url || "");
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

Server.prototype.handleRequestData = function(context) {
    var self = this;
    var req = context.request,
        res = context.response;
    req.queryData = qs.parse(req.queryString) || {};
    req.formData = qs.parse(req.postBuffer) || {};
    req.body = req.postBuffer;
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

Server.prototype.createServer = function() {
    var self = this;
    self.httpServer = http.createServer(function(req, res) {
        var context = new Context(self, req, res);
        self.handleRequestPath(context);
        self.setHeaders(context);
        self.handleCookie(context);
        self.handleSession(context);
        //接收数据handleSession
        req.postBuffer = ''; //这里的 Post Data 只处理表单，不关心文件上传
        req.addListener("data", function(chunk) {
            req.postBuffer += chunk;
        });
        //--
        req.addListener("end", function() {
            self.handleRequestData(context);
            self.handleRequest(context);
        });
    });
};

//启动Server
Server.prototype.start = function(callback) {
    var self = this;
    try {
        if (self.httpServer) {
            self.httpServer.listen(self.configs.port, function() {
                if (callback) callback();
                return console.log('已在 "http://localhost:' + self.configs.port + '" 启动服务。');
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
                return console.log('已在 "http://localhost:' + self.configs.port + '" 停止服务。');
                if (callback) callback();
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
    if (!self.options.root || !fs.existsSync(self.options.root)) {
        return console.error("创建 Server 实例时发生异常，必需指定一个存在的根目录。");
    }
    self.loadPackageInfo();
    self.initConfigs();
    self.loadHandlers();
    self.loadSessionProvider();
    self.loadResponsePages();
    self.createServer();
};

module.exports = Server;
/*end*/
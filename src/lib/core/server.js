var http = require('http');
var fs = require('fs');
var path = require('path');
var querystring = require("querystring");
var url = require("url");
var console = require("./console");
var utils = require("./utils");

var CONFIG_FILE = './web.json',
    HANDLERS_PATH = './handlers',
    STATICS_PATH = './statics',
    RESPONSE_PAGES_PATH = './templates';

//定义Server.
var Server = function(options) {
    var self = this;
    self.options = options || {};
    self.init(options);
};

Server.prototype.infiConfigs = function(callback) {
    var self = this;
    //公共配置
    var installPath = path.dirname(path.dirname(module.filename));
    var systemConfigFile = path.resolve(installPath, CONFIG_FILE);
    var systemConfigs = utils.readJSONSync(systemConfigFile);
    utils.each(systemConfigs.handlers, function(name, _path) {
        systemConfigs.handlers[name] = path.resolve(path.resolve(installPath, HANDLERS_PATH), _path);
    });
    utils.each(systemConfigs.responsePages, function(name, _path) {
        systemConfigs.responsePages[name] = path.resolve(path.resolve(installPath, RESPONSE_PAGES_PATH), _path);
    });
    //应用配置 
    var appConfigFile = path.resolve(self.options.root, CONFIG_FILE);
    var appConfigs = utils.readJSONSync(appConfigFile);
    utils.each(appConfigs.handlers, function(name, _path) {
        appConfigs.handlers[name] = path.resolve(self.options.root, _path);
    });
    utils.each(appConfigs.responsePages, function(name, _path) {
        appConfigs.responsePages[name] = path.resolve(self.options.root, _path);
    });
    //合并
    self.configs = {};
    self.configs = utils.mix(self.configs, systemConfigs, true, null, 2, true);
    self.configs = utils.mix(self.configs, appConfigs, true, null, 2, true);
    self.configs = utils.mix(self.configs, self.options, true, null, 2, true);
    //其它
    self.installPath = installPath;
    self.root = self.configs.root;
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

Server.prototype.handleRequest = function(req, res, error) {
    var self = this;
    var handler = self.handlers[req.extname] || self.handlers["*"];
    handler.handleRequest(req, res);
};

Server.prototype.responseError = function(req, res, errorMessage) {
    var self = this;
    res.writeHead(500, {
        'Content-Type': self.configs.mimeType['.html'],
        'url': req.url
    });
    var model = {
        errorMessage: errorMessage,
        server: self,
        request: req
    };
    res.end(self.responsePages["500"](model));
};

Server.prototype.responseNotFound = function(req, res) {
    var self = this;
    res.writeHead(404, {
        'Content-Type': self.configs.mimeType['.html'],
        'url': req.url
    });
    var model = {
        server: self,
        request: req
    };
    res.end(self.responsePages["404"](model));
};

Server.prototype.responseContent = function(req, res, content, mime) {
    var self = this;
    res.writeHead(200, {
        'Content-Type': mime || req.mime,
        'url': req.url
    });
    res.end(content);
};

Server.prototype.createServer = function() {
    var self = this;
    self.httpServer = http.createServer(function(req, res) {
        req.postData = ''; //这里的 Post Data 只处理表单，不关心文件上传
        req.url = decodeURI(req.url || "");
        req.withoutQueryStringURL = req.url.split('?')[0].split('#')[0];
        req.staticPath = path.resolve(self.configs.root, STATICS_PATH);
        req.physicalPath = path.normalize(req.staticPath + '/' + req.withoutQueryStringURL);
        req.extname = path.extname(req.physicalPath);
        req.mime = self.configs.mimeType[req.extname] || self.configs.mimeType["*"];
        req.addListener("data", function(postDataChunk) {
            req.postData += postDataChunk;
        });
        req.addListener("end", function() {
            req.postData = querystring.parse(req.postData);
            self.handleRequest(req, res);
        });
    });
};

//启动Server
Server.prototype.start = function(callback) {
    var self = this;
    try {
        self.httpServer.listen(self.configs.port, callback);
        console.log('已在 "' + self.configs.root + ":" + self.configs.port + '" 启动服务。');
    } catch (ex) {
        console.error(ex.message);
    }
};

//停止Server
Server.prototype.stop = function(callback) {
    var self = this;
    try {
        self.httpServer.close(callback);
        console.log('已在 "' + self.configs.root + ":" + self.configs.port + '" 停止服务。');
    } catch (ex) {
        console.error(ex.message);
    }
};

Server.prototype.init = function(options) {
    var self = this;
    if (!self.options.root) {
        return console.error("创建 Server 实例时发生异常，必需指定一个存在的根目录。");
    }
    self.infiConfigs();
    self.loadHandlers();
    self.loadResponsePages();
    self.createServer();
};

module.exports = Server;
/*end*/
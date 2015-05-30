var http = require('http');
var fs = require('fs');
var path = require('path');
var querystring = require("querystring");
var url = require("url");
var console = require("./console");
var utils = require("./utils");
var Context = require("./context");

var CONFIG_FILE = './web.json',
    PACKAGE_FILE = '../package.json';

//定义Server.
var Server = function(options) {
    var self = this;
    self.options = options || {};
    self.installPath = path.dirname(path.dirname(module.filename));
    self.init(options);
};

Server.prototype.loadPackageInfo = function() {
    var self = this;
    var packageFile = path.resolve(self.installPath, PACKAGE_FILE);
    self.packageInfo = utils.readJSONSync(packageFile);
};

Server.prototype.infiConfigs = function(callback) {
    var self = this;
    //公共配置
    var systemConfigFile = path.resolve(self.installPath, CONFIG_FILE);
    var systemConfigs = utils.readJSONSync(systemConfigFile);
    utils.each(systemConfigs.handlers, function(name, _path) {
        systemConfigs.handlers[name] = path.resolve(self.installPath, _path);
    });
    utils.each(systemConfigs.responsePages, function(name, _path) {
        systemConfigs.responsePages[name] = path.resolve(self.installPath, _path);
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

Server.prototype.handleRequest = function(context) {
    var self = this;
    var handler = self.matchHandler(context);
    handler.handleRequest(context);
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

Server.prototype.createServer = function() {
    var self = this;
    self.httpServer = http.createServer(function(req, res) {
        req.postData = ''; //这里的 Post Data 只处理表单，不关心文件上传
        req.url = decodeURI(req.url || "");
        req.withoutQueryStringURL = req.url.split('?')[0].split('#')[0];
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
        req.addListener("data", function(postDataChunk) {
            req.postData += postDataChunk;
        });
        req.addListener("end", function() {
            req.postData = querystring.parse(req.postData);
            self.handleRequest(new Context(self, req, res));
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
    self.loadPackageInfo();
    self.infiConfigs();
    self.loadHandlers();
    self.loadResponsePages();
    self.createServer();
};

module.exports = Server;
/*end*/
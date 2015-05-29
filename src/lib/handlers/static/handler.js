/**
 * 静态文件处理器
 */
var fs = require('fs');
var path = require('path');

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
};

//处理请求
Handler.prototype.handleRequest = function(req, res) {
    var self = this;
    try {
        self.handleFileSystem(req, res);
    } catch (ex) {
        self.server.responseError(req, res, ex.message);
    }
};

//处理文件系统
Handler.prototype.handleFileSystem = function(req, res) {
    var self = this;
    //处理物理文件
    fs.exists(req.physicalPath, function(exists) {
        if (exists) {
            fs.stat(req.physicalPath, function(err, stats) {
                if (stats.isDirectory()) {
                    var defaultFile = self.findDefaultFile(req.physicalPath);
                    if (defaultFile) {
                        req.physicalPath = defaultFile;
                        req.mime = self.configs.mimeType['.html'];
                        self.writeFile(req, res);
                    } else {
                        self.writeFolder(req, res);
                    }
                } else {
                    self.writeFile(req, res);
                }
            });
        } else {
            self.server.responseNotFound(req, res);
        }
    });
};

//查找默认文档
Handler.prototype.findDefaultFile = function(folder) {
    var self = this;
    var utils = self.server.require('./core/utils');
    return utils.each(self.server.configs.defaults, function(i, filename) {
        var defaultFile = path.resolve(folder, filename);
        if (fs.existsSync(defaultFile)) {
            return defaultFile;
        }
    });
};

//输出目录
Handler.prototype.writeFolder = function(req, res) {
    var self = this;
    fs.readdir(req.physicalPath, function(err, files) {
        if (err) {
            self.server.responseError(req, res, err);
            return;
        }
        var items = [];
        files.forEach(function(item) {
            var itemPath = path.normalize(req.physicalPath + '/' + item);
            var stats = fs.statSync(itemPath); //临时用同步方式
            items.push({
                name: item,
                type: stats.isDirectory() ? 'folder' : 'file'
            });
        });
        var model = {
            server: self,
            request: req,
            items: items
        };
        self.server.responseContent(req, res, self.server.responsePages['dir'](model), self.configs.mimeType['.html']);
    });
};

//输出静态文件
Handler.prototype.writeFile = function(req, res) {
    var self = this;
    fs.readFile(req.physicalPath, function(err, data) {
        if (err) {
            self.server.responseError(req, res, err);
        } else {
            self.server.responseContent(req, res, data);
        }
    });
};
/**
 * 静态文件处理器
 */
var fs = require('fs');
var path = require('path');

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
    self.utils = self.server.require('./core/utils');
};

//处理请求
Handler.prototype.handleRequest = function(context) {
    var self = this;
    try {
        self.handleFileSystem(context);
    } catch (ex) {
        context.responseError(ex.message);
    }
};

//查找默认文档
Handler.prototype.findDefaultFile = function(folder) {
    var self = this;
    return self.utils.each(self.configs.defaults, function(i, filename) {
        var defaultFile = path.resolve(folder, filename);
        if (fs.existsSync(defaultFile)) {
            return defaultFile;
        }
    });
};

//处理文件系统
Handler.prototype.handleFileSystem = function(context) {
    var self = this;
    //如果不存在物理文件
    if (!context.request.physicalPathExists) {
        context.responseNotFound();
        return;
    }
    //如果是目录
    if (context.request.physicalPathType == 'folder') {
        //如果禁止浏览目录
        if (!self.configs.displayDir) {
            context.responseNotFound();
            return;
        }
        //如果目录的 url 不是以 / 结尾，向浏览器发出 302 重定向，
        //否则会导致样式等相对路径错误。
        if (!(new RegExp('/$')).test(context.request.withoutQueryStringURL)) {
            self.correctFolder(context);
            return;
        }
        //查找默认文档
        var defaultFile = self.findDefaultFile(context.request.physicalPath);
        if (defaultFile) {
            self.handleDefaultFile(context, defaultFile);
        } else {
            self.writeFolder(context);
        }
    } else {
        //如果是文件
        self.writeFile(context);
    }
};

Handler.prototype.correctFolder = function(context) {
    var self = this;
    var url = context.request.url;
    if (url.indexOf('?') > -1) {
        var urlParts = url.split('?')
        context.redirect(urlParts[0] + "/?" + urlParts[1]);
    } else {
        context.redirect(url + "/");
    }
};

Handler.prototype.handleDefaultFile = function(context, defaultFile) {
    var self = this;
    context.request._setPhysicalPath(defaultFile);
    var url = context.request.url;
    if (url.indexOf('?') > -1) {
        var urlParts = url.split('?')
        context.request.url = urlParts[0] + defaultFile + "?" + urlParts[1];
    } else {
        context.request.url += defaultFile
    }
    self.transferRequest(context);
};

//输出目录
Handler.prototype.writeFolder = function(context) {
    var self = this;
    fs.readdir(context.request.physicalPath, function(err, files) {
        if (err) {
            context.responseError(err);
            return;
        }
        var items = [];
        files.forEach(function(item) {
            var itemPath = path.normalize(context.request.physicalPath + '/' + item);
            var stats = fs.statSync(itemPath); //临时用同步方式
            items.push({
                name: item,
                type: stats.isDirectory() ? 'folder' : 'file'
            });
        });
        var model = {
            server: self.server,
            handler: self,
            request: context.request,
            items: items
        };
        context.responseContent(self.server.responsePages['dir'](model), self.configs.mimeType['.html']);
    });
};

//输出静态文件
Handler.prototype.writeFile = function(context) {
    var self = this;
    fs.readFile(context.request.physicalPath, function(err, data) {
        if (err) {
            context.responseError(err);
        } else {
            context.responseContent(data);
        }
    });
};
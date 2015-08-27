/**
 * 静态文件处理器
 */
var fs = require('fs');
var path = require('path');

var ALLOWED_METHODS = ["GET"];

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
    self.configs.cache = self.configs.cache || {};
    self.utils = self.server.require('./core/utils');
    self.Task = self.server.require('./core/task');
};

//处理请求
Handler.prototype.handle = function(context) {
    var self = this;
    try {
        self.handleFileSystem(context);
    } catch (ex) {
        context.error(ex.message);
    }
};

//查找默认文档
Handler.prototype.findDefaultFile = function(folder) {
    var self = this;
    return self.utils.each(self.configs.defaults, function(i, filename) {
        var defaultFile = path.resolve(folder, filename);
        if (fs.existsSync(defaultFile)) {
            return filename;
        }
    });
};

//处理文件系统
Handler.prototype.handleFileSystem = function(context) {
    var self = this;
    context.request.physicalPathExists(function(exists) {
        //如果不存在物理文件
        if (!exists) {
            context.notFound();
            return;
        } else {
            //如果是目录
            context.request.physicalPathStat(function(stats) {
                if (stats.isDirectory()) {
                    //如果禁止浏览目录
                    if (!self.configs.displayDir) {
                        context.notFound();
                        return;
                    }
                    //如果目录的 url 不是以 / 结尾，向浏览器发出 302 重定向，
                    //否则会导致样式等相对路径错误。
                    if (!(new RegExp('/$')).test(context.request.withoutQueryStringURL)) {
                        self.correctFolder(context);
                        return;
                    }
                    //查找默认文档
                    var filename = self.findDefaultFile(context.request.physicalPath);
                    if (filename) {
                        self.handleDefaultFile(context, filename);
                    } else {
                        self.writeFolder(context);
                    }
                } else {
                    //如果是文件
                    self.writeFile(context);
                }
            });
        }
    });
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

Handler.prototype.handleDefaultFile = function(context, filename) {
    var self = this;
    //context.request.setPhysicalPath(context.request.physicalPath + '/' + filename);
    var url = context.request.url;
    if (url.indexOf('?') > -1) {
        var urlParts = url.split('?')
        context.request.setUrl(urlParts[0] + filename + "?" + urlParts[1]);
    } else {
        context.request.setUrl(context.request.url + filename);
    }
    /*
    satic handler 只有这里可以继续传递请求
    一般此 handler 为 ‘最后’ 的处理器不可再传递，因为极有可能造成循环传递
    */
    self.transfer(context);
};

//输出目录
Handler.prototype.writeFolder = function(context) {
    var self = this;
    // satic 只允许 get 请求 
    // method 的检查不能太早，因为还有机会 transfer 到其它 handler
    if (ALLOWED_METHODS.indexOf(context.request.method) < 0) {
        context.notAllowed();
        return;
    }
    fs.readdir(context.request.physicalPath, function(err, files) {
        if (err) {
            context.error(err);
            return;
        }
        var items = [];
        var task = self.Task.create();
        files.forEach(function(item) {
            var itemPath = path.normalize(context.request.physicalPath + '/' + item);
            task.add(function(done) {
                fs.stat(itemPath, function(err, stats) {
                    if (err) {
                        return context.error(err);
                    }
                    items.push({
                        name: item,
                        type: stats.isDirectory() ? 'folder' : 'file'
                    });
                    done();
                });
            });
        });
        task.end(function() {
            var model = {
                server: self.server,
                handler: self,
                request: context.request,
                items: items
            };
            context.template("explore", model, self.server.mime('.html'));
        });
    });
};

//输出静态文件
Handler.prototype.writeFile = function(context) {
    var self = this;
    // satic 只允许 get 请求
    // method 的检查不能太早，因为还有机会 transfer 到其它 handler
    if (ALLOWED_METHODS.indexOf(context.request.method) < 0) {
        context.notAllowed();
        return;
    }
    var filename = context.request.physicalPath;
    if (self.configs.cache.lastModified) {
        fs.stat(filename, function(err, stat) {
            if (err) {
                context.error(err);
                return;
            }
            var modifiedSince = context.request.headers['if-modified-since'];
            modifiedSince = modifiedSince ? new Date(modifiedSince) : null;
            var lastModified = stat.mtime;
            if (modifiedSince == null || modifiedSince < lastModified) {
                var fileReadStream = fs.createReadStream(filename);
                context.stream(fileReadStream, null, null, {
                    'Last-Modified': lastModified.toUTCString()
                });
            } else {
                context.noChange();
            }
        });
    } else {
        var fileReadStream = fs.createReadStream(filename);
        context.stream(fileReadStream);
    }
};
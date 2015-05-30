var fs = require("fs");
var path = require("path");

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
    self.utils = self.server.require('./core/utils');
    self.tp = self.server.require('./core/tp');
};

//处理请求
Handler.prototype.handleRequest = function(context) {
    var self = this;
    if (context.request.physicalPathExists) {
        var page = self.compilePage(context, context.request.physicalPath);
        var content = self.execPage(context, page);
        context.responseContent(content);
    } else {
        context.responseNotFound();
    }
};

Handler.prototype.compilePage = function(context, _path) {
    var self = this;
    var buffer = fs.readFileSync(_path);
    var page = self.tp.compile(buffer.toString(), {
        extend: self.createExtendObject(context)
    });
    return page;
};


Handler.prototype.resolvePath = function(context, _path) {
    var self = this;
    return path.resolve(path.dirname(context.request.physicalPath), _path);
};

Handler.prototype.createExtendObject = function(context) {
    var self = this;
    var extendObject = {
        "require": function(_path) {
            var $ = this;
            try {
                return require(_path);
            } catch (ex) {
                try {
                    var resolvePath = self.resolvePath(context, _path);
                    return require(resolvePath);
                } catch (ex) {
                    context.responseError('在 $.require 时 " ' + _path + ' " 没有找到');
                }
            }
        },
        "include": function(_path) {
            var $ = this;
            var resolvePath = self.resolvePath(context, _path);
            var page = self.compilePage(context, resolvePath);
            var content = self.execPage(context, page);
            $(content);
        }
    };
    self.utils.copy(self.utils, extendObject);
    return extendObject;
};

Handler.prototype.execPage = function(context, page) {
    var self = this;
    var model = {
        server: self.server,
        handler: self,
        context: context,
        request: context.request,
        response: context.response
    };
    return page(model);
};
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
        fs.readFile(context.request.physicalPath, function(err, buffer) {
            if (err) {
                context.responseError(err);
            } else {
                var page = self.tp.compile(buffer.toString(), {
                    extend: self.createExtendObject(context)
                });
                self.execPage(context, page);
            }
        });
    } else {
        context.responseNotFound();
    }
};

Handler.prototype.createExtendObject = function(context) {
    var self = this;
    var extendObject = {};
    self.utils.copy(self.utils, extendObject);
    extendObject.require = function(_path) {
        try {
            return require(_path);
        } catch (ex) {
            try {
                var resolvePath = path.resolve(path.dirname(context.request.physicalPath), _path);
                return require(resolvePath);
            } catch (ex) {
                context.responseError('在 $.require 时 " ' + _path + ' " 没有找到');
            }
        }
    };
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
    var content = page(model);
    context.responseContent(content);
};
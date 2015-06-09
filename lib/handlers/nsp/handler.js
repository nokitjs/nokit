var fs = require("fs");
var path = require("path");

var pagine = null;

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
    //检查并创建视图引擎
    pagine = pagine || ((function() {
        var Pagine = self.server.require('./core/pagine');
        return new Pagine();
    })());
};

//处理请求
Handler.prototype.handleRequest = function(context) {
    var self = this;
    if (context.request.physicalPathExists) {
        var model = {
            "server": self.server,
            "handler": self,
            "context": context,
            "request": context.request,
            "response": context.response
        };
        var content = pagine.execFile(context.request.physicalPath, model);
        context.responseContent(content);
    } else {
        context.responseNotFound();
    }
};
var fs = require("fs");
var path = require("path");

var pagine = null;
var PresenterCache = {};

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
    //--
    self.utils = self.server.require('./core/utils');
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
        var templatePath = context.request.physicalPath;
        var presenterPath = templatePath + '.js';
        if (PresenterCache[presenterPath]) {
            self.handleByPresenter(context, PresenterCache[presenterPath], templatePath, model);
            return;
        }
        fs.exists(presenterPath, function(exists) {
            if (exists) {
                var Presenter = require(presenterPath);
                PresenterCache[presenterPath] = Presenter;
                self.handleByPresenter(context, Presenter, templatePath, model);
            } else {
                var content = pagine.execFile(templatePath, model);
                context.responseContent(content);
            }
        });
    } else {
        context.responseNotFound();
    }
};

Handler.prototype.handleByPresenter = function(context, Presenter, templatePath, model) {
    var self = this;
    var presenter = new Presenter(self.server);
    self.utils.copy(model, presenter);
    presenter.render = function() {
        var content = pagine.execFile(templatePath, presenter);
        context.responseContent(content);
    };
    //调用方法
    var _method = context.data('__method') || 'load';
    if (presenter[_method]) {
        presenter[_method](context);
    }
};
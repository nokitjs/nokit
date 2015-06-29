var fs = require("fs");
var path = require("path");
var cheerio = require('cheerio');

var SERVER_ID_NAME = "nsp-id";
var HIDDEN_METHOD = "__method";
var HIDDEN_STATE = "__state";

var pagine = null;
var PresenterCache = {};

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
    //--
    self.utils = self.server.require('./core/utils');
    self.console = self.server.require('./core/console');
    self.base64 = self.server.require("./core/base64");
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
                self.responseContent(context, null, content);
            }
        });
    } else {
        context.responseNotFound();
    }
};

Handler.prototype.handlePostBack = function(context, presenter) {
    var self = this;
    presenter.el = {};
    //
    var stateText = context.data(HIDDEN_STATE);
    if (stateText) {
        context.isPostBack = true;
        var stateContent = self.base64.decode(stateText);
        var $ = cheerio.load(stateContent);
        var stateElements = $("[" + SERVER_ID_NAME + "]");
        self.utils.each(stateElements, function(i, _stateElement) {
            var stateElement = $(_stateElement);
            var serverId = stateElement.attr(SERVER_ID_NAME);
            presenter.el[serverId] = stateElement;
            presenter[serverId] = presenter[serverId] || presenter.el[serverId];
        });
    } else {
        context.isPostBack = false;
        //TODO: load 不能访问服务端元素，如果想访问，需要模块文件中，提取出来。
    }
};

Handler.prototype.handleByPresenter = function(context, Presenter, templatePath, model) {
    var self = this;
    var presenter = new Presenter(self.server);
    self.utils.copy(model, presenter);
    //处理视图状态
    self.handlePostBack(context, presenter);
    //页面呈现方法
    presenter.render = function() {
        var content = pagine.execFile(templatePath, presenter);
        self.responseContent(context, presenter, content);
    };
    //调用 init 方法
    if (presenter["init"]) {
        presenter["init"](context);
    }
    //调用绑定方法
    var _method = context.data(HIDDEN_METHOD) || 'load';
    if (presenter[_method]) {
        presenter[_method](context);
    }
};

Handler.prototype.responseContent = function(context, presenter, content) {
    var self = this;
    if (presenter) {
        var $ = cheerio.load(content);
        var head = $('head');
        if (head && head.append) {
            head.append('<script src="/__res__/nsp-client.js"></script>');
        }
        self.utils.each(presenter.el, function(serverId, stateElement) {
            if (stateElement == null || !stateElement[0] || stateElement[0].parent != null) {
                return;
            }
            var element = $('[' + SERVER_ID_NAME + '="' + serverId + '"]');
            if (element && stateElement) {
                element.replaceWith(stateElement);
            }
        });
        context.responseContent($.html());
    } else {
        context.responseContent(content);
    }
};

/*end*/
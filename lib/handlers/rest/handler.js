var fs = require("fs");
var path = require("path");

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
    self.configs.rest = self.configs.rest || {};
    self.utils = self.server.utils;
    //初始化 router
    self.router = new server.Router(self.configs.rest.routes);
    //初始化 controller 存放根路径
    self.paths = {};
    self.paths.controller = self.server.resolvePath(self.configs.rest.path || './');
};

//处理请求
Handler.prototype.handle = function(context) {
    var self = this;
    //查找路由
    var route = self.router.get(context.request.withoutQueryStringURL)[0];
    //如果找不到匹配路由，转交到默认处理器
    if (!route) {
        self.next(context);
        return;
    }
    //扩展 context
    context.route = route;
    //控制器处理
    var controllerFile = self.server.resolvePath(route.controller, self.paths.controller);
    var Controller = require(controllerFile);
    var controller = new Controller(context);
    var httpMethod = context.request.method.toLowerCase();
    if (!controller[httpMethod]) {
        context.notAllowed();
        return;
    }
    context.shouldCompress = self.configs.rest.compress;
    context.shouldCache = self.configs.rest.cache;
    context.httpMethod = httpMethod;
    context.controller = controller;
    controller.context = context;
    controller.session = context.session;
    controller.server = context.server;
    controller.response = context.response;
    controller.request = context.request;
    controller.route = context.route;
    controller.locale = context.locale;
    //输出响应方法
    controller.send = controller.write = function(result) {
        if (context.parser && context.parser.send) {
            context.parser.send(context, result);
        } else {
            context.send(JSON.stringify(result), self.server.mime('.json'));
        }
    };
    controller.ready = function() {
        //防止重复调用开始
        if (controller.__ready_called) {
            return;
        }
        controller.__ready_called = true;
        //防止重复调用结束
        //调用方法
        controller[httpMethod]();
    };
    //--
    context.filterInvoker.invoke('onRestHandle', context, function(err) {
        if (err) {
            return context.error(err);
        }
        //调用 init 方法
        if (controller.init) {
            controller.init(controller.ready);
        } else {
            controller.ready();
        }
    });
};
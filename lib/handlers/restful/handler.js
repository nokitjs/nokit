var fs = require("fs");
var path = require("path");

var Handler = module.exports = function (server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
    self.configs.restful = self.configs.restful || {};
    self.utils = self.server.utils;
    //初始化 router
    self.router = new server.Router(self.configs.restful.routes);
    //初始化 controller 存放根路径
    self.paths = {};
    self.paths.controller = self.server.resolvePath(self.configs.restful.path || './');
};

//处理请求
Handler.prototype.handle = function (context) {
    var self = this;
    //console.log('请求方法：' + context.request.method);
    var route = self.router.get(context.request.withoutQueryStringURL);
    //如果找不到匹配路由，转交到默认处理器
    if (!route) {
        self.next(context);
        return;
    }
    //扩展 context
    context.route = route;
    context.routeData = route.data;
    //控制器处理
    var controllerFile = path.resolve(self.paths.controller, route.target);
    var Controller = require(controllerFile);
    var controller = new Controller(context);
    var httpMethod = context.request.method.toLowerCase();
    if (!controller[httpMethod]) {
        context.notAllowed();
        return;
    }
    controller.context = context;
    //输出响应方法
    controller.put = controller.out = function (result) {
        context.canCompress = self.configs.restful.compress;
        if (context.parser && context.parser.content) {
            context.parser.content(context, result);
        } else {
            context.content(JSON.stringify(result), self.server.mime('.json'));
        }
    };
    controller.ready = function () {
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
    context.filterInvoker.invoke('onRestHandle', context, function () {
        //调用 init 方法
        if (controller.init) {
            controller.init(controller.ready);
        } else {
            controller.ready();
        }
    });
};
var fs = require("fs");
var path = require("path");

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
    self.route = self.server.require('./core/route');
    //console.log(self.route);
    self.utils = self.server.require('./core/utils');
    self.utils.each(self.configs.routes, function(i, route) {
        self.route.addRoute(route);
    });
};

//处理请求
Handler.prototype.handleRequest = function(context) {
    var self = this;
    //console.log('请求方法：' + context.request.method);
    var route = self.route.getRoute(context.request.url);
    //如果找不到匹配路由，转交到默认处理器
    if (!route) {
        self.server.handlers['*'].handleRequest(context);
        return;
    }
    //路由处理
    context.route = route;
    context.routeData = route.routeData;
    var Controller = require(self.server.resolveAppPath(route.target));
    var controller = new Controller(context);
    controller.context = context;
    var httpMethod = context.request.method.toLowerCase();
    if (!controller[httpMethod]) {
        context.responseError('没有定义方法 "' + httpMethod + '"');
        return;
    }
    controller[httpMethod](function(result) {
        context.responseContent(JSON.stringify(result), "text/json");
    });
};
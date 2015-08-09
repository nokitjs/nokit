 var fs = require("fs");
 var path = require("path");

 var routing = null;

 var Handler = module.exports = function(server) {
     var self = this;
     self.server = server;
     self.configs = self.server.configs;
     self.configs.restful = self.configs.restful || {};
     self.utils = self.server.require('./core/utils');
     //检查并初始化 routing
     routing = routing || ((function() {
         var Routing = self.server.require('./core/routing');
         return new Routing(self.configs.restful.routes);
     })());
     //初始化 controller 存放根路径
     self.paths = {};
     self.paths.controller = self.server.resolveAppPath(self.configs.restful.path || './');
 };

 //处理请求
 Handler.prototype.handleRequest = function(context) {
     var self = this;
     //console.log('请求方法：' + context.request.method);
     var route = routing.get(context.request.url);
     //如果找不到匹配路由，转交到默认处理器
     if (!route) {
         self.transferRequest(context);
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
         context.responseError('没有定义方法 "' + httpMethod + '"');
         return;
     }
     controller.context = context;
     controller.put = controller.out = function(result) {
         context.canCompress = self.configs.restful.compress;
         if (context.parser && context.parser.responeContent) {
             context.parser.responeContent(content, result);
         } else {
             context.responseContent(JSON.stringify(result), "text/json");
         }
     };
     //调用方法
     controller[httpMethod]();
 };
/**
 * 定义 ExampleHandler
 **/
var ExampleHandler = module.exports = function() { };

/**
 * 请求处理方法
 **/
ExampleHandler.prototype.handle = function() {
  var self = this;
  self.context.response.setHeader('Content-Type', 'text/html');
  self.context.send("nsh");
};
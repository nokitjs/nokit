/**
 * 定义 ExampleHandler
 **/
var ExampleHandler = nokit.define({

  /**
   * 请求处理方法
   **/
  handle: function() {
    var self = this;
    self.context.response.setHeader('Content-Type', 'text/html');
    self.context.send("Hello NSH!");
  }

});

module.exports = ExampleHandler;
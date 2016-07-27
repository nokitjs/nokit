/**
 * 定义 ExampleHandler
 **/
const ExampleHandler = nokit.define({

  /**
   * 请求处理方法
   **/
  handle: function () {
    this.context.response.setHeader('Content-Type', 'text/html');
    this.context.send("Hello NSH!");
  }

});

module.exports = ExampleHandler;
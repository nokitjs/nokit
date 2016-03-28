/**
 * 定义 HelloController
 **/
var HelloController = nokit.define({

  /**
   * post 处理方法
   **/
  post: function() {
    var self = this;
    self.send({
      "status": "success",
      "message": "Hello " + self.context.params["name"] + "!"
    });
  },

  /**
   * get 处理方法
   **/
  get: function() {
    var self = this;
    self.send({
      "status": "success",
      "message": "Hello " + self.context.params["name"] + "!"
    });
  },

  /**
   * put 处理方法
   **/
  put: function() {
    var self = this;
    self.send({
      "status": "success",
      "message": "Hello " + self.context.params["name"] + "!"
    });
  }

});

module.exports = HelloController;
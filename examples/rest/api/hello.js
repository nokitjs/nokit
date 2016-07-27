/**
 * 定义 HelloController
 **/
const HelloController = nokit.define({

  /**
   * post 处理方法
   **/
  post: function () {
    this.send({
      "status": "success",
      "message": "Hello " + this.context.params["name"] + "!"
    });
  },

  /**
   * get 处理方法
   **/
  get: function () {
    this.send({
      "status": "success",
      "message": "Hello " + this.context.params["name"] + "!"
    });
  },

  /**
   * put 处理方法
   **/
  put: function () {
    this.send({
      "status": "success",
      "message": "Hello " + this.context.params["name"] + "!"
    });
  }

});

module.exports = HelloController;
/**
 * 定义 HomeController
 **/
const HomeController = nokit.define({

  /**
   * 初始化方法，每次请求都会先执行 init 方法
   **/
  init: function () {
    this.ready();
  },

  /**
   * 默认 action
   **/
  index: function () {
    this.render("home", {
      "name": "MVC"
    });
  }

});

module.exports = HomeController;
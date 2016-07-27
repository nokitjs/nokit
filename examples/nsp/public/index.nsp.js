/**
 * 定义 IndexPresenter
 **/
const IndexPresenter = nokit.define({

  /**
   * 初始化 IndexPresenter
   **/
  init: function () {
    this.name = 'NSP';
    this.ready();
  },

  /**
   * load 事件处理方法
   **/
  load: function () {
    this.render();
  },

  /**
   * 事件方法，可以绑定到页面中的 html 控件
   **/
  test: function () {
    this.render();
  }

});

module.exports = IndexPresenter;
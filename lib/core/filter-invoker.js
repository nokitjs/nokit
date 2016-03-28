var Task = require('./task');
var utils = require('./utils');
var console = require('./console');

var NOOP_CALLBACK = function() { };

/**
 * 定义 FilterInvoker 类
 **/
var FilterInvoker = function(filterArray, errorHandler) {
  var self = this;
  self.errorHandler = errorHandler || console.error.bind(console);
  self.invokedMethods = [];
  self.serialFilterArray = [];
  self.parallelFilterArray = [];
  utils.each(filterArray, function(i, filter) {
    if (filter.parallel) {
      self.parallelFilterArray.push(filter);
    } else {
      self.serialFilterArray.push(filter);
    }
  });
};

/**
 * 调用 filterArray
 **/
FilterInvoker.prototype.invoke = function(method, args, callback) {
  var self = this;
  callback = callback || NOOP_CALLBACK;
  //检查是否可以调用
  if (self.invokedMethods.indexOf(method) > -1) {
    return callback();
  }
  self.invokedMethods.push(method);
  //创建并行队列
  var parallelTask = Task.create();
  utils.each(self.parallelFilterArray, function(i, filter) {
    if (filter && filter[method]) {
      parallelTask.add(function(done) {
        utils.checkPromise(filter[method](args, done), self.errorHandler);
      });
    }
  });
  //创建串行队列
  var serialTask = Task.create();
  utils.each(self.serialFilterArray, function(i, filter) {
    if (filter && filter[method]) {
      serialTask.add(function(done) {
        utils.checkPromise(filter[method](args, done), self.errorHandler);
      });
    }
  });
  //调用队列
  if (self.parallelFilterArray.length > 0 &&
    self.serialFilterArray.length > 0) {
    //将 "并行 filter" 添加到 "普通 filter" 的任务结尾
    serialTask.add(function(done) {
      parallelTask.end(done);
    });
    serialTask.seq(callback);
  } else if (self.parallelFilterArray.length > 0) {
    //用 end 执行 "并行 filter"
    parallelTask.end(callback);
  } else if (self.serialFilterArray.length > 0) {
    //用 seq 执行 "普通 filter"
    serialTask.seq(callback);
  } else {
    callback();
  }
};

module.exports = FilterInvoker;
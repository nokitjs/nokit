/**
 * Task 模块，提供基础的任务功能;
 * @class Task
 * @static
 * @module mokit
 */

var utils = require("./utils");

function Task(fns) {
  var self = this;
  self._list = [];
  self.reset();
  self._addMult(fns);
};

Task.prototype.reset = function() {
  var self = this;
  self._started = 0;
  self._finished = 0;
  self._status = 0;
  self.result = {};
  self.error = null;
  self._callbacks = [];
};

Task.prototype._addMult = function(fns) {
  var self = this;
  utils.each(fns, function(key, fn) {
    self._addOne(key, fn);
  });
  return self;
};

Task.prototype._addOne = function(name, fn) {
  var self = this;
  if (!name && !fn) return this;
  if (name && !fn) {
    fn = name;
    name = self._list.length;
  }
  self._list.push({
    "name": name,
    "func": fn
  });
  self.reset();
  return self;
};

/**
 * 向当前对象添加任务 function
 * @method add
 * @param function 或 function 数组，function 可以接收一个 done 参数，用以通知当前任务完成
 * @return {Task} 当前队列实例
 * @static
 */
Task.prototype.add = function(a, b) {
  var self = this;
  if (utils.isString(a) || utils.isFunction(a)) {
    return self._addOne(a, b);
  } else {
    return self._addMult(a);
  }
};

/**
 * 在完一个任务项时调用
 */
Task.prototype._execEnd = function(isSeq) {
  var self = this;
  if (self._status == 2) return;
  self._finished++;
  if (self._finished >= self._list.length) {
    self._status = 2;
    //如果执行完成
    utils.each(self._callbacks, function(i, callback) {
      callback(self.error, self.result);
    });
  } else if (isSeq && this._started < self._list.length) {
    self._execBegin(isSeq);
  }
};

/**
 * 启动一个任务项
 */
Task.prototype._execBegin = function(isSeq) {
  var self = this;
  if (self._status == 2) return;
  self._status == 1;
  var task = self._list[self._started];
  self._started++;
  task.func(function(err, rs) {
    self.error = self.error || err;
    self.result[task.name] = rs;
    self._execEnd(isSeq);
  });
  //如果是并发执行
  if (!isSeq && this._started < self._list.length) {
    self._execBegin(isSeq);
  }
  return self;
};

/**
 * 并行执行当前对列
 * @method end
 * @param 完成时的回调
 * @return {Task} 当前队列实例
 * @static
 */
Task.prototype.end = function(callback, isSeq) {
  var self = this;
  if (!utils.isFunction(callback)) {
    callback = function() { };
  }
  if (self._list.length < 1) {
    return callback();
  }
  switch (self._status) {
    case 0:
      self._callbacks.push(callback);
      self._execBegin(isSeq);
      break;
    case 1:
      self._callbacks.push(callback);
      break;
    case 2:
    default:
      callback(self.error, self.result);
      break;
  }
  return self;
};

/**
 * 顺序执行当前对列
 * @method seq
 * @param 完成时的回调
 * @return {Task} 当前队列实例
 * @static
 */
Task.prototype.seq = function(callback) {
  return this.end(callback, true);
};

/**
 * 创建一个任务队列
 * @method create
 * @param 任务 function 或 function 数组，可以省略参数创建一个空队列，
 *        function 可以接收一个 done 参数，用以通知当前任务完成。
 * @return {Task} 新队列实例
 * @static
 */
Task.create = function(tasks) {
  return new Task(tasks);
};

module.exports = Task;
/*end*/
/**
 * 全局应用程序类
 **/
const Global = function() { };

/**
 * 在 server 启动时
 **/
Global.prototype.onStart = function(server, done) {
  done();
};

/**
 * 在 server 停止时
 **/
Global.prototype.onStop = function(server, done) {
  done();
};

/**
 * 在请求发生异常时
 **/
Global.prototype.onError = function(context, done) {
  done();
};

/**
 * 在请求到达时
 **/
Global.prototype.onRequest = function(context, done) {
  done();
};

/**
 * 在收到请求数据时
 **/
Global.prototype.onReceived = function(context, done) {
  done();
};

/**
 * 在发送响应时
 **/
Global.prototype.onResponse = function(context, done) {
  done();
};

/**
 * export
 **/
module.exports = Global;
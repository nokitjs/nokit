var nokit = require("../");
var env = nokit.env;
var utils = nokit.utils;
var exitCode = nokit.exitCode;
var domain = require("domain");
var cluster = require("cluster");
var self = exports;

var EXIT_DELAY = 1000;

/**
 * 发送一个消息
 **/
self.sendMsg = function(msg) {
  msg = msg || {};
  process.send(msg);
  //记录日志
  if (!self.server || !self.server.logger) {
    return;
  }
  var msgText = msg.text + " #" + process.pid;
  if (msg.state) {
    self.server.logger.log(msgText, true);
  } else {
    self.server.logger.error(msgText, true);
  };
};

/**
 * 发送错误
 **/
self.sendError = function(err) {
  self.sendMsg({
    state: false,
    text: err.message + env.EOL + err.stack
  });
};

/**
 * 异常处理函数
 **/
self.errorHandler = function(err) {
  //如果在启动时存在异常
  self.sendError(err);
  //结束工作进程自已
  setTimeout(function() {
    process.exit(exitCode.WORKER_START_ERR);
  }, EXIT_DELAY);
};

/**
 * 初始化
 **/
self.init = function(options, cml) {
  process.on('uncaughtException', self.errorHandler);
  //启动 server
  self.server = new nokit.Server(options);
  self.server.start(function(err, success) {
    if (err) {
      self.errorHandler(err);
    } else {
      /**
       * 启动成功后，移除 error listener
       * 确保所有未处理异常由 nokit core 处理
       **/
      process.removeListener("uncaughtException", self.errorHandler);
      //向父进程发送 server.configs
      self.sendMsg({
        state: true,
        configs: self.server.configs,
        text: success || 'Application has been started'
      });
    }
  });
};
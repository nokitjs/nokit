/* global __dirname */
/* global process */
var isWin = process.platform === 'win32';
var child_process = require('child_process');
var path = require("path");
var nokit = require("../");
var processLog = require('./process-log');
var utils = nokit.utils;
var base64 = nokit.base64;
var console = nokit.console;
//var _debugger = require('../tool/debugger');
var spawn = child_process.spawn;
var exec = child_process.exec;

var engineName = path.basename(process.argv[0] || 'node').split('.')[0];
var win32EngineName = path.normalize(__dirname + '/shim/win32/' + engineName + '.vbs ');

var self = exports;

//cli进程延迟存活时间
self.isWin = isWin;

/**
 * 结束一个进程
 **/
self.kill = function (pid) {
  try {
    process.kill(pid);
  } catch (ex) { }
};

/**
 * 启动一个进程
 **/
self.start = function (args) {
  var child = null;
  if (isWin) {
    child = exec(win32EngineName + ' ' + args.join(' '), {
      //子进程将不随父进程结束而结束
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore']
    });
  } else {
    child = spawn(engineName, args, {
      //子进程将不随父进程结束而结束
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore']
    });
  }
  if (child) {
    //父进程将不等待子进程结束
    child.unref();
  }
  return child;
};

/**
 * 结束一个 app 进程
 **/
self.killApp = function (nameOrPid) {
  var log = processLog.get(nameOrPid);
  this.kill(log.pid);
  log.status = false;
  processLog.save(log);
};

/**
 * 停止并删除一个 app 进程
 **/
self.deleteApp = function (nameOrPid) {
  self.killApp(nameOrPid);
  processLog.remove(nameOrPid);
};

/**
 * 结束所有 app 进程
 **/
self.killAllApp = function () {
  var logArray = processLog.readArray();
  for (var i in logArray) {
    var log = logArray[i];
    this.killApp(log.pid);
  }
};

/**
 * 结束并删除所有 app 进程
 **/
self.deleteAllApp = function () {
  self.killAllApp();
  processLog.clear();
};

/**
 * 编码启动信息
 **/
var endcodeStartInfo = function (startInfo) {
  return base64.encode(JSON.stringify(startInfo || []));
};

/**
 * 解码启动信息
 **/
var dedcodeStartInfo = function (startInfo) {
  return JSON.parse(base64.decode(startInfo));
};

/**
 * 启动一个 app
 **/
self.startAppByInfo = function (startInfo) {
  //将启动信息加入到自身，用于重启
  startInfo.push('-start-info:' + endcodeStartInfo(startInfo));
  this.start(startInfo);
};

/**
 * 启动一个 app
 **/
self.startApp = function (log) {
  self.startAppByInfo(dedcodeStartInfo(log.startInfo));
};

/**
 * 重启一个 app
 **/
self.restartApp = function (nameOrPid) {
  var log = processLog.get(nameOrPid);
  if (!log) return;
  this.killApp(nameOrPid);
  this.startApp(log);
};

/**
 * 重启所有 app
 **/
self.restartAllApp = function () {
  var logArray = processLog.readArray();
  this.killAllApp();
  for (var i in logArray) {
    var log = logArray[i];
    this.startApp(log);
  }
};
const isWin = process.platform === 'win32';
const child_process = require('child_process');
const path = require("path");
const nokit = require("../");
const processLog = require('./process-log');
const utils = nokit.utils;
const base64 = nokit.base64;
const console = nokit.console;
//var _debugger = require('../tool/debugger');
const spawn = child_process.spawn;
const exec = child_process.exec;

const engineName = path.basename(process.argv[0] || 'node').split('.')[0];
const win32EngineName = path.normalize(__dirname + '/shim/win32/' + engineName + '.vbs ');

const self = exports;

//cli进程延迟存活时间
self.isWin = isWin;

/**
 * 结束一个进程
 **/
self.kill = function (pid) {
  try {
    process.kill(pid);
  } catch (err) { }
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
 * 启动一个 app
 **/
self.startApp = function (params) {
  var args = [
    params.nodeOptions,
    params.main,
    base64.encode(JSON.stringify(params))
  ].filter(function (item) {
    return !utils.isNull(item);
  });
  self.start(args);
};

/**
 * 重启一个 app
 **/
self.restartApp = function (nameOrPid) {
  var log = processLog.get(nameOrPid);
  if (!log) return;
  this.deleteApp(nameOrPid);
  this.startApp(log.params);
};

/**
 * 重启所有 app
 **/
self.restartAllApp = function () {
  var logArray = processLog.readArray();
  this.deleteAllApp();
  for (var i in logArray) {
    var log = logArray[i];
    this.startApp(log.params);
  }
};
#!/usr/bin/env node

/* global __dirname */
/* global process */

var nokit = require("../");
var path = require("path");
var fs = require("fs");
var domain = require("domain");
var Notifier = require('./notifier');
var processLog = require('./process-log');
var processMgr = require('./process-mgr');
var CmdLine = require('cmdline');
var autoStarter = require('./auto-starter');
var utils = nokit.utils;
var pkg = nokit.pkg;
var console = nokit.console;
var env = nokit.env;
//var _debugger = require('../tool/debugger');

//工作目录
var cwd = process.cwd();

/**
 * 输出帮助信息
 **/
function printInfo(versionOnly) {
  console.log(pkg.displayName + " " + pkg.version + env.EOL, true);
  if (!versionOnly) {
    console.log(" 1) nokit create    [name] [mvc|nsp|rest] [folder]", true);
    console.log(" 2) nokit start     [port] [root] [-env:<name>] [-cluster[:num]] [-watch[:.ext,...]] [node-opts]", true);
    console.log(" 3) nokit stop      [pid|all]", true);
    console.log(" 4) nokit restart   [pid|all]", true);
    console.log(" 5) nokit list      (no args)", true);
    console.log(" 6) nokit autostart [on|off] [-uid:[domain\\]user [-pwd:password]]" + env.EOL, true);
  }
}

var dm = domain.create();
dm.on('error', function(err) {
  console.error(err.message + env.EOL + err.stack);
});

dm.run(function() {

  var notifier = new Notifier();

  var cml = new CmdLine({
    commandEnabled: true
  });

  switch (cml.command) {
    case "":
      printInfo(cml.options.has('-v'));
      break;
    case "?":
    case "help":
      printInfo();
      break;
    case "create":
      console.log("Creating...");
      //处理参数
      var appName = cml.args[0] || 'nokit-app';
      var appType = cml.args[1] || 'mvc';
      var dstPath = cml.args[2] || "./";
      //处理路径
      var dstFullPath = path.resolve(cwd, path.normalize(dstPath + '/' + appName));
      var srcFullPath = path.resolve(__dirname, path.normalize('../examples/' + appType));
      //检查目标路径是否已存在
      if (fs.existsSync(dstFullPath)) {
        console.error('Create failure, directory "' + dstFullPath + '" already exists');
      } else {
        //复制应用模板
        nokit.utils.copyDir(srcFullPath, dstFullPath);
        console.log('In the "' + dstFullPath + '" has been created');
      }
      break;
    case "start":
      console.log("Starting...");
      notifier.waiting(1);
      var startInfo = [];
      //处理调式参数
      //因为 master 使用 --debug 指定的端口，而 worker 的 debug port 则会每个 +1
      //所以这里，把 --debug 的端口 -1 作为 master 的 port 
      //这样第一个 worker 的端口就是 --debug 指定的端口了，后续 worker 会每个 +1
      var debugPort = null;
      if (cml.options.has('--debug')) {
        debugPort = parseInt(cml.options.getValue('--debug') || 5858) - 1;
        cml.options.setValue('--debug', debugPort);
      }
      if (cml.options.has('--debug-brk')) {
        debugPort = parseInt(cml.options.getValue('--debug-brk') || 5858) - 1;
        cml.options.setValue('--debug-brk', debugPort);
      }
      //添加 node 控制选项 
      var nodeOptions = cml.options.getNodeOptions();
      nodeOptions.forEach(function(item) {
        startInfo.push(item);
      });
      //添加入口程序
      var appFile = path.normalize(__dirname + '/app.js');
      startInfo.push(appFile);
      //添加监听端口
      var port = cml.args[0] || 0;
      startInfo.push(port);
      //添加应用根目录
      var root = path.resolve(cwd, path.normalize(cml.args[1] || './'));
      startInfo.push(root);
      //添加控制选项
      cml.options.forEach(function(item) {
        startInfo.push(item);
      });
      //console.log("startInfo: " + startInfo);
      //请求启动
      processMgr.startApp(startInfo);
      break;
    case "stop":
      var pid = cml.args[0];
      if (!pid || pid == 'all') {
        processMgr.killAllApp();
        console.log("All application has stopped");
      } else {
        processMgr.killApp(pid);
        console.log("Stopped specified application: " + pid);
      }
      break;
    case "restart":
      var processCount = processLog.readArray().length;
      if (processCount < 1) {
        console.log("No application has been started");
        return;
      }
      console.log("Restarting...");
      notifier.waiting(processCount);
      var pid = cml.args[0];
      if (!pid || pid == 'all') {
        processMgr.restartAllApp();
      } else {
        processMgr.restartApp(pid);
      }
      break;
    case "list":
      var logArray = processLog.toPrintArray();
      if (logArray && logArray.length > 0) {
        console.log('Launched applications:' + env.EOL);
        console.table(logArray);
      } else {
        console.log('No application has been started');
      }
      break;
    case "autostart":
      var state = (cml.args[0] || 'on').toLowerCase();
      if (state != 'on' && state != 'off') {
        console.log('Unrecognizable parameters "' + cml.args[0] + '"');
      } else {
        console.log(autoStarter.set(state, {
          uid: cml.options.getValue('-uid'),
          pwd: cml.options.getValue('-pwd')
        }));
      }
      break;
    default:
      console.error('Unrecognizable command "' + cml.command + '"');
  }

});
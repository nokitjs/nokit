#!/usr/bin/env node

const nokit = require("../");
const path = require("path");
const fs = require("fs");
const domain = require("domain");
const Notifier = require('./notifier');
const processLog = require('./process-log');
const processMgr = require('./process-mgr');
const cmdline = require('cmdline');
const bootstrap = require('./bootstrap');
const utils = nokit.utils;
const pkg = nokit.pkg;
const console = nokit.console;
const env = nokit.env;
//var _debugger = require('../tool/debugger');

const dm = domain.create();
dm.on('error', function (err) {
  console.error(err.message + env.EOL + err.stack);
});

dm.run(function () {

  const notifier = new Notifier();

  cmdline
    .error(function (err) {
      console.error(err.message);
    })
    .version(pkg.displayName + " " + pkg.version)
    .help(path.normalize('@' + __dirname + '/help.txt'))

    /**
     * 定义选项
     **/
    .option(['-t', '--type'], { type: 'string', command: 'create' })
    .option(['-n', '--name'], { type: 'string', command: 'start' })
    .option(['-p', '--port'], { type: 'number', command: 'start' })
    .option(['-c', '--cluster'], { type: 'number', command: 'start' })
    .option(['-w', '--watch'], { type: 'switch', command: 'start' })
    .option(['-e', '--env'], { type: 'string', command: 'start' })
    .option(['--config'], { type: 'string', command: 'start' })
    .option(['--public'], { type: 'string', command: 'start' })
    .option(['--node'], { type: 'string*', command: 'start' })

    /**
     * 创建一个应用
     **/
    .command(['new', 'create'], function ($0, $1, type) {
      console.log("Creating...");
      //处理参数
      var appName = $0 || 'nokit-app';
      var dstPath = $1 || "./";
      var appType = type || 'mvc';
      //处理路径
      var dstFullPath = path.resolve(process.cwd(), path.normalize(dstPath + '/' + appName));
      var srcFullPath = path.resolve(__dirname, path.normalize('../examples/' + appType));
      //检查目标路径是否已存在
      if (fs.existsSync(dstFullPath)) {
        console.error('Create failure, directory "' + dstFullPath + '" already exists');
      } else {
        //复制应用模板
        nokit.utils.copyDir(srcFullPath, dstFullPath);
        console.log('In the "' + dstFullPath + '" has been created');
      }
      return false;
    })

    /**
     * 启动一个应用
     **/
    .command(['start'], function () {
      console.log("Starting...");
      //定义 params
      var params = {};
      //添加入口程序
      params.main = path.normalize(__dirname + '/app.js');
      //添加应用根目录
      params.root = path.resolve(process.cwd(), path.normalize(cmdline.argv[0] || './'));
      //添加监听端口
      params.port = cmdline.get('port');
      //添加控制选项
      utils.each(cmdline.options, function (name, value) {
        params[name] = value;
      });
      //检查重名
      if (processLog.get(params.name)) {
        return console.warn("Application name already exists: " + params.name);
      }
      //请求启动
      notifier.waiting(1);
      processMgr.startApp(params);
      return false;
    })

    /**
     * 停止一个应用
     **/
    .command('stop', function () {
      var nameOrPid = cmdline.argv[0];
      var isAll = !nameOrPid;
      if (!isAll && !processLog.get(nameOrPid)) {
        return console.warn('Can\'t find specified application: ' + nameOrPid);
      }
      if (isAll) {
        processMgr.killAllApp();
        console.log("All application has stopped");
      } else {
        processMgr.killApp(nameOrPid);
        console.log("Stopped specified application: " + nameOrPid);
      }
      return false;
    })

    /**
     * 重启启用
     **/
    .command(['restart'], function () {
      var processCount = processLog.readArray().length;
      if (processCount < 1) {
        console.log("No application has been started");
        return;
      }
      console.log("Restarting...");
      var nameOrPid = cmdline.args[0];
      var isAll = !nameOrPid;
      if (!isAll && !processLog.get(nameOrPid)) {
        return console.warn('Can\'t find specified application: ' + nameOrPid);
      }
      notifier.waiting(isAll ? processCount : 1);
      if (isAll) {
        processMgr.restartAllApp();
      } else {
        processMgr.restartApp(nameOrPid);
      }
      return false;
    })

    /**
     * 停止并删除应用 
     **/
    .command(['remove', 'delete'], function () {
      var nameOrPid = cmdline.argv[0];
      var isAll = !nameOrPid;
      if (!isAll && !processLog.get(nameOrPid)) {
        return console.warn('Can\'t find specified application: ' + nameOrPid);
      }
      if (isAll) {
        processMgr.deleteAllApp();
        console.log("All application has deleted");
      } else {
        processMgr.deleteApp(nameOrPid);
        console.log("Deleted specified application: " + nameOrPid);
      }
      return false;
    })

    /**
     * 显示所有应用
     **/
    .command(['list', 'ls'], function () {
      var logArray = processLog.toPrintArray();
      if (logArray && logArray.length > 0) {
        console.log('Launched applications:' + env.EOL);
        console.table(logArray);
      } else {
        console.log('No application has been started');
      }
      return false;
    })

    /**
     * 添加自启动
     **/
    .command(['boot'], function () {
      var status = Boolean(cmdline.args[0] == 'on');
      console.log(bootstrap.set(status));
      return false;
    })

    /**
     * 恢复意外终止的应用
     **/
    .command(['restore'], function () {
      var appArray = processLog.readArray()
        .filter(function (app) {
          return app.status;
        });
      if (appArray.length < 1) {
        console.log("No application has been started");
        return;
      }
      console.log("Starting...");
      notifier.waiting(appArray.length);
      processMgr.killAllApp();
      appArray.forEach(function (log) {
        processMgr.startApp(log.params);
      });
    })

    //就续开始执行
    .ready();

});
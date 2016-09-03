#!/usr/bin/env node

const nokit = require("../");
const path = require("path");
const fs = require("fs");
const domain = require("domain");
const Notifier = require('./notifier');
const processLog = require('./process-log');
const processMgr = require('./process-mgr');
const cmdline = require('cmdline');
const startup = require('./startup');
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
     * 创建一个应用
     **/
    .root.command(['new', 'create'])
    .option(['-t', '--type'], 'string')
    .action(function ($1, $2, type) {
      console.log("Creating...");
      //处理参数
      var appName = $1 || 'nokit-app';
      var dstPath = $2 || "./";
      var appType = type || 'mvc';
      //处理路径
      var dstFullPath = path.resolve(process.cwd(), path.normalize(dstPath + '/' + appName));
      var srcFullPath = path.resolve(__dirname, path.normalize('../examples/' + appType));
      //检查目标路径是否已存在
      if (fs.existsSync(dstFullPath)) {
        console.error('Create failed, folder "' + dstFullPath + '" already exists');
      } else {
        //复制应用模板
        nokit.utils.copyDir(srcFullPath, dstFullPath);
        console.log('In the "' + dstFullPath + '" has been created');
      }
      return false;
    }, false)

    /**
     * 启动一个应用
     **/
    .root.command(['start'])
    .option(['-n', '--name'], 'string')
    .option(['-p', '--port'], 'number')
    .option(['-c', '--cluster'], 'number')
    .option(['-w', '--watch'], 'switch')
    .option(['-e', '--env'], 'string')
    .option(['--config'], 'string')
    .option(['--public'], 'string')
    .option(['--node'], 'string*')
    .action(function () {
      console.log("Starting...");
      //定义 params
      var params = {};
      //添加入口程序
      params.main = path.normalize(__dirname + '/app.js');
      //添加应用根目录
      params.root = path.resolve(process.cwd(), path.normalize(this.argv[0] || './'));
      //添加监听端口
      params.port = this.get('port');
      //添加控制选项
      utils.each(this.options, function (name, value) {
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
    }, false)

    /**
     * 停止一个应用
     **/
    .root.command('stop')
    .action(function () {
      var nameOrPid = this.argv[0];
      if (nameOrPid && !processLog.get(nameOrPid)) {
        return console.warn('Can\'t find specified application: ' + nameOrPid);
      }
      if (nameOrPid) {
        processMgr.killApp(nameOrPid);
        console.log("Stopped specified application: " + nameOrPid);
      } else {
        processMgr.killAllApp();
        console.log("All application has stopped");
      }
      return false;
    }, false)

    /**
     * 重启启用
     **/
    .root.command(['restart'])
    .action(function () {
      var processCount = processLog.readArray().length;
      if (processCount < 1) {
        console.log("No application has been started");
        return;
      }
      console.log("Restarting...");
      var nameOrPid = this.argv[0];
      if (nameOrPid && !processLog.get(nameOrPid)) {
        return console.warn('Can\'t find specified application: ' + nameOrPid);
      }
      notifier.waiting(nameOrPid ? 1 : processCount);
      if (nameOrPid) {
        processMgr.restartApp(nameOrPid);
      } else {
        processMgr.restartAllApp();
      }
      return false;
    }, false)

    /**
     * 停止并删除应用 
     **/
    .root.command(['remove', 'delete'])
    .action(function () {
      var nameOrPid = this.argv[0];
      if (nameOrPid && !processLog.get(nameOrPid)) {
        return console.warn('Can\'t find specified application: ' + nameOrPid);
      }
      if (nameOrPid) {
        processMgr.deleteApp(nameOrPid);
        console.log("Deleted specified application: " + nameOrPid);
      } else {
        processMgr.deleteAllApp();
        console.log("All application has deleted");
      }
      return false;
    }, false)

    /**
     * 显示所有应用
     **/
    .root.command(['list', 'ls'])
    .action(function () {
      var logArray = processLog.toPrintArray();
      if (logArray && logArray.length > 0) {
        console.log('Launched applications:' + env.EOL);
        console.table(logArray);
      } else {
        console.log('No application has been started');
      }
      return false;
    }, false)

    /**
     * 添加自启动
     **/
    .root.command(['startup'])
    .action(function () {
      var status = Boolean(this.argv[0] == 'on');
      console.log(startup.set(status));
      return false;
    }, false)

    /**
     * 恢复意外终止的应用
     **/
    .root.command(['recovery'])
    .action(function () {
      var appArray = processLog.readArray()
        .filter(function (app) {
          return app.status;
        });
      if (appArray.length < 1) {
        console.log("No application has been started");
        return;
      }
      console.log("Recovery...");
      var nameOrPid = this.argv[0];
      if (nameOrPid && !processLog.get(nameOrPid)) {
        return console.warn('Can\'t find specified application: ' + nameOrPid);
      }
      notifier.waiting(nameOrPid ? 1 : appArray.length);
      if (nameOrPid) {
        processMgr.restartApp(nameOrPid);
      } else {
        appArray.forEach(function (log) {
          processMgr.restartApp(log.name);
        });
      }
    }, false)

    //就续开始执行
    .root.ready();

});
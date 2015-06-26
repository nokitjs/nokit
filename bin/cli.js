#!/usr/bin/env node

var nokit = require("../");
var path = require("path");
var domain = require("domain");
var processLog = require('./processlog');
var processMgr = require('./processmgr');
var packageInfo = require('./packageinfo');
var cml = require('./commandline');
var utils = nokit.utils;
var console = nokit.console;

//工作目录
var cwd = process.cwd();

/**
 * 输出帮助信息
 **/
function printVersionAndHelp(packageInfo) {
    console.log(packageInfo.name + " " + packageInfo.version + '\r\n', true);
    console.log("创建 : nokit create  <应用名称> [目标目录] [应用类型]", true);
    console.log("启动 : nokit start   <应用目录> [应用端口] [--debug]", true);
    console.log("停止 : nokit stop    [进程ID|all]", true);
    console.log("重启 : nokit restart [进程ID|all]", true);
    console.log("查看 : nokit list    (list命令没有参数)\r\n", true);
};

var dm = domain.create();
dm.on('error', function(err) {
    console.error(err);
});

dm.run(function() {

    switch (cml.command) {
        case "":
            printVersionAndHelp(packageInfo);
            break;
        case "?":
            printVersionAndHelp(packageInfo);
            break;
        case "create":
            console.log("正在创建...");
            //处理目标路径
            var appName = cml.args[0] || 'nokit-app';
            var dstPath = cml.args[1] || "./";
            var dstFullPath = path.resolve(cwd, path.normalize(dstPath + '/' + appName));
            //处理源路径
            var appType = cml.args[2] || 'mvc';
            var srcFullPath = path.resolve(__dirname, path.normalize('../examples/' + appType));
            nokit.utils.copyDir(srcFullPath, dstFullPath);
            console.log('在 "' + dstFullPath + '" 创建完成');
            break;
        case "start":
            var appArgs = [];
            var isDebug = cml.controls.indexOf('--debug') > -1;
            var isCluster = cml.controls.indexOf('--cluster') > -1;
            if (isDebug) {
                appArgs.push('--debug');
            }
            var appFileName = (isCluster ? 'app-cluster.js' : 'app.js');
            appArgs.push(path.normalize(__dirname + '/' + appFileName));
            cml.args.forEach(function(item) {
                appArgs.push(item);
            });
            var appMode = isDebug ? 'debug' : 'run';
            var appPath = path.resolve(cwd, cml.args[0]);
            processMgr.startApp(appArgs, appMode, appPath);
            break;
        case "stop":
            var pid = cml.args[0];
            if (!pid || pid == 'all') {
                processMgr.killAllApp();
                console.log("已退出所有应用");
            } else {
                processMgr.killApp(pid);
                console.log("已退出指定的应用: " + pid);
            }
            break;
        case "restart":
            var pid = cml.args[0];
            if (!pid || pid == 'all') {
                processMgr.restartAllApp();
                console.log("已重启所有应用");
            } else {
                processMgr.restartApp(pid);
                console.log("已重启指定的应用: " + pid);
            }
            break;
        case "list":
            var logArray = processLog.toPrintArray();
            if (logArray && logArray.length > 0) {
                console.log('已启动的应用:\r\n');
                console.table(logArray);
            } else {
                console.log('没有已启动的应用');
            }
            break;
        default:
            console.error("不能识别的命令 " + cml.command);
    }

    //exit cli
    setTimeout(function() {
        process.exit(0);
    }, processMgr.exitTimeout);
});
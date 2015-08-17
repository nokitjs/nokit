#!/usr/bin/env node

var nokit = require("../");
var path = require("path");
var domain = require("domain");
var Message = require('./message');
var processLog = require('./processlog');
var processMgr = require('./processmgr');
var CmdLine = require('cmdline');
var autostart = require('./autostart');
var utils = nokit.utils;
var packageInfo = nokit.info;
var console = nokit.console;

//工作目录
var cwd = process.cwd();

/**
 * 输出帮助信息
 **/
function printVersionAndHelp() {
    console.log(packageInfo.name + " " + packageInfo.version + '\r\n', true);
    console.log(" 1) nokit create    [name] [mvc|nsp|restful] [folder]", true);
    console.log(" 2) nokit start     [port] [root] [-config:<name>] [-cluster[:num]] [-watch[:.ext,...]] [node-opts]", true);
    console.log(" 3) nokit stop      [pid|all]", true);
    console.log(" 4) nokit restart   [pid|all]", true);
    console.log(" 5) nokit list      (no args)", true);
    console.log(" 6) nokit autostart [on|off] [-uid:[domain\\]user [-pwd:password]]\r\n", true);
};

var dm = domain.create();
dm.on('error', function(err) {
    console.error(err.message + "\r\n" + err.stack);
});

dm.run(function() {

    var message = new Message();

    var cml = new CmdLine({
        commandEnabled: true
    });

    switch (cml.command) {
        case "":
        case "?":
        case "help":
            printVersionAndHelp();
            break;
        case "create":
            console.log("正在创建...");
            //处理参数
            var appName = cml.args[0] || 'nokit-app';
            var appType = cml.args[1] || 'mvc';
            var dstPath = cml.args[2] || "./";
            //处理路径
            var dstFullPath = path.resolve(cwd, path.normalize(dstPath + '/' + appName));
            var srcFullPath = path.resolve(__dirname, path.normalize('../examples/' + appType));
            //复制应用模板
            nokit.utils.copyDir(srcFullPath, dstFullPath);
            console.log('在 "' + dstFullPath + '" 创建完成');
            break;
        case "start":
            console.log("正在启动应用...");
            message.waiting(1);
            var startInfo = [];
            //处理调式参数
            if (cml.options.has('--debug')) {
                var debugPort = parseInt(cml.options.getValue('--debug') || 5858) - 1;
                cml.options.setValue('--debug', debugPort);
            }
            if (cml.options.has('--debug-brk')) {
                var debugPort = parseInt(cml.options.getValue('--debug-brk') || 5858) - 1;
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
            var port = cml.args[0] || 8000;
            startInfo.push(port);
            //添加应用根目录
            var root = path.resolve(cwd, cml.args[1] || './');
            startInfo.push(root);
            //添加控制选项
            cml.options.forEach(function(item) {
                startInfo.push(item);
            });
            //请求启动
            processMgr.startApp(startInfo);
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
            var processCount = processLog.readArray().length;
            if (processCount < 1) {
                console.log("没有已启动的应用");
                return;
            }
            console.log("正在重启应用...");
            message.waiting(processCount);
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
                console.log('已启动的应用:\r\n');
                console.table(logArray);
            } else {
                console.log('没有已启动的应用');
            }
            break;
        case "autostart":
            var state = (cml.args[0] || 'on').toLowerCase();
            if (state != 'on' && state != 'off') {
                console.log('不能识别的参数 ' + cml.args[0]);
            } else {
                console.log(autostart.set(state, {
                    uid: cml.options.getValue('-uid'),
                    pwd: cml.options.getValue('-pwd')
                }));
            }
            break;
        default:
            console.error("不能识别的命令 " + cml.command);
    }

});
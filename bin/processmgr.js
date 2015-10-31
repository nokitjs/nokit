/* global __dirname */
/* global process */
var isWin = process.platform === 'win32';
var child_process = require('child_process');
var path = require("path");
var nokit = require("../");
var processLog = require('./processlog');
var utils = nokit.utils;
var base64 = nokit.base64;
var console = nokit.console;
var debuger = require('../test/debuger');
var spawn = child_process.spawn;
var exec = child_process.exec;

var engineName = path.basename(process.argv[0] || 'node').split('.')[0];
var win32EngineName = path.normalize(__dirname + '/shim/win32/' + engineName + '.vbs ');

//cli进程延迟存活时间
exports.isWin = isWin;

//基础进程方法开始
exports.kill = function (pid) {
    try {
        process.kill(pid);
    } catch (ex) { }
};

exports.start = function (args) {
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
//基础进程方法结束

exports.killApp = function (pid) {
    this.kill(pid);
    processLog.remove(pid);
};

exports.killAllApp = function () {
    var logArray = processLog.readArray();
    for (var i in logArray) {
        var log = logArray[i];
        this.kill(log.pid);
    }
    processLog.clear();
};

var endcodeStartInfo = function (startInfo) {
    return base64.encode(JSON.stringify(startInfo || []));
};
var dedcodeStartInfo = function (startInfo) {
    return JSON.parse(base64.decode(startInfo));
};

exports.startApp = function (startInfo) {
    //将启动信息加入到自身，用于重启
    startInfo.push('-start-info:' + endcodeStartInfo(startInfo));
    this.start(startInfo);
};

exports.restartApp = function (pid) {
    var log = processLog.get(pid);
    if (!log) return;
    this.killApp(log.pid);
    this.startApp(dedcodeStartInfo(log.startInfo));
};

exports.restartAllApp = function () {
    var logArray = processLog.readArray();
    this.killAllApp();
    for (var i in logArray) {
        var log = logArray[i];
        this.startApp(dedcodeStartInfo(log.startInfo));
    }
};
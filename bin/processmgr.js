var nokit = require("../");
var child_process = require('child_process');
var processLog = require('./processlog');
var utils = nokit.utils;
var console = nokit.console;

//cli进程延迟存活时间
exports.exitTimeout = 0;

//基础进程方法开始
exports.kill = function(pid) {
    try {
        process.kill(pid);
    } catch (ex) {
        //none;
    }
};

exports.start = function(name, args) {
    exports.exitTimeout += 2000;
    var child = child_process.spawn(name, args, {
        detached: true
    });
    child.stdout.on('data', function(data) {
        console.log(data, true);
    });
    child.stderr.on('data', function(data) {
        console.error(data, true);
        //processLog.remove(child.pid);
    });
    child.on('close', function(code) {
        //console.log(code);
        processLog.remove(child.pid);
    })
    return child;
};
//基础进程方法结束

exports.killApp = function(pid) {
    this.kill(pid);
    processLog.remove(pid);
};

exports.killAllApp = function() {
    var logArray = processLog.readArray();
    for (var i in logArray) {
        var log = logArray[i];
        this.kill(log.pid);
    }
    processLog.clear();
};

exports.startApp = function(appArgs, appMode, appPath) {
    var name = 'node';
    var app = this.start(name, appArgs);
    var log = {
        pid: app.pid,
        path: appPath,
        mode: appMode,
        args: appArgs
    };
    processLog.add(log);
};

exports.restartApp = function(pid) {
    var log = processLog.get(pid);
    if (!log) return;
    this.killApp(log.pid);
    this.startApp(log.args, log.mode, log.path);
};

exports.restartAllApp = function() {
    var logArray = processLog.readArray();
    this.killAllApp();
    for (var i in logArray) {
        var log = logArray[i];
        this.startApp(log.args, log.mode, log.path);
    }
};
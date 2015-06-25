#!/usr/bin/env node

var nokit = require("../");
var path = require("path");
var domain = require("domain");
var childProcess = require('child_process');
var utils = nokit.utils;
var console = nokit.console;

var dm = domain.create();
dm.on('error', function(err) {
    console.error(err);
});
dm.run(function() {

    var exitTimeout = 2000;

    //工作目录
    var cwd = process.cwd();

    //分拆参数
    var srcArgs = process.argv.splice(2);
    var controlArgs = [];
    var args = [];
    srcArgs.forEach(function(item) {
        if (item[0] == '-') {
            controlArgs.push(item);
        } else {
            args.push(item);
        }
    });
    var command = args[0];
    args = args.splice(1);

    //输出版本信息
    var packageInfo = nokit.utils.readJSONSync(path.resolve(__dirname, path.normalize("../package.json")));
    packageInfo._name = packageInfo.name;
    packageInfo.name = nokit.utils.firstUpper(packageInfo.name.split('-')[0]);
    if (!command || command == '?') {
        console.log(packageInfo.name + " " + packageInfo.version + '\r\n', true);
        console.log("创建 : nokit create <应用名称>   [目标目录] [应用类型]", true);
        console.log("启动 : nokit start  <应用目录>   [应用端口] [--debug]", true);
        console.log("停止 : nokit stop   [进程ID|all]", true);
        console.log("查看 : nokit list   (list命令没有参数)\r\n", true);
        return;
    }

    //进程信息操作
    var processInfoFile = path.normalize(__dirname + '/pid.log');
    var readProcessInfo = function() {
        return utils.readJSONSync(processInfoFile);
    };
    var saveProcessInfo = function(info) {
        return utils.writeJSONSync(processInfoFile, info);
    };
    var addProcessInfo = function(info) {
        var processInfo = readProcessInfo();
        processInfo.push(info);
        saveProcessInfo(processInfo);
    };
    var removeProcessInfo = function(pid) {
        if (pid) {
            var processInfo = readProcessInfo();
            processInfo = processInfo.filter(function(item) {
                return item.pid != pid;
            });
            saveProcessInfo(processInfo);
        } else {
            saveProcessInfo([]);
        }
    };

    //结束进程
    var killProcess = function(pid) {
        var processInfo = readProcessInfo();
        try {
            process.kill(pid);
            var child = (processInfo.filter(function(item) {
                return item.pid == pid;
            }) || [])[0];
            if (child && child.dpid) {
                process.kill(child.dpid);
            }
        } catch (ex) {
            //none;
        }
    };

    var startChildProcess = function(cmdName, cmdArgs) {
        var child = childProcess.spawn(cmdName, cmdArgs, {
            detached: true
        });
        child.stdout.on('data', function(data) {
            console.log(data, true);
        });
        child.stderr.on('data', function(data) {
            console.error(data, true);
        });
        child.on('close', function(code) {
            console.log(code);
        })
        return child;
    };

    var startDebugger = function() {
        exitTimeout += 2000;
        var cmdName = 'node';
        var cmdArgs = [path.normalize(path.dirname(__dirname) + '/node_modules/node-inspector/bin/inspector.js')];
        cmdArgs.push("--hidden=" + packageInfo._name);
        return startChildProcess(cmdName, cmdArgs);
    };

    //创建项目
    if (command == 'create') {
        console.log("正在创建...");
        //处理目标路径
        var appName = args[0] || 'nokit-app';
        var dstPath = args[1] || "./";
        var dstFullPath = path.resolve(cwd, path.normalize(dstPath + '/' + appName));
        //处理源路径
        var appType = args[2] || 'mvc';
        var srcFullPath = path.resolve(__dirname, path.normalize('../examples/' + appType));
        nokit.utils.copyDir(srcFullPath, dstFullPath);
        console.log('在 "' + dstFullPath + '" 创建完成');
    } else if (command == 'start') {
        var cmdName = 'node';
        var cmdArgs = [];
        var isDebug = controlArgs.indexOf('--debug') > -1;
        if (isDebug) {
            cmdArgs.push('--debug');
        }
        var isCluster = controlArgs.indexOf('--cluster') > -1;
        var appFileName = (isCluster ? 'app-cluster.js' : 'app.js');
        cmdArgs.push(path.normalize(__dirname + '/' + appFileName));
        args.forEach(function(item) {
            cmdArgs.push(item);
        });
        var child = startChildProcess(cmdName, cmdArgs);
        var info = {
            pid: child.pid,
            path: path.resolve(cwd, args[0]),
            mode: 'run'
        };
        if (isDebug) {
            var debugProcess = startDebugger();
            info.mode = 'debug';
            info.dpid = debugProcess.pid;
        }
        addProcessInfo(info);
    } else if (command == 'stop') {
        var pid = args[0];
        if (!pid || pid == 'all') {
            var processInfo = readProcessInfo();
            for (var i in processInfo) {
                var info = processInfo[i];
                killProcess(info.pid);
            }
            removeProcessInfo(); //remove all
        } else {
            killProcess(pid);
            removeProcessInfo(pid);
        }
        console.log("已退出指定的应用");
    } else if (command == 'list') {
        var processInfo = readProcessInfo();
        if (processInfo && processInfo.length > 0) {
            console.log('已启动的应用:\r\n');
            console.table(processInfo);
        } else {
            console.log('没有已启动的应用');
        }
    } else {
        console.error("不能识别的命令 " + command);
    }

    //exit
    setTimeout(function() {
        process.exit(0);
    }, exitTimeout);
});
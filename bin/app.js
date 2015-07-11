var nokit = require("../");
var console = nokit.console;
var utils = nokit.utils;
var path = require("path");
var domain = require("domain");
var watch = require("watch");
var processLog = require("./processlog");
var CommandLine = require("./commandline");
var cluster = require("cluster");
var cpuTotal = require("os").cpus().length;

//处理参数信息开始
var cwd = process.cwd();
var cml = new CommandLine();

//创建 options
//注意 options 必须这样创建，不能用 var options = {...}; 的形式创建
var options = {};
if (cml.args[0]) {
    options.port = cml.args[0];
}
if (cml.args[1]) {
    options.root = path.resolve(cwd, cml.args[1]);
}
if (cml.args[2]) {
    options.folders = options.folders || {};
    options.folders.public = cml.args[2];
}
//处理参数信息结束

if (cluster.isMaster) {

    var isCluster = cml.controls.has('-cluster');
    var workerNumber = isCluster ? (cml.controls.getValue('-cluster') || cpuTotal) : 1;
    var workerReady = 0;

    //进程日志信息
    var logInfo = {
        pid: process.pid,
        path: options.root,
        cluster: isCluster,
        debug: cml.controls.has('-debug'),
        startInfo: cml.controls.getValue('-start-info') || ''
    };

    //创建工作进程 
    var createWorker = function() {
        var worker = cluster.fork();
        //接收工作进程启动成功的消息 
        //因为需要 configs 信息，所以需要用 "进程通信" 将 configs 传递过来
        worker.on('message', function(configs) {
            workerReady++;
            //子进程全部 ready
            if (workerReady >= workerNumber) {
                logInfo.wpid = [];
                var allWorkers = utils.copy(cluster.workers);
                utils.each(allWorkers, function(id, _worker) {
                    logInfo.wpid.push(_worker.process.pid);
                });
                logInfo.host = (configs.hosts || [])[0] || 'localhost';
                logInfo.port = configs.port;
                processLog.remove(logInfo.pid);
                processLog.add(logInfo);
            }
        });
        return worker;
    };

    //创建工作进程
    for (var i = 0; i < workerNumber; i++) {
        createWorker();
    }

    //发现一个 worker 结束，就启动一个新的 worker
    cluster.on('exit', function(worker) {
        workerReady--;
        createWorker();
    });

    //结束(重启)所有工作进程
    var killAllWorkers = function() {
        var allWorkers = utils.copy(cluster.workers);
        utils.each(allWorkers, function(id, _worker) {
            _worker.kill();
        });
    };

    //启用监控
    var watchEnabled = cml.controls.has('-watch');
    if (watchEnabled) {
        var watchTypes = cml.controls.getValue('-watch');
        if (watchTypes) {
            watchTypes = watchTypes.split(',');
        }
        var fileChanged = function(file) {
            var extname = path.extname(file).toLowerCase();
            if (extname == '.log' || (watchTypes && watchTypes.length > 0 && !utils.contains(watchTypes, extname))) {
                return;
            }
            killAllWorkers();
        };
        watch.createMonitor(options.root, {
            ignoreDotFiles: true
        }, function(monitor) {
            monitor.on("created", fileChanged);
            monitor.on("changed", fileChanged);
            monitor.on("removed", fileChanged);
        });
    }

} else {

    //启动 server
    var server = new nokit.Server(options);
    server.start(function() {
        //向父进程发送 server.configs
        process.send(server.configs);
    });

}
/*end*/
var nokit = require("../");
var path = require("path");
var domain = require("domain");
var processLog = require('./processlog');
var CommandLine = require('./commandline');
var console = nokit.console;
var cluster = require('cluster');
var cpuTotal = require('os').cpus().length;

//处理参数信息开始
var cwd = process.cwd();
var cml = new CommandLine();

//创建 options
//注意 options 必须这样创建，不能用 var options = {...}; 的形式创建
var options = {};
if (cml.args[0]) {
    options.root = path.resolve(cwd, cml.args[0]);
}
if (cml.args[1]) {
    options.port = cml.args[1];
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

    var logInfo = {
        pid: process.pid,
        path: options.root,
        cluster: isCluster,
        debug: cml.controls.has('-debug'),
        startInfo: cml.controls.getValue('-start-info') || ''
    };

    var createWorker = function() {
        var worker = cluster.fork();
        //接收工作进程启动成功的消息 
        worker.on('message', function(configs) {
            workerReady++;
            //子进程全部 ready
            if (workerReady >= workerNumber) {
                logInfo.wpid = [];
                for (var i in cluster.workers) {
                    logInfo.wpid.push(cluster.workers[i].process.pid);
                }
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

} else {

    //启动 server
    var server = new nokit.Server(options);
    server.start();

    //向父进程发送 server.configs
    process.send(server.configs);
}
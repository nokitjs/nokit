var nokit = require("../");
var console = nokit.console;
var env = nokit.env;
var utils = nokit.utils;
var path = require("path");
var Notifier = require('./notifier');
var domain = require("domain");
var chokidar = require('chokidar');
var processLog = require("./process-log");
var cluster = require("cluster");
var cpuTotal = require("os").cpus().length;
var exitCode = nokit.exitCode;
var self = exports;

var EXIT_DELAY = 1000;

self.init = function (options, cml) {

  var notifier = new Notifier();

  var startInfo = cml.options.getValue('-start-info') || '';
  var isDebug = cml.options.has('--debug') || cml.options.has('--debug-brk');
  var isCluster = cml.options.has('-cluster') && !isDebug;
  var isWatch = cml.options.has('-watch');
  var appName = cml.options.getValue('-name');
  //--

  var workerNumber = isCluster ? parseInt(cml.options.getValue('-cluster') || cpuTotal) : 1;
  if (workerNumber < 1) workerNumber = 1;
  var workerReady = 0;
  var workerDebugPort = parseInt(cml.options.getValue('--debug') || cml.options.getValue('--debug-brk')) + 1;

  //进程日志信息
  var logInfo = {
    pid: process.pid,
    name: appName || process.pid,
    path: options.root,
    env: options.env,
    debug: isDebug ? workerDebugPort : false,
    watch: isWatch ? (cml.options.getValue('-watch') || "*") : false,
    startInfo: startInfo,
    status: false
  };

  //创建工作进程 
  var createWorker = function () {
    var worker = cluster.fork();
    //接收工作进程启动成功的消息 
    //因为需要 configs 信息，所以需要用 "进程通信" 将 configs 传递过来
    worker.on('message', function (msgItem) {
      msgItem = msgItem || {};
      if (msgItem.state) {
        workerReady++;
        //子进程全部 ready
        if (workerReady >= workerNumber) {
          var configs = msgItem.configs;
          logInfo.wpid = [];
          var allWorkers = utils.copy(cluster.workers);
          utils.each(allWorkers, function (id, _worker) {
            logInfo.wpid.push(_worker.process.pid);
          });
          logInfo.host = (configs.hosts || [])[0] || 'localhost';
          logInfo.port = configs.port;
          logInfo.status = true;
          processLog.save(logInfo);
          //--
          msgItem.type = 'log';
          notifier.ready([msgItem]);
        }
      } else {
        msgItem.type = 'error';
        notifier.ready([msgItem], function () {
          /*
          启动时如果有一个工作进程不成功就全部结束,
          运行过程中，如果一个工作进程出现问题，不会导致全部结束
          因为，message.send 仅第一次调用有效。
          */
          setTimeout(function () {
            process.exit(exitCode.MASTER_START_ERR);
          }, EXIT_DELAY);
        });
      }
    });
    return worker;
  };

  //创建工作进程
  for (var i = 0; i < workerNumber; i++) {
    createWorker();
  }

  //发现一个 worker 结束，就启动一个新的 worker
  // cluster.on('exit', function (worker) {
  //     workerReady--;
  //     createWorker();
  // });

  //发现一个 worker disconnect，就启动一个新的 worker
  cluster.on('disconnect', function (worker) {
    workerReady--;
    createWorker();
  });

  //结束(重启)所有工作进程
  var killAllWorkers = function () {
    var allWorkers = utils.copy(cluster.workers);
    utils.each(allWorkers, function (id, _worker) {
      _worker.kill();
    });
  };

  //启用文件监控
  var watchEnabled = cml.options.has('-watch');
  if (watchEnabled) {
    var watchTypes = cml.options.getValue('-watch');
    if (watchTypes) {
      watchTypes = watchTypes.split(',');
    }
    //文件改变处理函数
    var fileChanged = function (file) {
      var extname = path.extname(file).toLowerCase();
      if (extname == '.log' || (watchTypes &&
        watchTypes.length > 0 &&
        !utils.contains(watchTypes, extname))) {
        return;
      }
      killAllWorkers();
    };
    //启动文件监控
    chokidar.watch(options.root, {
      ignoreInitial: true
    }).on('all', function (event, path) {
      fileChanged(path);
    });
  }
};
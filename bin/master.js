const nokit = require("../");
const console = nokit.console;
const env = nokit.env;
const utils = nokit.utils;
const path = require("path");
const Notifier = require('./notifier');
const domain = require("domain");
const chokidar = require('chokidar');
const processLog = require("./process-log");
const cluster = require("cluster");
const cpuTotal = require("os").cpus().length;
const exitCode = nokit.exitCode;
const self = exports;

const EXIT_DELAY = 1000;

self.init = function (params) {

  const notifier = new Notifier();

  var workerNumber = utils.isNull(params.cluster) ? 1 : params.cluster;
  workerNumber = workerNumber > 0 ? workerNumber : cpuTotal;
  var workerReady = 0;

  //进程日志信息
  var logInfo = {
    pid: process.pid,
    name: params.name || process.pid,
    path: params.root,
    env: params.env,
    watch: params.watch,
    params: params,
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
  if (params.watch) {
    //启动文件监控
    chokidar.watch(params.root, {
      ignoreInitial: true
    }).on('all', function (event, path) {
      var extname = path.extname(file).toLowerCase();
      if (extname == '.log') return;
      killAllWorkers();
    });
  }

};
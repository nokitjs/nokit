const path = require("path");
const fs = require('fs');
const nokit = require("../");
const utils = nokit.utils;
const env = nokit.env;

/**
 * 进程信息操作
 **/
function ProcessLog(dataPath) {
  this.logFile = path.normalize(dataPath + '/process.log');
}

ProcessLog.prototype.readArray = function () {
  if (!this.cache) {
    this.cache = fs.existsSync(this.logFile) ? utils.readJSONSync(this.logFile) : [];
  }
  return this.cache;
};

ProcessLog.prototype.saveArray = function (logArray) {
  utils.writeJSONSync(this.logFile, logArray);
  this.cache = null;
};

ProcessLog.prototype.get = function (nameOrPid) {
  var logArray = this.readArray();
  return (logArray.filter(function (item) {
    return item.name == nameOrPid || item.pid == nameOrPid;
  }) || [])[0];
};

ProcessLog.prototype.add = function (log) {
  var logArray = this.readArray();
  logArray.push(log);
  this.saveArray(logArray);
};

ProcessLog.prototype.remove = function (nameOrPid) {
  var logArray = this.readArray();
  logArray = logArray.filter(function (item) {
    return item.name != nameOrPid && item.pid != nameOrPid;
  });
  this.saveArray(logArray);
};

ProcessLog.prototype.save = function (log) {
  this.remove(log.name || log.pid);
  this.add(log);
};

ProcessLog.prototype.clear = function () {
  this.saveArray([]);
};

ProcessLog.prototype.toPrintArray = function () {
  var logArray = this.readArray();
  logArray = logArray.map(function (log) {
    return {
      NAME: log.name,
      MASTER: log.pid,
      WORKER: log.wpid,
      PORT: log.port,
      PATH: utils.short(log.path),
      ENV: log.env || "normal",
      WATCH: !!log.watch,
      STATUS: !!log.status
    };
  });
  return logArray;
};

ProcessLog.prototype.supply = function (nameOrPid, info) {
  var log = this.get(nameOrPid);
  if (!log || log.supplyed) return;
  log.host = (info.hosts || [])[0] || 'localhost';
  log.port = info.port;
  log.wpid = info.wpid;
  log.supplyed = true;
  this.remove(nameOrPid);
  this.add(log);
};

module.exports = new ProcessLog(env.DATA_PATH);
//end
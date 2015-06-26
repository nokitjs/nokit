var path = require("path");
var nokit = require("../");
var utils = nokit.utils;

/**
 * 进程信息操作
 **/
function ProcessLog(logFile) {
    this.logFile = logFile;
};

ProcessLog.prototype.readArray = function() {
    if (!this.cache) {
        this.cache = utils.readJSONSync(this.logFile);
    }
    return this.cache;
};

ProcessLog.prototype.saveArray = function(logArray) {
    utils.writeJSONSync(this.logFile, logArray);
    this.cache = null;
};

ProcessLog.prototype.get = function(pid) {
    var logArray = this.readArray();
    return (logArray.filter(function(item) {
        return item.pid == pid
    }) || [])[0];
};

ProcessLog.prototype.add = function(log) {
    var logArray = this.readArray();
    logArray.push(log);
    this.saveArray(logArray);
};

ProcessLog.prototype.remove = function(pid) {
    var logArray = this.readArray();
    logArray = logArray.filter(function(item) {
        return item.pid != pid;
    });
    this.saveArray(logArray);
};

ProcessLog.prototype.clear = function() {
    this.saveArray([]);
};

ProcessLog.prototype.toPrintArray = function() {
    var logArray = this.readArray();
    logArray = logArray.map(function(log) {
        return {
            pid: log.pid,
            host: log.host,
            port: log.port,
            path: log.path,
            mode: log.mode
        };
    });
    return logArray;
};

ProcessLog.prototype.supply = function(pid, instanse) {
    var log = this.get(pid);
    if (!log || log.supplyed) return;
    log.host = (instanse.configs.hosts || [])[0] || 'localhost';
    log.port = instanse.configs.port;
    log.supplyed = true;
    this.remove(log.pid);
    this.add(log);
};

module.exports = new ProcessLog(path.normalize(__dirname + '/process.log'));
//end
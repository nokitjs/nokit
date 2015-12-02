/* global process */
var fs = require("fs");
var path = require("path");
var os = require("os");

var NOOP = function () { };

/**
 * 定义日志写入类
 **/
var LogWriter = module.exports = function (server) {
    var self = this;
    self.utils = server.require('$./core/utils');
};

/**
 * 一般用于和 session 存储服务进行连接
 **/
LogWriter.prototype.init = function (server, callback) {
    var self = this;
    var logConfigs = server.configs.log;
    var logPath = self.path = server.resolvePath(logConfigs.path);
    var folderExists = fs.existsSync(logPath);
    if (!folderExists) {
        fs.mkdirSync(logPath);
    }
    if (callback) callback();
};

/**
 * 写入日志
 **/
LogWriter.prototype.write = function (logType, logMsg, logTime) {
    var self = this;
    logType = logType.toUpperCase();
    var timeParts = self.utils.formatDate(logTime, "yyyy-MM-dd hh:mm:ss").split(' ');
    var logFile = path.normalize(self.path + "/" + timeParts[0] + '.log');
    fs.appendFile(logFile,
        "[" + logType + "][" + timeParts[1] + "] " + logMsg + os.EOL,
        NOOP);
};
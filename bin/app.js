/* global process */
var nokit = require("../");
var utils = nokit.utils;
var path = require("path");
var CmdLine = require("cmdline");
var cluster = require("cluster");
var master = require("./master");
var worker = require("./worker");

//var debugger = require('../test/debugger');
//debugger.log('进入 app.js');

//处理参数信息开始
var cwd = process.cwd();
var cml = new CmdLine();

//创建 options
//注意 options 必须这样创建，不能用 var options = {...}; 的形式创建
var options = {};

if (cml.args[0] && cml.args[0] != "" && cml.args[0] != "0" && cml.args[0] != 0) {
    options.port = cml.args[0];
}
if (cml.args[1]) {
    options.root = path.resolve(cwd, cml.args[1]);
}

//是否自定义指定 public 文件夹
var publicFolder = cml.options.getValue('-public');
if (publicFolder) {
    options.folders = options.folders || {};
    options.folders.public = {
        "*": publicFolder
    };
}

//是否使用自定义配置
var envName = cml.options.getValue('-env');
if (envName || process.env.NODE_ENV) {
    options.env = envName || process.env.NODE_ENV;
}

//缓存参数 cache
var cache = cml.options.getValue('-cache');
if (!utils.isNull(cache) && cache !== '') {
    options.cache = options.cache || {};
    var cacheParams = cache.split(';');
    if (utils.isNumber(cacheParams[0])) {
        options.cache.maxAge = parseInt(cacheParams[0]);
    }
    if (cacheParams[1]) {
        options.cache.match = cacheParams[1].split(',');
    }
}
//处理参数信息结束

if (cluster.isMaster) {
    master.init(options, cml);
} else {
    worker.init(options, cml);
}
/*end*/
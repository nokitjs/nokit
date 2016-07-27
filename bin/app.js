/* global process */
const nokit = require("../");
const utils = nokit.utils;
const path = require("path");
const CmdLine = require("cmdline");
const cluster = require("cluster");
const master = require("./master");
const worker = require("./worker");

//var debugger = require('../test/debugger');
//debugger.log('进入 app.js');

//处理参数信息开始
const cwd = process.cwd();
const cml = new CmdLine();

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
const publicFolder = cml.options.getValue('-public');
if (publicFolder) {
  options.folders = options.folders || {};
  options.folders.public = {
    "*": publicFolder
  };
}

//是否指定配置文件名称
const configName = cml.options.getValue('-config');
if (configName) {
  options.config = configName;
}

//是否使用环境配置
const envName = cml.options.getValue('-env');
if (envName || process.env.NODE_ENV) {
  options.env = envName || process.env.NODE_ENV;
}

//缓存参数 cache
const cache = cml.options.getValue('-cache');
if (!utils.isNull(cache)) {
  options.cache = options.cache || {};
  options.cache.enabled = Boolean(cache);
}

//压缩参数 compress
const compress = cml.options.getValue('-compress');
if (!utils.isNull(compress)) {
  options.compress = options.compress || {};
  options.compress.enabled = Boolean(compress);
}

//session 参数 
const session = cml.options.getValue('-session');
if (!utils.isNull(session)) {
  options.session = options.session || {};
  options.session.enabled = Boolean(session);
}

//log 参数 
const log = cml.options.getValue('-log');
if (!utils.isNull(log)) {
  options.log = options.log || {};
  options.log.enabled = Boolean(log);
}
//处理参数信息结束

if (cluster.isMaster) {
  master.init(options, cml);
} else {
  worker.init(options, cml);
}
/*end*/
const nokit = require("../");
const utils = nokit.utils;
const path = require("path");
const cluster = require("cluster");
const base64 = nokit.base64;

var params = process.argv[2] ?
  JSON.parse(base64.decode(process.argv[2])) : {};

// require('../tool/debugger').log(params);

//创建 options
//注意 options 必须这样创建，不能用 var options = {...}; 的形式创建
var options = {};

//应用端口
if (!utils.isNull(params.port)) {
  options.port = params.port;
}

//应用根目录
if (!utils.isNull(params.root)) {
  options.root = params.root;
}

//是否指定配置文件名称
if (!utils.isNull(params.config)) {
  options.config = params.config;
}

//是否使用环境配置
if (!utils.isNull(params.env)) {
  options.env = params.env;
}

//是否自定义指定 public 文件夹
if (!utils.isNull(params.public)) {
  options.public = options.public || {};
  options.public["*"] = params.public;
}

params.options = options;
//处理参数信息结束

//记动 master 或 worker
(cluster.isMaster ? require("./master") : require("./worker")).init(params);
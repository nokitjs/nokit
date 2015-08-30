/**
 * 自动生成的应用入口程序
 *
 * 使用 nokit start 命令启动时，会忽略此入口程序
 * 以前情况可以使用此入口程序:
 *     1)在使用进程管理工具(pm2等)时 
 *     2)或者用于 "环境" 无法使用 nokit start 命令时 
 *
 * 确保添加了对 nokit 的依赖，或全局安装了 nokit 并设置了 NODE_PATH 环境变量
 *  
 * 安装命令:
 * npm install [-g] nokit-runtime
 **/

var nokit = require("nokit-runtime");
var console = nokit.console;

var options = {};
 
/**
 * 设定应程序的根目录
 */
options.root = __dirname; 

/**
 * 可以这里指定应用端口。
 * 当不在此指定时，将使用 web.json 中配置，web.json 没有配置时使用默认端口
 * options.port = 8000;
 **/

/**
 * 启动 server
 **/
var server = new nokit.Server(options);
server.start(function(err, msg) {
    if (err) {
        console.log(err);
    } else {
        console.log(msg);
    }
});
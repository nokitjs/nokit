/**
 * 自动生成的应用入口程序
 * 使用 nokit start 命令启动时，会忽略此入口程序
 * 以前情况可以使用此入口程序:
 *     1)在使用进程管理工具(pm2等)时
 *     2)或者用于 "环境" 无法使用 nokit start 命令时
 **/

var domain = require("domain");

/**
 * 确保添加了对 nokit 的依赖，或全局安装了 nokit
 * 安装命令:
 * npm install [-g] nokit-runtime
 **/
var nokit = require("nokit-runtime");
var console = nokit.console;

var dm = domain.create();
dm.on('error', function(err) {
    console.error(err);
});

dm.run(function() {

    /**
     * 创建 options
     **/
    var options = {};
    options.root = __dirname;

    /**
     * 可以这里指定应用端口。
     * 当不在此指定时，将使用 web.json 中配置，web.json 没有配置时使用默认端口
     **/

    /** options.port = 8000; */

    /**
     * 启动 server
     **/
    var server = new nokit.Server(options);
    server.start();

});
var nokit = require("../");
var path = require("path");
var domain = require("domain");
var console = nokit.console;
var cluster = require('cluster');
var cpuTotal = require('os').cpus().length

if (cluster.isMaster) {
    // Fork workers.
    for (var i = 0; i < cpuTotal; i++) {
        cluster.fork();
    }

    console.log("cluster master start.");
    cluster.on('exit', function(worker, code, signal) {
        console.log('cluster worker ' + worker.process.pid + ' died.');
    });
    cluster.on('listening', function(worker, address) {
        console.log("cluster worker with #" + worker.id + " start.");
    });

} else {

    var dm = domain.create();
    dm.on('error', function(err) {
        console.error(err);
    });

    dm.run(function() {
        var cwd = process.cwd();
        var args = process.argv.splice(2);

        //创建 options
        //注意 options 必须这样创建，不能用 var options = {...}; 的形式创建
        var options = {};
        if (args[0]) {
            options.root = path.resolve(cwd, args[0]);
        }
        if (args[1]) {
            options.port = args[1];
        }
        if (args[2]) {
            options.folders = options.folders || {};
            options.folders.public = args[2];
        }

        //启动 server
        var server = new nokit.Server(options);
        server.start();
    });
}
#!/usr/bin/env node

var nokit = require("../");
var path = require("path");

var args = process.argv.splice(2);
var cwd = process.cwd();

//输出版本信息
if (args.length < 1 || args[0] == '?') {
    var packageInfo = nokit.utils.readJSONSync(path.resolve(__dirname, path.normalize("../package.json")));
    packageInfo.name = nokit.utils.firstUpper(packageInfo.name.split('-')[0]);
    //
    console.log(packageInfo.name + " " + packageInfo.version);
    console.log("\r\n用例(<...>:必需参数 ; [...]可选参数):");
    console.log("    创建: nokit create <name:应用名称> [path:创建位置(默认为当前目录)]");
    console.log("    启动: nokit <root:应用根目录> [port:使用的端口] [public:可以访问的目录(根目录的相对路径)]");
    console.log("\r\n");
    return;
}

if (args[0] == 'create') {
    console.log("正在创建...");
    //处理目标路径
    var appName = args[1] || 'nokit-app';
    var dstPath = args[2] || "./";
    var dstFullPath = path.resolve(cwd, path.normalize(dstPath + '/' + appName));
    //处理源路径
    var appType = args[3] || 'nsp';
    var srcFullPath = path.resolve(__dirname, path.normalize('../examples/' + appType));
    nokit.utils.copyDir(srcFullPath, dstFullPath);
    console.log('在 "' + dstFullPath + '" 创建完成');
} else {
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

    var server = new nokit.Server(options);
    server.start();
}
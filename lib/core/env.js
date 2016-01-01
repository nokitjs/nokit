/* global process */
var utils = require("./utils");
var pkg = require("../../package.json");
var path = require("path");
var fs = require('fs');
var os = require('os');
var env = utils.copy(process.env || {});

//一些变量
env.INSTALL_PATH = path.dirname(path.dirname(module.filename));
env.PLATFORM = os.platform();
env.EOL = os.EOL;

//获取数据目录的父目录
var getDataPathParent = function (platform) {
    var homePath = env.HOME;
    switch (platform) {
        case 'linux':
            homePath = "/var/run";
            break;
        case 'darwin':
        case 'win32':
        default:
            homePath = env.ALLUSERSPROFILE ||
            env.ALLAPPDATA ||
            env.USERPROFILE ||
            env.APPDATA ||
            env.LOCALAPPDATA ||
            env.HOME ||
            os.homedir() ||
            (env.HOMEDRIVE + env.HOMEPATH);
            break;
    }
    return homePath;
};

var dataPathParent = getDataPathParent(env.PLATFORM);
var dataPathName = ('.' + pkg.displayName).toLowerCase();

//data path
env.DATA_PATH = path.normalize(dataPathParent + '/' + dataPathName);
if (!fs.existsSync(env.DATA_PATH)) {
    fs.mkdirSync(env.DATA_PATH);
}

module.exports = env;
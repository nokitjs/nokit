var utils = require("./utils");
var packageInfo = require("./info");
var path = require("path");
var fs = require('fs');
var os = require('os');
var env = utils.copy(process.env || {});

//一些变量
env.INSTALL_PATH = path.dirname(path.dirname(module.filename));
env.PLATFORM = os.platform();
env.EOL = os.EOL;

//处理数据目录
var getHomePath = function(platform) {
    var homePath = env.HOME;
    switch (platform) {
        case 'linux':
            homePath = "/usr/etc";
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

env.DATA_PATH = path.normalize(getHomePath(env.PLATFORM) + '/.' + packageInfo.name);
if (!fs.existsSync(env.DATA_PATH)) {
    fs.mkdirSync(env.DATA_PATH);
}

module.exports = env;
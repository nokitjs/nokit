var utils = require("./utils");
var packageInfo = require("./info");
var path = require("path");
var fs = require('fs');
var os = require('os');
var env = utils.copy(process.env || {});

//lib 目录
env.installPath = path.dirname(path.dirname(module.filename));

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
            homePath = env.HOME ||
                env.ALLUSERSPROFILE ||
                env.ALLAPPDATA ||
                env.USERPROFILE ||
                env.APPDATA ||
                env.HOMEPATH;
            break;
    }
    return homePath;
};
env.platform = os.platform();
var dataPath = path.normalize(getHomePath(env.platform) + '/.' + packageInfo.name);
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
}
env.dataPath = dataPath;

module.exports = env;
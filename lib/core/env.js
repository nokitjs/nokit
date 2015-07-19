var utils = require("./utils");
var packageInfo = require("./info");
var path = require("path");
var fs = require('fs');
var os = require('os');
var env = utils.copy(process.env);

//lib 目录
env.installPath = path.dirname(path.dirname(module.filename));

//处理数据目录
var dataPath = ({
    "darwin": env.HOME,
    "linux": "/usr/etc",
    "win32": env.HOME
})[os.platform()] || env.HOME;
dataPath = path.normalize(dataPath + '/.' + packageInfo.name);
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
}
env.dataPath = dataPath;

module.exports = env;
/* global process */
const utils = require("./utils");
const pkg = require("../../package.json");
const path = require("path");
const fs = require('fs');
const os = require('os');
const env = utils.copy(process.env || {});

//一些变量
env.INSTALL_PATH = path.dirname(path.dirname(module.filename));
env.PLATFORM = os.platform();
env.EOL = os.EOL;

//获取数据目录的父目录
const getDataPathParent = function (platform) {
  var homePath = env.HOME;
  switch (platform) {
    case 'linux':
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

const dataPathParent = getDataPathParent(env.PLATFORM);
const dataPathName = ("." + pkg.name).toLowerCase();

//data path
env.DATA_PATH = path.normalize(dataPathParent + '/' + dataPathName);
try {
  if (!fs.existsSync(env.DATA_PATH)) {
    fs.mkdirSync(env.DATA_PATH);
  }
} catch (ex) {
  env.DATA_PATH = env.TMPDIR || env.HOME;
}

module.exports = env;
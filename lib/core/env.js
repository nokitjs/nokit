var utils = require("./utils");
var packageInfo = require("./info");
var path = require("path");
var fs = require('fs');

var env = utils.copy(process.env);

env.installPath = path.dirname(path.dirname(module.filename));

var dataPath = path.normalize(env.HOME + '/.' + packageInfo.name);
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
}
env.dataPath = dataPath;

module.exports = env;
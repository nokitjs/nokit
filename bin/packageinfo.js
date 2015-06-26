var nokit = require("../");
var path = require("path");
var utils = nokit.utils;

var packageInfo = utils.readJSONSync(path.resolve(__dirname, path.normalize("../package.json")));
packageInfo.fullName = packageInfo.name;
packageInfo.name = nokit.utils.firstUpper(packageInfo.name.split('-')[0]);

module.exports = packageInfo;
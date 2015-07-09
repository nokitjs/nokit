var path = require("path");
var utils = require("./utils");

var PACKAGE_FILE = '../../package.json';

var packageInfo = utils.readJSONSync(path.resolve(__dirname, PACKAGE_FILE));
packageInfo.fullName = packageInfo.name;
packageInfo.name = utils.firstUpper(packageInfo.name.split('-')[0]);

module.exports = packageInfo;
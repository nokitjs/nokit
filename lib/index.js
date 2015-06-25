var path = require('path');

//普通对象
exports.utils = require("./core/utils");
exports.console = require("./core/console");
exports.colors = require("./core/colors");
exports.tp = require("./core/tp");
exports.amd = require("./core/amd");
exports.locale = require("./core/locale");
exports.installPath = path.dirname(module.filename);
//可以实例化的类型
exports.Server = require("./core/server");
exports.Routing = require("./core/routing");
exports.Context = require("./core/context");
exports.Cookie = require("./core/cookie");
exports.Session = require("./core/session");
exports.Pagine = require("./core/pagine");
exports.Logger = require("./core/logger");
exports.Task = require("./core/task");
exports.Class = require("./core/class");
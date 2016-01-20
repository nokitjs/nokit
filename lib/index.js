/* global global */
var path = require('path');
var pkg = require('../package.json');

var self = exports;

//普通对象
self.utils = require("./core/utils");
self.console = require("./core/console");
self.colors = require("./core/colors");
self.tp = require("tpjs");
self.base64 = require("./core/base64");
self.pkg = pkg;
self.env = require("./core/env");
self.$class = require("./core/class");

//可以实例化的类型
self.Server = require("./core/server");
self.Router = require("./core/router");
self.Context = require("./core/context");
self.Cookie = require("./core/cookie");
self.Session = require("./core/session");
self.Logger = require("./core/logger");
self.ViewEngine = require("./core/view-engine");
self.LocaleMgr = require("./core/locale-mgr");
self.Task = require("./core/task");

//定义全局 Nokit 对象
Object.defineProperty(global, pkg.displayName.toLowerCase(), {
	get: function () {
		return self;
	}
});
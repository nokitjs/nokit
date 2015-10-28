/* global global */
var path = require('path');
var pkg = require('../package.json');

//将 exports 赋值给 exports，同时将 nokit 挂在 global
var self = exports;

//普通对象
self.utils = require("./core/utils");
self.console = require("./core/console");
self.colors = require("./core/colors");
self.tp = require("tpjs");
self.locale = require("./core/locale");
self.base64 = require("./core/base64");
self.pkg = pkg;
self.env = require("./core/env");
self.$class = require("./core/class");
//可以实例化的类型
self.Server = require("./core/server");
self.Routing = require("./core/routing");
self.Context = require("./core/context");
self.Cookie = require("./core/cookie");
self.Pagine = require("./core/pagine");
self.Task = require("./core/task");

//定义全局 Noki 对象
Object.defineProperty(global, pkg.rawName, {
	get: function () {
		return self;
	}
});
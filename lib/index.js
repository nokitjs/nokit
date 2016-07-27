/* global global */
const path = require('path');
const pkg = require('../package.json');

const self = exports;

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
self.Response = require("./core/response");
self.Request = require("./core/request");
self.Class = require("cify").Class;

//普通对象
self.utils = require("./core/utils");
self.console = require("./core/console");
self.colors = require("./core/colors");
self.tp = require("tpjs");
self.base64 = require("nb64");
self.pkg = pkg;
self.env = require("./core/env");
self.exitCode = require("./core/exit-code");
self.generator = require("./core/generator");
self.define = require("./core/define");

//定义全局 Nokit 对象
self.utils.defineGetter(global, pkg.displayName.toLowerCase(), function () {
  return self;
});
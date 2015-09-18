var path = require('path');

//将 exports 赋值给 exports，同时将 nokit 挂在 global
var self = global.nokit = exports;

//普通对象
self.utils = require("./core/utils");
self.console = require("./core/console");
self.colors = require("./core/colors");
self.tp = require("tpjs");
self.amd = require("./core/amd");
self.locale = require("./core/locale");
self.base64 = require("./core/base64");
self.info = require("./core/info");
self.env = require("./core/env");
self.$class = require("./core/class");
//可以实例化的类型
self.Server = require("./core/server");
self.Routing = require("./core/routing");
self.Context = require("./core/context");
self.Cookie = require("./core/cookie");
self.Session = require("./core/session");
self.Pagine = require("./core/pagine");
self.Logger = require("./core/logger");
self.Task = require("./core/task");

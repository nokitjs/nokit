/* global __dirname */

var nokit = require("../../");
var self = module.exports;

/**
 * 创建 server 实例
 **/
self.server = new nokit.Server({
  "root": __dirname
});
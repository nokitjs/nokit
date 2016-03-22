var qs = require("querystring");
var BufferHelper = require('bufferhelper');

var Parser = module.exports = function(server) {
  var self = this;
  self.server = server;
};

Parser.prototype.parse = function(context, callback) {
  var req = context.request;
  var bufferHelper = new BufferHelper();
  bufferHelper.load(req, function(err, buffer) {
    if (err) return callback(err);
    var rawBody = buffer.toString();
    req.form = req.body = qs.parse(rawBody) || {};
    callback();
  });
};
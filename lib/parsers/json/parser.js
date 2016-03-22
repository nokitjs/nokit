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
    try {
      req.body = JSON.parse(rawBody || '{}');
      callback();
    } catch (err) {
      callback(err);
    }
  });
};
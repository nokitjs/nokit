const BufferHelper = require('bufferhelper');

const Parser = module.exports = function (server) {
  var self = this;
  self.server = server;
  self.utils = self.server.require("$./core/utils");
};

Parser.prototype.parse = function (context, callback) {
  var self = this;
  var req = context.request;
  var bufferHelper = new BufferHelper();
  bufferHelper.load(req, function (err, buffer) {
    if (err) return callback(err);
    var rawBody = buffer.toString();
    req.form = req.body = {};
    var bodyItems = rawBody.split('\n');
    self.utils.each(bodyItems, function (i, item) {
      var itemParts = (item || '').split('=');
      req.form[itemParts[0]] = itemParts[1];
    });
    callback();
  });
};
var formidable = require('formidable');
var util = require('util');

var Parser = module.exports = function(server) {
  var self = this;
  self.server = server;
};

Parser.prototype.parse = function(context, callback) {
  var req = context.request;
  var form = new formidable.IncomingForm();
  form.multiples = true;
  form.parse(req, function(err, fields, files) {
    if (err) return callback(err);
    req.form = req.body = fields;
    req.files = files;
    callback();
  });
};
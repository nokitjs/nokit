var formidable = require('formidable');
var util = require('util');

var Parser = module.exports = function (server) {
    var self = this;
    self.server = server;
};

Parser.prototype.parse = function (context, callback) {
    var req = context.request;
    var form = new formidable.IncomingForm();
    form.multiples = true;
    form.parse(req, function (err, fields, files) {
        if (err) {
            context.error(err);
        } else {
            req.form = req.formData = req.body = fields;
            req.files = files;
            if (callback) callback();
        }
    });
};
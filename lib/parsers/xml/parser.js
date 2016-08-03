const xml2js = require('xml2js');
const xmlParser = new xml2js.Parser();
const xmlBuilder = new xml2js.Builder();
const BufferHelper = require('bufferhelper');

const Parser = module.exports = function (server) {
  var self = this;
  self.server = server;
};

Parser.prototype.parse = function (context, callback) {
  var req = context.request;
  var bufferHelper = new BufferHelper();
  bufferHelper.load(req, function (err, buffer) {
    if (err) return callback(err);
    var rawBody = buffer.toString();
    xmlParser.parseString(rawBody, function (err, result) {
      if (err) return callback(err);
      req.body = result || {};
      callback();
    });
  });
};

Parser.prototype.write = Parser.prototype.send = function (context, result) {
  var self = this;
  var xml = xmlBuilder.buildObject(result);
  context.send(xml, self.server.mime('.xml'));
};
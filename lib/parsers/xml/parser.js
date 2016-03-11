var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser();
var xmlBuilder = new xml2js.Builder();

var Parser = module.exports = function(server) {
    var self = this;
    self.server = server;
};

Parser.prototype.parse = function(context, callback) {
    var req = context.request;
    //接收数据，这里的 Post Data 只处理表单，不关心文件上传
    req.rawBody = '';
    req.addListener("data", function(chunk) {
        req.rawBody += chunk;
    });
    //--
    req.addListener("end", function() {
        xmlParser.parseString(req.rawBody, function(err, result) {
            req.rawBody = null;
            if (err) {
                return callback(err);
            }
            req.body = result || {};
            if (callback) callback();
        });
    });
};

Parser.prototype.write = Parser.prototype.send = function(context, result) {
    var self = this;
    var xml = xmlBuilder.buildObject(result);
    context.send(xml, self.server.mime('.xml'));
};
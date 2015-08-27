var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var builder = new xml2js.Builder();

var Parser = module.exports = function(server) {
    var self = this;
    self.server = server;
};

Parser.prototype.parse = function(context, callback) {
    var self = this;
    var req = context.request;
    //接收数据，这里的 Post Data 只处理表单，不关心文件上传
    req.rawBody = '';
    req.addListener("data", function(chunk) {
        req.rawBody += chunk;
    });
    //--
    req.addListener("end", function() {
        parser.parseString(req.rawBody, function(err, result) {
            if (err) {
                context.error(ex.message);
            } else {
                req.body = result || {};
                //console.log(JSON.stringify(req.body));
                if (callback) callback();
            }
        });
    });
};

Parser.prototype.content = function(context, result) {
    var self = this;
    var xml = builder.buildObject(result);
    context.content(xml, self.server.mime('.xml'));
};
var Parser = module.exports = function(server) {
    var self = this;
    self.server = server;
};

Parser.prototype.parse = function(context, callback) {
    var self = this;
    var req = context.request;
    //接收数据，这里的 Post Data 只处理表单，不关心文件上传
    req.bodyBuffer = '';
    req.addListener("data", function(chunk) {
        req.bodyBuffer += chunk;
    });
    //--
    req.addListener("end", function() {
        try {
            req.body = JSON.parse(req.bodyBuffer || '{}');
        } catch (ex) {
            context.responseError(ex.message);
        }
        if (callback) callback();
    });
};
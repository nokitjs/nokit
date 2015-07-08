var Parser = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.utils = self.server.require("./core/utils");
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
        if (req.bodyBuffer) {
            req.formData = {};
            var bodyItems = req.bodyBuffer.split('\n');
            self.utils.each(bodyItems, function(i, item) {
                var itemParts = (item || '').split('=');
                req.formData[itemParts[0]] = itemParts[1];
            });
        }
        if (callback) callback();
    });
};
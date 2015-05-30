var markdown = require("./markdown");
var fs = require("fs");

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
};

//处理请求
Handler.prototype.handleRequest = function(context) {
    var self = this;
    fs.exists(context.request.physicalPath, function(exists) {
        if (exists) {
            fs.readFile(context.request.physicalPath, function(err, data) {
                if (err) {
                    context.responseError(err);
                } else {
                    var style = self.readStyle();
                    var body = markdown.toHTML(data.toString());
                    var html = "<html>\r\n<head>\r\n<title>Markdown Preview</title>\r\n<meta charset=\"UTF-8\"/>\r\n<style>\r\n" + style + "\r\n</style>\r\n</head>\r\n<body>\r\n" + body + "\r\n</body>\r\n</html>";
                    context.responseContent(html, self.configs.mimeType['.html']);
                }
            });
        } else {
            context.responseNotFound();
        }
    });
};

//读样式
Handler.prototype.readStyle = function() {
    var self = this;
    if (self.styleCache) {
        return self.styleCache;
    }
    var styleFile = __dirname + "/markdown.css";
    if (fs.existsSync(styleFile)) {
        self.styleCache = fs.readFileSync(styleFile);
    }
    return self.styleCache;
};
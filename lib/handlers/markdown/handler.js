var markdown = require("./markdown");
var fs = require("fs");

var ALLOWED_METHODS = ["GET"];

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
};

//处理请求
Handler.prototype.handle = function(context) {
    var self = this;
    if (context.request.physicalPathExists) {
        // markdown 只允许 get 请求
        if (ALLOWED_METHODS.indexOf(context.request.method) < 0) {
            context.notAllowed();
            return;
        }
        fs.readFile(context.request.physicalPath, function(err, data) {
            if (err) {
                context.error(err);
            } else {
                var style = self.readStyle();
                var body = markdown.toHTML(data.toString());
                var html = "<html>\r\n<head>\r\n<title>Markdown Preview</title>\r\n<meta charset=\"UTF-8\"/>\r\n<style>\r\n" + style + "\r\n</style>\r\n</head>\r\n<body>\r\n" + body + "\r\n</body>\r\n</html>";
                context.content(html, self.server.mime('.html'));
            }
        });
    } else {
        self.transfer(context);
    }
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
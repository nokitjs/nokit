var Context = function(server, req, res) {
    var self = this;
    self.server = server;
    self.request = req;
    self.response = res;
    self.configs = server.configs;
};

Context.prototype.responseError = function(errorMessage) {
    var self = this;
    self.response.writeHead(500, {
        'Content-Type': self.configs.mimeType['.html'],
        'url': self.request.url
    });
    var model = {
        errorMessage: errorMessage,
        server: self.server,
        context: self,
        request: self.request,
        response: self.response
    };
    self.response.end(self.server.responsePages["500"](model));
};

Context.prototype.responseNotFound = function() {
    var self = this;
    self.response.writeHead(404, {
        'Content-Type': self.configs.mimeType['.html'],
        'url': self.request.url
    });
    var model = {
        server: self.server,
        context: self,
        request: self.request,
        response: self.response
    };
    self.response.end(self.server.responsePages["404"](model));
};

Context.prototype.responseContent = function(content, mime) {
    var self = this;
    self.response.writeHead(200, {
        'Content-Type': mime || self.request.mime,
        'url': self.request.url
    });
    self.response.end(content);
};


module.exports = Context;
/*end*/
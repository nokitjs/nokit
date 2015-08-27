var TestHandler = module.exports = function() {};

TestHandler.prototype.handle = function() {
    var self = this;
    self.context.response.setHeader('Content-Type', 'text/html');
    self.context.content("hello nsh");
};
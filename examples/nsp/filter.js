var Filter = module.exports = function() {};

Filter.prototype.onRequestEnd = function(context, next) {
    context.deny();
    //context.content('houfeng', context.server.mime('.html'));
    //next();
};
var Filter = module.exports = function() {};

Filter.prototype.onRequestBegin = function(context, next) {
    context.responseDeny();
    //next();
};
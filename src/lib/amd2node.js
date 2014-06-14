/**
 * 处理define参数
 */
function handleDefineParameters(_id, _deps, _declare) {
    var parameters = null;
    if (_deps && _declare) { //define(a,b,c);
        parameters = {
            id: id,
            deps: _deps,
            declare: _declare
        };
    } else if (_id && _deps) { //define(a,b)
        parameters = {
            deps: _id,
            declare: _deps
        };
    } else if (_id && _declare) { //define(a,null,b)
        parameters = {
            deps: _deps,
            declare: _declare
        };
    } else if (_id) { // define(a)
        parameters = {
            declare: _id
        };
    }
    return parameters;
}

//创建define
exports.define = function(srcModule) {
    return function(_id, _deps, _declare) {
        var parameters = handleDefineParameters(_id, _deps, _declare);
        parameters.declare(srcModule.require, srcModule.exports, srcModule);
    };
};
var http = require("http");
var util = require("util");

function Response(context) {
    var self = this;
    /**
     * 不用调用 http.ServerResponse.call;
     * 在 context 通过 Object.setPrototypeOf 改变 res.prototype.__proto__ 为 Response 的一个实例
     **/
    self.context = context;
};

util.inherits(Response, http.ServerResponse);



module.exports = Response;
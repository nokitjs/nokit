//Http Context
function Context(res,req) {
    this.response = res;
    this.request = req;
};

Context.prototype.respone={};

Context.prototype.request={};

Context.prototype.files=[];
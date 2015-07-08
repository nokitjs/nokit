var nokit = require("../");

/**
 * 分拆命行令参数
 **/

var CommandLine = module.exports = function(options) {
    var self = this;
    self.options = options || {};
    self.parse();
    self._initControlMethod();
}

CommandLine.prototype.parse = function() {
    var self = this;
    //排除 node 和 “当前文件”，拿到真正的所有参数
    var srcArgs = nokit.utils.clone(process.argv);
    srcArgs = srcArgs.splice(2);
    //分拆普通参数和控制参数
    self.controls = [];
    self.args = [];
    srcArgs.forEach(function(item) {
        if (item[0] == '-') {
            self.controls.push(item);
        } else {
            self.args.push(item);
        }
    });
    //如果启用了子命令
    if (self.options.commandEnabled) {
        self.command = self.args[0] || '';
        self.args = self.args.splice(1);
    }
};

CommandLine.prototype._initControlMethod = function() {
    var self = this;
    //控制参数处理
    self.controls.has = function(name) {
        var ctls = self.controls;
        for (var i = 0; i < ctls.length; i++) {
            var item = ctls[i];
            if (item == name || item.split(':')[0] == name) {
                return true;
            }
        }
        return false;
    };
    self.controls.getValue = function(name) {
        var ctls = self.controls;
        if (!ctls.has(name)) return null;
        for (var i = 0; i < ctls.length; i++) {
            var item = ctls[i];
            if (item == name || item.split(':')[0] == name) {
                return item.split(':')[1];
            }
        }
        return null;
    };
};
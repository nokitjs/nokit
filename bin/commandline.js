var nokit = require("../");

/**
 * 分拆命行令参数
 **/

var CommandLine = module.exports = function(opts) {
    var self = this;
    self.opts = opts || {};
    self.parse();
    self.initExtendMethods();
}

CommandLine.prototype.parse = function() {
    var self = this;
    //排除 node 和 “当前文件”，拿到真正的所有参数
    var srcArgs = nokit.utils.clone(process.argv);
    srcArgs = srcArgs.splice(2);
    //分拆普通参数和控制参数
    self.options = [];
    self.args = [];
    //--
    var regExp = new RegExp("^-");
    srcArgs.forEach(function(item) {
        if (regExp.test(item)) {
            self.options.push(item.replace(':', '='));
        } else {
            self.args.push(item);
        }
    });
    //如果启用了子命令
    if (self.opts.commandEnabled) {
        self.command = self.args[0] || '';
        self.args = self.args.splice(1);
    }
};

CommandLine.prototype.initExtendMethods = function() {
    var self = this;
    //控制参数处理
    self.options.has = function(name) {
        for (var i = 0; i < self.options.length; i++) {
            var item = self.options[i];
            if (item == name || item.split('=')[0] == name) {
                return true;
            }
        }
        return false;
    };
    self.options.getValue = function(name) {
        for (var i = 0; i < self.options.length; i++) {
            var item = self.options[i];
            if (item == name || item.split('=')[0] == name) {
                return item.split('=')[1];
            }
        }
        return null;
    };
    self.options.setValue = function(name, value) {
        if (self.options.has(name)) {
            var oldOptions = self.options;
            self.options.splice(0, self.options.length);
            for (var i = 0; i < oldOptions.length; i++) {
                var item = oldOptions[i];
                if (item != name && item.split('=')[0] != name) {
                    self.options.push(item);
                }
            }
        }
        self.options.push(name + "=" + value);
    };
    self.options.getNodeOptions = function() {
        var nodeOptions = [];
        var regExp = new RegExp("^--");
        for (var i = 0; i < self.options.length; i++) {
            var item = self.options[i];
            if (regExp.test(item)) {
                nodeOptions.push(item);
            };
        }
        return nodeOptions;
    };
};
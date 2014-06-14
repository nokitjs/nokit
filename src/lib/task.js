// amd2node 
if (typeof define !== 'function' && module && module.require && module.exports) {
    var define = require('./amd2node').define(module);
}
/**
 * 任务模块
 */
define(function (require, exports, module) {
    "require:nomunge,exports:nomunge,module:nomunge";
    "use strict";
    
    var $class = require("class");
    var utils = require("utils");

    var Task = $class.create({
        "taskList": [],
        "taskCount": 0,
        "$init":function (fns) {
            var self=this;
            self.addMultiple(fns);
        },
        "addMult":function (fns) {
            var self=this;
            utils.each(fns,function (key,fn) {
                self.addOne(key,fn);
            });
            return self;
        },
        "addOne": function (name, fn) {
            var self = this;
            if (!name && !fn) return this;
            if (name && !fn) {
                fn = name;
                name = self.taskList.length;
            }
            self.taskList.push({ "name": name, "func": fn });
            self.taskCount = self.taskList.length;
            self.result.length=self.taskCount;
            return self;
        },
        "add":function (a,b) {
            var self=this;
            if(utils.isString(a)||utils.isFunction(a)){
               return self.addOne(a,b);
            }else {
               return self.addMult(a);
            }
        },
        "reset":function(){
            var self = this;
            self.taskCount = self.taskList.length;
            self.result.length=self.taskCount;
            self.executed=false;
        },
        "result": {},
        "executed":false,
        "execute": function (done, isSeq) {
            var self = this;
            if (self.taskCount < 1 && done && !self.executed) {
                done(self.result);
                self.executed=true;
                return;
            }
            if (self.taskList && self.taskList.length > 0) {
                var task = self.taskList.shift();
                if (utils.isNull(task) || utils.isNull(task.name) || utils.isNull(task.func)) {
                    self.taskCount--;
                    return;
                };
                task.func(function (rs) {
                    self.result[task.name] = rs;
                    self.taskCount--;
                    if (self.once) self.once(task.name, rs);
                    if (self.taskCount < 1 && done) {
                        done(self.result);
                        self.executed=true;
                        return;
                    }
                    if (!self.executed && isSeq){
                        self.execute(done, isSeq);
                    } 
                });
                if (!self.executed && !isSeq){
                    self.execute(done, isSeq);
                } 
            }
            return self;
        },
        "one": function (done) {
            this.once = done;
            return this;
        },
        "seq": function (done) {
            return this.execute(done, true);
        },
        "end": function (done,isSeq) {
            return this.execute(done, isSeq);
        }
    });

    exports.create = function (tasks) {
        return new Task(tasks);
    };

});
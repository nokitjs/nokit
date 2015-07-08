/**
 * Task 模块，提供基础的任务功能;
 * @class Task
 * @static
 * @module mokit
 */

var $class = require("./class");
var utils = require("./utils");

var Task = $class.create({

    "await": 0,
    "list": [],
    "calls": [],
    "state": 0,
    "result": {},

    "initialize": function(fns) {
        var self = this;
        self.list = [];
        self.await = self.list.length;
        self.calls = [];
        self.state = 0;
        self.result = {};
        self.addMult(fns);
    },

    "addMult": function(fns) {
        var self = this;
        utils.each(fns, function(key, fn) {
            self.addOne(key, fn);
        });
        return self;
    },

    "addOne": function(name, fn) {
        var self = this;
        if (!name && !fn) return this;
        if (name && !fn) {
            fn = name;
            name = self.list.length;
        }
        self.list.push({
            "name": name,
            "func": fn
        });
        self.await = self.list.length;
        self.result.length = self.list.length;
        return self;
    },

    /**
     * 向当前对象添加任务 function
     * @method add
     * @param function 或 function 数组，function 可以接收一个 done 参数，用以通知当前任务完成
     * @return {Task} 当前队列实例
     * @static
     */
    "add": function(a, b) {
        var self = this;
        if (utils.isString(a) || utils.isFunction(a)) {
            return self.addOne(a, b);
        } else {
            return self.addMult(a);
        }
    },

    /**
     * 在完一个任务项时调用
     */
    "execute_done": function(isSeq) {
        var self = this;
        if (self.await < 1) {
            self.state = 2;
            //如果执行完成
            utils.each(self.calls, function(i, callback) {
                if (utils.isFunction(callback)) {
                    callback(self.result);
                }
            });
        } else {
            //如果是顺序执行
            if (isSeq) {
                self.execute_start(isSeq);
            }
        }
    },

    /**
     * 启用执行一个任务项
     */
    "execute_start": function(isSeq) {
        var self = this;
        self.state == 1;
        //如果队列为空
        if (self.list && self.list.length < 1) {
            return;
        }
        var task = self.list.shift();
        if (utils.isNull(task) || utils.isNull(task.name) || utils.isNull(task.func)) {
            self.await--;
            self.execute_done(isSeq);
        } else {
            task.func(function(rs) {
                self.await--;
                self.result[task.name] = rs;
                self.execute_done(isSeq);
            });
        }
        //如果是并发执行
        if (!isSeq) {
            self.execute_start(isSeq);
        }
        return self;
    },

    /**
     * 并行执行当前对列
     * @method end
     * @param 完成时的回调
     * @return {Task} 当前队列实例
     * @static
     */
    "end": function(done, isSeq) {
        var self = this;
        //如果队列为空
        if (self.list && self.list.length < 1) {
            if (done) done(self.result);
            return;
        }
        if (self.state == 2) {
            done(self.result);
        } else if (self.state == 1) {
            self.calls.push(done);
        } else if (self.state == 0) {
            self.calls.push(done);
            self.execute_start(isSeq);
        }
        return self;
    },

    /**
     * 顺序执行当前对列
     * @method seq
     * @param 完成时的回调
     * @return {Task} 当前队列实例
     * @static
     */
    "seq": function(done) {
        return this.end(done, true);
    }
});

/**
 * 创建一个任务队列
 * @method create
 * @param 任务 function 或 function 数组，可以省略参数创建一个空队列，function 可以接收一个 done 参数，用以通知当前任务完成。
 * @return {Task} 新队列实例
 * @static
 */
Task.create = function(tasks) {
    return new Task(tasks);
};

module.exports = Task;
/*end*/
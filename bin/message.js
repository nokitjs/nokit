/* global process */
var net = require('net');
var nokit = require("../");
var console = nokit.console;
var utils = nokit.utils;
var exitCode = nokit.exitCode;

var LOCAL_HOST = "127.0.0.1";
var LOCAL_PORT = 20202;
var EXIT_DELAY = 1000;

function Message() {
    var self = this;
    self.messageSended = false;
};

/**
 * 发送进程消息
 */
Message.prototype.send = function (msgList, callback) {
    var self = this;
    if (self.messageSended || !msgList) return;
    var client = new net.Socket();
    client.connect(LOCAL_PORT, LOCAL_HOST, function () {
        //去掉其它信息只保留 type、text
        msgList = msgList.map(function (item) {
            return {
                type: item.type,
                text: item.text
            };
        });
        client.write(JSON.stringify(msgList));
        self.messageSended = true;
        if (callback) callback();
    });
};

/**
 * 等待进程消息
 */
Message.prototype.waiting = function (total) {
    var count = 0;
    var server = net.createServer(function (socket) {
        socket.on('data', function (data) {
            if (data) {
                var list = JSON.parse(data);
                utils.each(list, function (i, item) {
                    console[item.type || 'log'](item.text || item);
                });
            }
            count += 1;
            if (count >= total) {
                /*
                必须关闭连接停止监听，然后再退出 “CLI进程”，
                否则在 windows 上 “守护进程(master)” 和 “工作进程（worker）” 都将受影响退出
                */
                socket.destroy();
                server.close();
                //结束 “CLI进程” 自已
                setTimeout(function () {
                    process.exit(exitCode.NORMAL);
                }, EXIT_DELAY);
            }
        });
    }).listen(LOCAL_PORT);
};

module.exports = Message;
//end
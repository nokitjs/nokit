var net = require('net');
var nokit = require("../");
var console = nokit.console;

var HOST = "127.0.0.1";
var PORT = 20002;

function Message() {
    var self = this;
    self.messageSended = false;
};

/**
 * 发送进程消息
 */
Message.prototype.send = function(msg, callback) {
    var self = this;
    if (self.messageSended) return;
    var client = new net.Socket();
    client.connect(PORT, HOST, function() {
        client.write(JSON.stringify(msg));
        self.messageSended = true;
        if (callback) callback();
    });
};

/**
 * 等待进程消息
 */
Message.prototype.waiting = function(total) {
    var count = 0;
    net.createServer(function(socket) {
        socket.on('data', function(data) {
            count++;
            if (data) {
                var list = JSON.parse(data);
                for (var i in list) {
                    console.log(list[i]);
                }
            }
            if (count >= total) {
                process.exit(0);
            }
        });
    }).listen(PORT);
}

module.exports = Message;
//end
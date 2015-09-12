var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var nokit = require('../');
var env = nokit.env;
var utils = nokit.utils;
var execSync = child_process.execSync;
var packageInfo = nokit.info;

var self = this;

self.win32 = {
    enabled: function(options) {
        options = options || {};
        try {
            this.disabled();
            var restartExecFile = path.normalize(__dirname + '/shim/win32/restart.exe');
            var schtasks = path.normalize(__dirname + '/shim/win32/schtasks-admin.exe');
            /*
            如果需要启动并不登录就能启动 nokit app，需要指定 uid 和 pwd
            所以当 options 包含 uid 和 pwd 时，就创建启动就触发的 '计划任务'
            否则，创建 ‘用户登录’ 触发的 '计划任务'
            */
            var cmd = null;
            if (options.uid && options.pwd) {
                cmd = ['"' + schtasks + '"', '/create', '/tn', packageInfo.name, '/tr', '"' + restartExecFile + '"', '/sc', 'onstart', '/ru', options.uid, '/rp', options.pwd];
            } else {
                cmd = ['"' + schtasks + '"', '/create', '/tn', packageInfo.name, '/tr', '"' + restartExecFile + '"', '/sc', 'onlogon'];
            }
            var result = execSync(cmd.join(' '), {
                encoding: "utf8"
            });
            return "启用设置完成";
        } catch (ex) {
            return ex.message;
        }
    },
    disabled: function(options) {
        options = options || {};
        try {
            var schtasks = path.normalize(__dirname + '/shim/win32/schtasks-admin.exe');
            var cmd = null;
            if (options.uid && options.pwd) {
                cmd = ['"' + schtasks + '"', '/delete', '/tn', packageInfo.name, '/f', '/ru', options.uid, '/rp', options.pwd];
            } else {
                cmd = ['"' + schtasks + '"', '/delete', '/tn', packageInfo.name, '/f'];
            }
            var result = execSync(cmd.join(' '), {
                encoding: "utf8"
            });
            return "禁止设置完成";
        } catch (ex) {
            return ex.message;
        }
    }
};

self.linux = {
    cmd: env.EOL + 'nokit restart &' + env.EOL,
    enabled: function(options) {
        options = options || {};
        try {
            this.disabled();
            var scriptPath = '/etc/rc.local';
            var scriptLines = fs.readFileSync(scriptPath).toString().split(env.EOL);
            var line = scriptLines.length;
            for (var i = 0; i < line; i++) {
                if (utils.trim(scriptLines[i])[0] != '#') {
                    scriptLines[i] = this.cmd + scriptLines[i];
                    break;
                }
            }
            fs.writeFileSync(scriptPath, scriptLines.join(env.EOL));
            return "启用设置完成";
        } catch (ex) {
            return ex.message;
        }
    },
    disabled: function(options) {
        options = options || {};
        try {
            var scriptPath = '/etc/rc.local';
            var script = fs.readFileSync(scriptPath).toString();
            script = utils.replace(script, this.cmd, '');
            fs.writeFileSync(scriptPath, script);
            return "禁止设置完成";
        } catch (ex) {
            return ex.message;
        }
    }
};

self.set = function(state, options) {
    var platform = self[process.platform];
    if (platform) {
        return platform[state == 'on' ? 'enabled' : 'disabled'](options);
    } else {
        return "不支持 " + process.platform + ' 平台';
    }
};
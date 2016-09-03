const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const nokit = require('../');
const env = nokit.env;
const utils = nokit.utils;
const execSync = child_process.execSync;
const pkg = nokit.pkg;

const self = this;

/**
 * linux 平台
 **/
self.linux = {
  cmd: env.EOL + 'nokit recovery &' + env.EOL,
  enabled: function (options) {
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
      return "Startup enabled";
    } catch (ex) {
      return ex.message;
    }
  },
  disabled: function (options) {
    options = options || {};
    try {
      var scriptPath = '/etc/rc.local';
      var script = fs.readFileSync(scriptPath).toString();
      script = utils.replace(script, this.cmd, '');
      fs.writeFileSync(scriptPath, script);
      return "Startup disabled";
    } catch (ex) {
      return ex.message;
    }
  }
};

/**
 * 设置启用状态
 **/
self.set = function (status, options) {
  var platform = self[process.platform];
  if (platform) {
    return platform[status ? 'enabled' : 'disabled'](options);
  } else {
    return 'No support: ' + process.platform;
  }
};
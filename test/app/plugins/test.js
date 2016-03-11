function TestPlugin() { }

TestPlugin.prototype.init = function(server) {
  server.testPlugin = true;
};

module.exports = TestPlugin;
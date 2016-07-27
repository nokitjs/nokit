const Class = require("cify").Class;
const generator = require("./generator");

function define(def) {
  var _Class = new Class(def);
  return generator.wrap(_Class);
};

module.exports = define;
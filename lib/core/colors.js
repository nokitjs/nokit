var codes = {
  'white': 37,
  'grey': 90,
  'black': 30,
  'blue': 34,
  'cyan': 36,
  'green': 32,
  'magenta': 35,
  'red': 31,
  'yellow': 33
};

function Render(code) {
  return function(s) {
    var a = '\x1B[' + code.toString() + 'm' + s + '\x1B[39m';
    return a;
  };
}

var colors = {};
Object.keys(codes).forEach(function(i) {
  colors[i] = new Render(codes[i]);
});

module.exports = colors;
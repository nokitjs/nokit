var detect;
if (process.platform == 'win32') {
    detect = require('./lib/detect-windows');
} else if (process.platform == 'darwin') {
    detect = require('./lib/detect-mac');
} else if (process.platform == 'linux' || process.platform == 'freebsd') {
    detect = require('./lib/detect-linux');
} else {
    detect = require('./lib/detect-stub');
}

module.exports = detect;

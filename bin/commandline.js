/**
 * 分拆命行令参数
 **/

var srcArgs = process.argv.splice(2);
var controls = [];
var args = [];
srcArgs.forEach(function(item) {
    if (item[0] == '-') {
        controls.push(item);
    } else {
        args.push(item);
    }
});
var command = args[0] || '';
args = args.splice(1);

module.exports = {
    "command": command,
    "controls": controls,
    "args": args
};
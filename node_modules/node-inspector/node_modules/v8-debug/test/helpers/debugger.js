function Debugger(port) {
  require('net').createConnection(port)
    .on('connect', console.log.bind(console, 'Debugger connected to port ' + port))
    .on('error', console.error.bind(console))
    .on('close', process.exit.bind(process))
    .setEncoding('utf8');
}

var debugger_ = new Debugger(5858);
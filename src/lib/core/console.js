var fs = require('fs');
var self = exports;


var PREFIX_LOG = "[Nokit][L]: ",
    PREFIX_INFO = "[Nokit][I]: ",
    PREFIX_WARN = "[Nokit][W]: ",
    PREFIX_ERROR = "[Nokit][E]: ";

self.log = function(msg) {
    console.error(PREFIX_LOG + msg);
};

self.info = function(msg) {
    console.error(PREFIX_INFO + msg);
};

self.warn = function(msg) {
    console.error(PREFIX_WARN + msg);
};

self.error = function(msg) {
    console.error(PREFIX_ERROR + msg);
};
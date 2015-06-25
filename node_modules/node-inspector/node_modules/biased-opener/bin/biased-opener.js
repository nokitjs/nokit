#!/usr/bin/env node

var biasedOpener = require('../index');
var argv = require('minimist')(process.argv.slice(2));

function printUsage () {
    console.error("Usage: biased-opener <url>");
    console.error("       biased-opener [--browsers|--browser|-b] 'chrome, chromium, opera' <url>");
    console.error("       biased-opener [--verbose|-v] -- <url>");
    console.error("       biased-opener [--help|-h]");
    console.error("       biased-opener --version");
    process.exit(1);
}

function main () {
    if (argv['version']) {
        console.log( require('../package.json').version );
        return;
    }

    var help = argv['help'] || argv['h'];
    var verbose = argv['verbose'] || argv['v'];
    var url = argv._[0];
    var preferredBrowsers = argv['browsers'] || argv['browser'] || argv['b'] || ['chrome'];

    if (help || !url) {
        printUsage();
        return;
    }

    biasedOpener(url, {
        verbose: verbose,
        preferredBrowsers: preferredBrowsers
    });
}

main();
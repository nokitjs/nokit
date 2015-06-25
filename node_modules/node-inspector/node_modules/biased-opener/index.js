var checkDefaultBrowser = require('x-default-browser');

/**
 * @param Array<String> preferredBrowsers
 * @return Function
 */
function getBrowserFilter (preferredBrowsers) {
    /**
     * @param Object{name, version, type, command} item
     * @return true for browsers present in preferredBrowsers
     */
    return function (item) {
        return (preferredBrowsers.indexOf(item.name) > -1);
    };
}

/**
 * @param Array<String> preferredBrowsers
 * @param Array<Object{name, version, type, command}> availableBrowsers
 * @return String: e.g. "chrome", "opera" or "chromium" or null
 */
function getBrowserCommand (preferredBrowsers, availableBrowsers) {
    var filterFunc = function(browserName) {
        return function(item) {
            return item.name == browserName;
        };
    };

    for (var i = 0; i < preferredBrowsers.length; i++) {
        var browserName = preferredBrowsers[i];
        var gotThatBrowser = availableBrowsers.some(filterFunc(browserName));

        if (gotThatBrowser) {
            return browserName;
        }
    }

    return null;
}

function useBrowserLauncher(url, cfg, cb) {
    var launcher = require('browser-launcher2');
    launcher.detect(function(availableBrowsers) {
        availableBrowsers = availableBrowsers.filter(getBrowserFilter(cfg.preferredBrowsers));
        // console.dir(availableBrowsers);
        // console.dir(cfg.preferredBrowsers);

        if (availableBrowsers.length === 0) {
            var msg = 'No browser matching [' + cfg.preferredBrowsers.toString() + '] found in the system! If this is not true, submit a bug report on https://github.com/benderjs/browser-launcher2';
            if (cfg.verbose){
                console.log(msg);
            }
            return cb(new Error(msg));
        }

        // choose from available browsers in order of preference
        var command = getBrowserCommand(cfg.preferredBrowsers, availableBrowsers);
        launcher(function(err, launch) {
            // checking err makes sense only when passing config, no need to do it here
            var launchCfg = {
                browser: command,
                detached: true // do not block the shell when opening using biased-opener from command line
            };
            launch(url, launchCfg, function(err, instance) {
                if (err) {
                    var msg = 'Unable to start the executable of ' + command;
                    if (cfg.verbose){
                        console.log(msg);
                    }
                    cb(new Error(msg));
                }
                if (cfg.verbose) {
                    console.log('Browser ' + command + ' started with PID:', instance.pid);
                    instance.on('stop', function(code) {
                        console.log('Instance stopped with exit code:', code);
                    });
                }
                if (instance) {
                    instance.process.stdin.unref();
                    instance.stdout.unref();
                    instance.stderr.unref();
                    instance.process.unref();
                }
                cb(null, 'Started ' + command + ' successfully');
            });
        });

    });
}

function isArray (value) {
    return Object.prototype.toString.apply(value) === "[object Array]";
}

function isDefaultBrowserGoodEnough (commonName, preferredBrowsers) {
    return preferredBrowsers.indexOf(commonName) > -1;
}

/**
 * Converts the browsers passed as a string to an array
 * @param {Array<String>|String|null} browsers Comma-separated string with browser names
 * @return {Array<String>|null}
 */
function convertBrowsersToArray (browsers) {
    if (!browsers) {
        return null;
    }
    if (isArray(browsers)) {
        return browsers;
    }

    // allow "a,b,c" and "a, b, c" with spaces
    return browsers.replace(/ /g, '').split(',');
}

/**
 * Opens a URL in some preferred browser if available, and calls the callback.
 * The priority is given to the user's default browser (if it's on the preferred
 * browsers list), then to the first found browser from the list.
 * If none of the preferred browsers is available, it calls the error callback.
 *
 * `cfg` defaults to {verbose:false, preferredBrowsers: ["chrome"]}
 * `cb` defaults (roughly) to console.error
 * @param {String} url
 * @param optional {Object} cfg {verbose: Boolean, preferredBrowsers: Array<String>}
 * @param optional {Function} cb function(error, stdout|okMessage, stderr)
 */
module.exports = function (url, cfg, cb) {
    cfg = cfg || {
        verbose: false,
        preferredBrowsers: ["chrome"]
    };
    cb = cb || (function (err) {
        if (err) console.error(err);
    });
    cfg.preferredBrowsers = convertBrowsersToArray(cfg.preferredBrowsers);
    if (!isArray(cfg.preferredBrowsers)) {
        return cb(new Error("preferredBrowsers has to be an array or a comma-delimited string"));
    }

    checkDefaultBrowser(function(err, browserInfo) {
        if (err || !browserInfo || !browserInfo.commonName) {
            // error when checking for default browser, but browser launcher may work fine
            // the situation when err == null and browserInfo.commonName is undefined should not happen,
            // but let's be defensive here
            if (err && cfg.verbose) {
                console.log('x-default-browser error: ' + err);
                console.log('Trying to use browser-launcher2...');
            }
            return useBrowserLauncher(url, cfg, cb);
        }

        var defaultBrowserName = browserInfo.commonName;
        var goodEnough = isDefaultBrowserGoodEnough(defaultBrowserName, cfg.preferredBrowsers);
        if (goodEnough) {
            // make sure to have default browser as the first one in the preferred browsers array
            var idx = cfg.preferredBrowsers.indexOf(defaultBrowserName);
            if (idx > -1) {
                cfg.preferredBrowsers.splice(idx, 1);
            }
            cfg.preferredBrowsers.unshift(defaultBrowserName);

            if (cfg.verbose) {
                console.log('Using default browser: ' + defaultBrowserName);
            }
            return useBrowserLauncher(url, cfg, cb);
        } else {
            // default browser is not matching the spec
            // let's check if we have some spec-conforming browser in the system
            if (cfg.verbose) {
                console.log('Default browser is ' + defaultBrowserName + '; looking further for browsers matching [' + cfg.preferredBrowsers.toString() + ']...');
            }
            return useBrowserLauncher(url, cfg, cb);
        }
    });
};

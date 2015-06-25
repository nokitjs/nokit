var headless = require( 'headless' ),
	mkdirp = require( 'mkdirp' ),
	os = require( 'os' ),
	fs = require( 'fs' ),
	path = require( 'path' ),
	Uid = require( 'uid' ),
	_ = require( 'lodash' ),
	Instance = require( './instance' ),
	setups = {};

/**
 * Setup procedure for Firefox browser:
 * - create a temporary directory
 * - create and write prefs.js file
 * - collect command line arguments necessary to launch the browser
 * @param  {Object}   browser  Browser object
 * @param  {String}   uri      URI to be opened
 * @param  {Object}   options  Configuration options
 * @param  {Function} callback Callback function
 */
setups.firefox = function( browser, uri, options, callback ) {
	var uid = Uid( 10 ),
		tempDir = path.join( os.tmpdir(), 'browser-launcher2' + uid ),
		file = path.join( tempDir, 'prefs.js' ),
		prefs = {
			'browser.shell.checkDefaultBrowser': false,
			'browser.bookmarks.restore_default_bookmarks': false,
			'dom.disable_open_during_load': false,
			'dom.max_script_run_time': 0
		};

	mkdirp.sync( tempDir );

	options.options = options.options || [];
	options.tempDir = tempDir;

	if ( options.proxy ) {
		var match = /^(?:http:\/\/)?([^:\/]+)(?::(\d+))?/.exec( options.proxy ),
			host = JSON.stringify( match[ 1 ] ),
			port = match[ 2 ] || 80;

		_.extend( prefs, {
			'network.proxy.http': host,
			'network.proxy.http_port': +port,
			'network.proxy.type': 1,
			'browser.cache.disk.capacity': 0,
			'browser.cache.disk.smart_size.enabled': false,
			'browser.cache.disk.smart_size.first_run': false,
			'browser.sessionstore.resume_from_crash': false,
			'browser.startup.page': 0,
			'network.proxy.no_proxies_on': JSON.stringify( options.noProxy || '' )
		} );
	}

	if ( options.prefs ) {
		_.extend( prefs, options.prefs );
	}

	prefs = Object.keys( prefs ).map( function( name ) {
		return 'user_pref("' + name + '", ' + prefs[ name ] + ');';
	} ).join( '\n' );

	fs.writeFile( file, prefs, function( err ) {
		if ( err ) {
			callback( err );
		} else {
			callback( null, options.options.concat( [
				uri,
				'--no-remote',
				'-profile', tempDir
			] ) );
		}
	} );
};

/**
 * Setup procedure for IE and Safari browsers:
 * - pass the URI to the command line arguments
 * @param  {Object}   browser  Browser object
 * @param  {String}   uri      URI to be opened
 * @param  {Object}   options  Configuration options
 * @param  {Function} callback Callback function
 */
setups.ie = setups.safari = function( browser, uri, options, callback ) {
	callback( null, [ uri ] );
};

/**
 * Setup procedure for Chrome browser:
 * - collect command line arguments necessary to launch the browser
 * @param  {Object}   browser  Browser object
 * @param  {String}   uri      URI to be opened
 * @param  {Object}   options  Configuration options
 * @param  {Function} callback Callback function
 */
setups.chrome = function( browser, uri, options, callback ) {
	options.options = options.options || [];

	callback( null, options.options.concat( [
		options.proxy ? '--proxy-server=' + options.proxy : null,
		browser.profile ? '--user-data-dir=' + browser.profile : null,
		'--disable-restore-session-state',
		'--no-default-browser-check',
		'--disable-popup-blocking',
		'--disable-translate',
		'--start-maximized',
		'--disable-default-apps',
		'--disable-sync',
		'--enable-fixed-layout',
		'--no-first-run',
		'--noerrdialogs ',
		uri
	] ).filter( Boolean ) );
};

/**
 * Setup procedure for PhantomJS:
 * - configure PhantomJS to open res/phantom.js script
 * @param  {Object}   browser  Browser object
 * @param  {String}   uri      URI to be opened
 * @param  {Object}   options  Configuration options
 * @param  {Function} callback Callback function
 */
setups.phantom = function( browser, uri, options, callback ) {
	var phantomScript = path.join( __dirname, '../res/phantom.js' );

	options.options = options.options || [];

	callback( null, options.options.concat( [
		options.proxy ? '--proxy=' + options.proxy.replace( /^http:\/\//, '' ) : null,
		phantomScript,
		uri
	] ).filter( Boolean ) );
};

/**
 * Setup procedure for Opera browser:
 * - copy the default preferences file depending on the Opera version
 *   (res/operaprefs.ini or res/Preferences) to the profile directory
 * - collect command line arguments necessary to launch the browser
 * @param  {Object}   browser  Browser object
 * @param  {String}   uri      URI to be opened
 * @param  {Object}   options  Configuration options
 * @param  {Function} callback Callback function
 */
setups.opera = function( browser, uri, options, callback ) {
	var prefs = {
			old: 'operaprefs.ini',
			blink: 'Preferences'
		},
		engine = {
			old: [
				// browser.profile ? '-pd ' + browser.profile : null, // disabled temporarily
				'-nosession',
				'-nomail',
				uri
			],
			// using the same rules as for chrome
			blink: [
				browser.profile ? '--user-data-dir=' + browser.profile : null,
				'--disable-restore-session-state',
				'--no-default-browser-check',
				'--disable-popup-blocking',
				'--disable-translate',
				'--start-maximized',
				'--disable-default-apps',
				'--disable-sync',
				'--enable-fixed-layout',
				'--no-first-run',
				'--noerrdialogs',
				uri
			]
		},
		prefFile = prefs[ major( browser.version ) >= 15 ? 'blink' : 'old' ],
		src = path.join( __dirname, '../res/' + prefFile ),
		dest = path.join( browser.profile, prefFile );

	options.options = options.options || [];

	copy( src, dest, function( err ) {
		if ( err ) {
			callback( err );
		} else {
			callback(
				null,
				options.options.concat(
					engine[ major( browser.version ) >= 15 ? 'blink' : 'old' ]
				).filter( Boolean )
			);
		}
	} );
};

/**
 * Run a browser
 * @param  {Object} config  Configuration object
 * @param  {String} name    Browser name
 * @param  {String} version Browser version
 * @return {Function}
 */
module.exports = function runBrowser( config, name, version ) {
	var browser = findMatch( config, name, version );

	if ( !browser ) {
		return;
	}

	return function( uri, options, callback ) {
		// run a regular browser in a "headless" mode
		if ( options.headless && !browser.headless ) {
			headless( function( err, proc, display ) {
				if ( err ) {
					return callback( err );
				}

				run( {
					DISPLAY: ':' + display
				} );
			} );
		} else {
			run( {} );
		}

		function run( customEnv ) {
			var env = {},
				cwd = process.cwd();

			// copy environment variables
			Object.keys( process.env ).forEach( function( key ) {
				env[ key ] = process.env[ key ];
			} );

			Object.keys( customEnv ).forEach( function( key ) {
				env[ key ] = customEnv[ key ];
			} );

			// setup the browser
			setups[ browser.type ]( browser, uri, options, function( err, args ) {
				if ( err ) {
					return callback( err );
				}

				// pass proxy configuration to the new environment
				if ( options.noProxy && env.no_proxy === undefined ) {
					env.no_proxy = options.noProxy;
				}

				if ( options.proxy && env.http_proxy === undefined ) {
					env.http_proxy = options.proxy;
				}

				if ( options.proxy && env.HTTP_PROXY === undefined ) {
					env.HTTP_PROXY = options.proxy;
				}

				// prepare the launch command for Windows systems
				if ( process.platform === 'win32' ) {
					// ensure all the quotes are removed
					browser.command = browser.command.replace( /"/g, '' );
					// change directory to the app's base (Chrome)
					cwd = require( 'path' ).dirname( browser.command );
				}

				// prepare the launch command for OSX systems
				if ( process.platform === 'darwin' ) {
					// use the binary paths under the hood
					if ( browser.name !== 'firefox' && browser.name !== 'phantomjs' ) {
						// open --wait-apps --new --fresh -a /Path/To/Executable <url> --args <rest of app args>
						args.unshift(
							'--wait-apps',
							'--new',
							'--fresh',
							'-a',
							browser.command,
							args.pop(),
							'--args'
						);

						browser.processName = browser.command;
						browser.command = 'open';
					}
				}

				browser.tempDir = options.tempDir;

				callback( null, new Instance( _.extend( {}, browser, {
					args: args,
					detached: options.detached,
					env: env,
					cwd: cwd
				} ) ) );
			} );
		}
	};
};

/**
 * Copy a file
 * @param {String}   src      Source path
 * @param {String}   dest     Destination path
 * @param {Function} callback Completion callback
 */
function copy( src, dest, callback ) {
	var rs = fs.createReadStream( src ),
		ws = fs.createWriteStream( dest ),
		called = false;

	function done( err ) {
		if ( !called ) {
			called = true;
			callback( err );
		}
	}

	rs.on( 'error', done );
	ws.on( 'error', done );
	ws.on( 'close', function() {
		done();
	} );

	rs.pipe( ws );
}

/**
 * Get the major version
 * @param  {String} version Version string
 * @return {Number}
 */
function major( version ) {
	return +version.split( '.' )[ 0 ];
}

/**
 * In the given configuration find a browser matching specified name and version
 * @param  {Object} config  Configuration object
 * @param  {String} name    Browser name
 * @param  {String} version Browser version
 * @return {Object}
 */
function findMatch( config, name, version ) {
	var matching = config.browsers.filter( function( b ) {
		return b.name === name && matches( b.version, version );
	} ).sort( function( a, b ) {
		return major( b.version ) - major( a.version );
	} );

	if ( matching.length ) {
		return matching[ 0 ];
	}
}

/**
 * Check if the given version matches the pattern
 * @param  {String} version   Browser version string
 * @param  {String} [pattern] Expected version pattern
 * @return {Boolean}
 */
function matches( version, pattern ) {
	if ( pattern === undefined || pattern === '*' ) {
		return true;
	}

	var vs = version.split( '.' ),
		ps = pattern.split( '.' ),
		i;

	for ( i = 0; i < ps.length; i++ ) {
		if ( ps[ i ] === 'x' || ps[ i ] === '*' ) {
			continue;
		}

		if ( ps[ i ] !== vs[ i ] ) {
			return false;
		}
	}

	return true;
}

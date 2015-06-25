var spawn = require( 'child_process' ).spawn,
	winDetect = require( 'win-detect-browsers' ),
	darwin = require( './darwin' ),
	extend = require( 'lodash' ).extend,
	browsers = {
		'google-chrome': {
			name: 'chrome',
			re: /Google Chrome (\S+)/,
			type: 'chrome',
			profile: true,
		},
		'chromium': {
			name: 'chromium',
			re: /Chromium (\S+)/,
			type: 'chrome',
			profile: true,
		},
		'chromium-browser': {
			name: 'chromium',
			re: /Chromium (\S+)/,
			type: 'chrome',
			profile: true,
		},
		'firefox': {
			name: 'firefox',
			re: /Mozilla Firefox (\S+)/,
			type: 'firefox',
			profile: true,
		},
		'phantomjs': {
			name: 'phantomjs',
			re: /(\S+)/,
			type: 'phantom',
			headless: true,
			profile: false,
		},
		'safari': {
			name: 'safari',
			type: 'safari',
			profile: false
		},
		'ie': {
			name: 'ie',
			type: 'ie',
			profile: false
		},
		'opera': {
			name: 'opera',
			re: /Opera (\S+)/,
			type: 'opera',
			image: 'opera.exe',
			profile: true
		}
	},
	winDetectMap = {
		chrome: 'google-chrome',
		chromium: 'chromium-browser'
	};

/**
 * Detect all available browsers on Windows systems.
 * Pass an array of detected browsers to the callback function when done.
 * @param {Function} callback Callback function
 */
function detectWindows( callback ) {
	winDetect( function( found ) {
		var available = found.map( function( browser ) {
			var br = browsers[ winDetectMap[ browser.name ] || browser.name ];

			return extend( {}, {
				name: browser.name,
				command: browser.path,
				version: browser.version
			}, br || {} );
		} );

		callback( available );
	} );
}

/**
 * Check if the given browser is available (on OSX systems).
 * Pass its version and path to the callback function if found.
 * @param {String}   name     Name of a browser
 * @param {Function} callback Callback function
 */
function checkDarwin( name, callback ) {
	if ( darwin[ name ] ) {
		if ( darwin[ name ].all ) {
			darwin[ name ].all( function( err, available ) {
				if ( err ) {
					callback( 'failed to get version for ' + name );
				} else {
					callback( err, available );
				}
			} );
		} else {
			darwin[ name ].version( function( err, version ) {
				if ( version ) {
					darwin[ name ].path( function( err, p ) {
						if ( err ) {
							return callback( 'failed to get path for ' + name );
						}

						callback( null, version, p );
					} );
				} else {
					callback( 'failed to get version for ' + name );
				}
			} );
		}
	} else {
		checkOthers( name, callback );
	}
}

/**
 * Check if the given browser is available (on Unix systems).
 * Pass its version to the callback function if found.
 * @param {String}   name     Name of a browser
 * @param {Function} callback Callback function
 */
function checkOthers( name, callback ) {
	var process = spawn( name, [ '--version' ] ),
		re = browsers[ name ].re,
		data = '';

	process.stdout.on( 'data', function( buf ) {
		data += buf;
	} );

	process.on( 'error', function() {
		callback( 'not installed' );
		callback = null;
	} );

	process.on( 'exit', function( code ) {
		if ( !callback ) {
			return;
		}

		if ( code !== 0 ) {
			return callback( 'not installed' );
		}

		var m = re.exec( data );

		if ( m ) {
			callback( null, m[ 1 ] );
		} else {
			callback( null, data.trim() );
		}
	} );
}

/**
 * Detect all available web browsers.
 * Pass an array of available browsers to the callback function when done.
 * @param {Function} callback Callback function
 */
module.exports = function detect( callback ) {
	var available = [],
		names,
		check;

	if ( process.platform === 'win32' ) {
		return detectWindows( callback );
	} else if ( process.platform === 'darwin' ) {
		check = checkDarwin;
	} else {
		check = checkOthers;
	}

	names = Object.keys( browsers );

	function next() {
		var name = names.shift();

		if ( !name ) {
			return callback( available );
		}

		var br = browsers[ name ];

		check( name, function( err, v, p ) {
			if ( err === null ) {
				if ( Array.isArray( v ) ) {
					v.forEach( function( item ) {
						available.push( extend( {}, br, {
							command: item.path,
							version: item.version
						} ) );
					} );
				} else {
					available.push( extend( {}, br, {
						command: p || name,
						version: v
					} ) );
				}
			}

			next();
		} );
	}

	next();
};

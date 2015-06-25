var mkdirp = require( 'mkdirp' ),
	fs = require( 'fs' ),
	path = require( 'path' ),
	package = require( '../package' ),
	defaultConfigFile = require( 'osenv' ).home() + '/.config/' + package.name + '/config.json';

exports.defaultConfigFile = defaultConfigFile;

/**
 * Read a configuration file
 * @param {String}   [configFile] Path to the configuration file
 * @param {Function} callback     Callback function
 */
exports.read = function( configFile, callback ) {
	if ( typeof configFile === 'function' ) {
		callback = configFile;
		configFile = defaultConfigFile;
	}

	if ( !configFile ) {
		configFile = defaultConfigFile;
	}

	var configDir = path.dirname( configFile );

	mkdirp( configDir, function( err ) {
		if ( err ) {
			return callback( err );
		}

		fs.exists( configFile, function( exists ) {
			if ( exists ) {
				fs.readFile( configFile, function( err, src ) {
					callback( err, JSON.parse( src ), configDir );
				} );
			} else {
				callback( err, null, configDir );
			}
		} );
	} );
};

/**
 * Write a configuration file
 * @param {String}   configFile Path to the configuration file
 * @param {Object}   config     Configuration object
 * @param {Function} callback   Callback function
 */
exports.write = function( configFile, config, callback ) {
	callback = callback || function() {};

	if ( typeof configFile === 'object' ) {
		callback = config;
		config = configFile;
		configFile = defaultConfigFile;
	}

	mkdirp( path.dirname( configFile ), function( err ) {
		if ( err ) {
			return callback( err );
		}

		fs.writeFile( configFile, JSON.stringify( config, null, 2 ), callback );
	} );
};

var mkdirp = require( 'mkdirp' ),
	path = require( 'path' );

/**
 * Create profiles for the given browsers
 * @param  {Array.<Object>} browsers  Array of browsers
 * @param  {String}         configDir Path to a directory, where the profiles should be put
 * @param  {Function}       callback  Callback function
 */
module.exports = function createProfiles( browsers, configDir, callback ) {
	var pending = browsers.length;

	if ( !pending ) {
		return callback();
	}

	function checkPending() {
		return !--pending && callback();
	}

	browsers.forEach( function( browser ) {
		if ( browser.type === 'firefox' && browser.profile ) {
			checkPending();
		} else if ( browser.profile ) {
			browser.profile = makeDir( browser.name, browser.version );

			mkdirp( browser.profile, function( err ) {
				if ( err ) {
					callback( err );
				} else {
					checkPending();
				}
			} );
		} else {
			checkPending();
		}
	} );

	function makeDir( name, version ) {
		var dir = name + '-' + version + '_' + getRandom();

		return path.join( configDir, dir );
	}
};

function getRandom() {
	return Math.random().toString( 16 ).slice( 2 );
}

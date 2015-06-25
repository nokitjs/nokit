var util = require( './util' ),
	currentPath;

function getPath( callback ) {
	if ( currentPath ) {
		return callback( null, currentPath );
	}

	util.find( 'com.google.Chrome', function( err, path ) {
		currentPath = path;
		callback( err, currentPath );
	} );
}

function getVersion( callback ) {
	getPath( function( err, path ) {
		if ( err ) {
			return callback( err, null );
		}

		var pl = util.getInfoPath( path );

		util.exists( pl, function( exists ) {
			if ( exists ) {
				util.parse( pl, function( err, data ) {
					callback( err, data.KSVersion );
				} );
			} else {
				callback( 'not installed', null );
			}
		} );
	} );
}

exports.path = getPath;
exports.version = getVersion;

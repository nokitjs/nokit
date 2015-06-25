var exec = require( 'child_process' ).exec,
	fs = require( 'fs' ),
	path = require( 'path' ),
	plist = require( 'plist' );

exports.exists = require( 'fs' ).exists;

exports.parse = function( file, callback ) {
	fs.readFile( file, {
		encoding: 'utf8'
	}, function( err, data ) {
		if ( !err ) {
			data = plist.parse( data );
		}

		callback( err, data );
	} );
};

exports.find = function( id, callback ) {
	var pathQuery = 'mdfind "kMDItemCFBundleIdentifier=="' + id + '"" | head -1';

	exec( pathQuery, function( err, stdout ) {
		var loc = stdout.trim();

		if ( loc === '' ) {
			loc = null;
			err = 'not installed';
		}

		callback( err, loc );
	} );
};

exports.getInfoPath = function( p ) {
	return path.join( p, 'Contents', 'Info.plist' );
};

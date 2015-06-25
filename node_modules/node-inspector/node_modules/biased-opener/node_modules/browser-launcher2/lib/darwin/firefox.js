var path = require( 'path' ),
	util = require( './util' );

//Fetch all known version of Firefox on the host machine
exports.all = function( callback ) {
	var installed = [],
		pending = 0,
		check = function() {
			if ( !pending ) {
				callback( null, installed );
			}
		};

	util.find( 'org.mozilla.firefox', function( err, p ) {
		if ( p ) {
			var items = p.split( '\n' );
			pending = items.length;
			items.forEach( function( loc ) {
				var infoPath = util.getInfoPath( loc );

				util.exists( infoPath, function( exits ) {
					if ( exits ) {
						util.parse( infoPath, function( err, data ) {
							var o = {
								version: data.CFBundleShortVersionString,
								path: path.join( loc, 'Contents/MacOS/firefox-bin' )
							};
							installed.push( o );
							pending--;
							check();
						} );
					} else {
						pending--;
						check();
					}
				} );
			} );
		} else {
			callback( 'not installed' );
		}
	} );
};

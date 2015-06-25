var launcher = require( '../' );

launcher.detect( function( available ) {
	console.log( 'Available browsers:' );
	console.dir( available );
} );

var launcher = require( '../' );

launcher( function( err, launch ) {
	if ( err ) {
		return console.error( err );
	}

	launch( 'http://cksource.com/', process.env.BROWSER || 'chrome', function( err, instance ) {
		if ( err ) {
			return console.error( err );
		}

		console.log( 'Instance started with PID:', instance.pid );

		setTimeout( function() {
			instance.stop();
		}, 10000 );

		instance.on( 'stop', function( code ) {
			console.log( 'Instance stopped with exit code:', code );
		} );
	} );
} );

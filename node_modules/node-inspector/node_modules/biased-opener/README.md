# biased-opener
 [![Build Status](https://secure.travis-ci.org/jakub-g/biased-opener.png?branch=master)](http://travis-ci.org/jakub-g/biased-opener)

 [![Get it on npm](https://nodei.co/npm/biased-opener.png?compact=true)](https://www.npmjs.org/package/biased-opener)


This module tries to open the provided URL in some of the user-supplied browsers available on the machine.
It prefers the default browser of the user, otherwise it tries all other browsers in the order in which they were passed.

If no conforming browsers found, it doesn't launch anything, just calls the callback with an error.

Tested on Windows 7 64-bit, Windows XP 32-bit, Ubuntu 14.04 64-bit, Mac OS X 10.10 (en-US locale).

It requires nodejs and npm. If you don't have node, grab it at [nodejs.org](https://nodejs.org).
Node installer bundles npm (node package manager)

## Rationale

Certain applications require certain webkit-only features (for instance, Node Inspector).
For that apps, it makes sense to only open a URL in a webkit browser, otherwise tell the user
about the error instead of opening the URL in unsupported browser.


## Usage as a nodejs module

```sh
$ npm install biased-opener
```

```js
var biasedOpener = require('biased-opener');

var url = "http://example.org";
var cfg = {
  verbose: true,
  preferredBrowsers: ['chrome', 'opera'] // comma-delimited string "chrome, opera" is also accepted
};
// if `cfg` is not passed, it defaults to `{ verbose: false, preferredBrowsers: ['chrome'] }`

biasedOpener(url, cfg, function(err) {
    if (err) {
        // didn't find any matching browser, or there was some failure while launching it
    }
});
```


## Usage from command line

```sh
$ npm install -g biased-opener
$ biased-opener -h                             # to see all the options
$ biased-opener --verbose --browsers 'chrome, opera' 'http://example.org'
```

If `--browsers` is not passed, it defaults to `chrome`.

## Recognized browsers

- `chrome`
- `chromium`
- `opera`
- `firefox`
- `safari`
- `ie`


## Linux support

This module was only tested on Ubuntu. Compatibility reports and fixes for other distros are more than welcome!
Use GitHub issues or email: (jakub.g.opensource) (gmail)


## License

MIT © [Jakub Gieryluk](http://jakub-g.github.io)


## Related projects

*   [browser-launcher2](https://github.com/benderjs/browser-launcher2) (cross-platform)
*              [opener](https://github.com/domenic/opener) (cross-platform)

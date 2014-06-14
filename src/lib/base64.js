// ems2node 
if (typeof define !== 'function' && module && module.require && module.exports) {
    var define = require('./ems2node').define(module);
}
/**
 * base64解码与编码
 * @class Base64
 * @static
 * @module mokit
 */
define(function(require, exports, module) {
	"require:nomunge,exports:nomunge,module:nomunge";
	"use strict";

	/*字符串的Base64编码解码*/
	var stringBase64 = {
		base64encodechars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
		base64decodechars: new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
			52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
			15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
			41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1),
		encode: function(str) {
			var out, i, len;
			var c1, c2, c3;
			len = str.length;
			i = 0;
			out = "";
			while (i < len) {
				c1 = str.charCodeAt(i++) & 0xff;
				if (i == len) {
					out += this.base64encodechars.charAt(c1 >> 2);
					out += this.base64encodechars.charAt((c1 & 0x3) << 4);
					out += "==";
					break;
				}
				c2 = str.charCodeAt(i++);
				if (i == len) {
					out += this.base64encodechars.charAt(c1 >> 2);
					out += this.base64encodechars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
					out += this.base64encodechars.charAt((c2 & 0xf) << 2);
					out += "=";
					break;
				}
				c3 = str.charCodeAt(i++);
				out += this.base64encodechars.charAt(c1 >> 2);
				out += this.base64encodechars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
				out += this.base64encodechars.charAt(((c2 & 0xf) << 2) | ((c3 & 0xc0) >> 6));
				out += this.base64encodechars.charAt(c3 & 0x3f);
			}
			return out;
		},
		decode: function(str) {
			var c1, c2, c3, c4;
			var i, len, out;
			len = str.length;
			i = 0;
			out = "";
			while (i < len) {
				do {
					c1 = this.base64decodechars[str.charCodeAt(i++) & 0xff];
				} while (i < len && c1 == -1);
				if (c1 == -1) break;

				do {
					c2 = this.base64decodechars[str.charCodeAt(i++) & 0xff];
				} while (i < len && c2 == -1);
				if (c2 == -1) break;
				out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

				do {
					c3 = str.charCodeAt(i++) & 0xff;
					if (c3 == 61) return out;
					c3 = this.base64decodechars[c3];
				} while (i < len && c3 == -1);
				if (c3 == -1) break;
				out += String.fromCharCode(((c2 & 0xf) << 4) | ((c3 & 0x3c) >> 2));

				do {
					c4 = str.charCodeAt(i++) & 0xff;
					if (c4 == 61) return out;
					c4 = this.base64decodechars[c4];
				} while (i < len && c4 == -1);
				if (c4 == -1) break;
				out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
			}
			return out;
		},
		utf16to8: function(str) {
			var out, i, len, c;
			out = "";
			len = str.length;
			for (i = 0; i < len; i++) {
				c = str.charCodeAt(i);
				if ((c >= 0x0001) && (c <= 0x007f)) {
					out += str.charAt(i);
				} else if (c > 0x07ff) {
					out += String.fromCharCode(0xe0 | ((c >> 12) & 0x0f));
					out += String.fromCharCode(0x80 | ((c >> 6) & 0x3f));
					out += String.fromCharCode(0x80 | ((c >> 0) & 0x3f));
				} else {
					out += String.fromCharCode(0xc0 | ((c >> 6) & 0x1f));
					out += String.fromCharCode(0x80 | ((c >> 0) & 0x3f));
				}
			}
			return out;
		},
		utf8to16: function(str) {
			var out, i, len, c;
			var char2, char3;
			out = "";
			len = str.length;
			i = 0;
			while (i < len) {
				c = str.charCodeAt(i++);
				switch (c >> 4) {
					case 0:
					case 1:
					case 2:
					case 3:
					case 4:
					case 5:
					case 6:
					case 7:
						// 0xxxxxxx
						out += str.charAt(i - 1);
						break;
					case 12:
					case 13:
						// 110x xxxx   10xx xxxx
						char2 = str.charCodeAt(i++);
						out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
						break;
					case 14:
						// 1110 xxxx  10xx xxxx  10xx xxxx
						char2 = str.charCodeAt(i++);
						char3 = str.charCodeAt(i++);
						out += String.fromCharCode(((c & 0x0f) << 12) |
							((char2 & 0x3f) << 6) |
							((char3 & 0x3f) << 0));
						break;
				}
			}
			return out;
		}
	};

	/*Btye的Base64编码解码*/
	var byteBase64 = (function() {
		var hash = {
			'=': 0
		};
		Array.prototype.forEach.call(
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
			function(c, i) {
				hash[c] = i
			});

		function decode(s) {
			var h = hash,
				i = 0,
				j = 0,
				n = s.length,
				bytes = new Uint8Array(n * 6 / 8),
				a1, a2, a3, a4;
			for (; i < n; i += 4, j += 3) {
				a1 = h[s[i]];
				a2 = h[s[i + 1]];
				a3 = h[s[i + 2]];
				a4 = h[s[i + 3]];

				bytes[j] = (a1 << 2) | (a2 >> 4);
				bytes[j + 1] = (a2 << 4) | (a3 >> 2);
				bytes[j + 2] = (a3 << 6) | a4;
			}
			return bytes.subarray(0, j - (s[n - 1] === '=' ? 1 : 0) - (s[n - 2] === '=' ? 1 : 0));
		}

		var encode = typeof importScripts === 'function' ? function(bytes) { //worker
				var dataURL = new FileReaderSync().readAsDataURL(new Blob([bytes])),
					startPos = dataURL.indexOf(',') + 1;

				return dataURL.slice(startPos);
			} : function(bytes, callback) { //browser
				var dataURL, startPos,
					fr = new FileReader;

				fr.onloadend = function() {
					dataURL = fr.result;
					startPos = dataURL.indexOf(',') + 1;
					callback(dataURL.slice(startPos));
				};
				fr.readAsDataURL(new Blob([bytes]));
			};

		return {
			'encode': encode,
			'decode': decode
		};
	})();

	return {
		/**
		 * 对字符串进行Base64编码
		 * @method encodeString
		 * @param {String} str 字符串
		 * @return {String} 编码后字符串
		 */
		'encodeString': stringBase64.encode,

		/**
		 * 对字符串进行Base64解码
		 * @method decodeString
		 * @param {String} str 编码字符串
		 * @return {String} 解码后的字符串
		 */
		'decodeString': stringBase64.decode,

		/**
		 * 对字节数组进行Base64编码
		 * @method encodeBytes
		 * @param {ByteArray} str 字节数组
		 * @return {String} 编码字符串
		 */
		'encodeBytes': byteBase64.encode,

		/**
		 * 对字节数组进行Base64解码
		 * @method decodeBytes
		 * @param {String} str 字符串
		 * @return {ByteArray} 字节数组
		 */
		'decodeBytes': byteBase64.decode
	};
});
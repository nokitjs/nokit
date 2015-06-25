/* Copyright (c) 2013 StrongLoop, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';

var expect = require('chai').expect;

var dataUri = require('..');

describe('encode', function() {
  it('creates from buffer', function() {
    var uri = dataUri.encode(new Buffer('foo', 'utf8'), 'text/plain');
    expect(uri).to.be.a('string');
    expect(uri).to.equal('data:text/plain;base64,Zm9v');
  });

  it('creates from buffer with default mediatype', function() {
    var uri = dataUri.encode(new Buffer('foo', 'utf8'));
    expect(uri).to.be.a('string');
    expect(uri).to.equal('data:application/octet-stream;base64,Zm9v');
  });

  it('creates from string', function() {
    var uri = dataUri.encode('<foo/>', 'text/xml');
    expect(uri).to.be.a('string');
    expect(uri).to.equal('data:text/xml;base64,PGZvby8+');
  });

  it('creates from string with default mediatype', function() {
    // default mediatype
    var uri = dataUri.encode('foo');
    expect(uri).to.be.a('string');
    expect(uri).to.equal('data:text/plain;charset=UTF-8;base64,Zm9v');
  });

  it('throws with null input', function() {
    expect(function() { dataUri.encode(null); })
      .to.throw(/^Invalid input/);
  });

  it('throws with bad input', function() {
    expect(function() { dataUri.encode(12); })
      .to.throw(/^Invalid input/);
  });

});

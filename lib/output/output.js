/*!
 * ENDER - The open module JavaScript framework
 *
 * Copyright (c) 2011-2012 @ded, @fat, @rvagg and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


/******************************************************************************
 * All console `output` modules inhert from this Output object. Each session
 * needs an Output object to print stuff to stdout, this root object contains
 * the basic common functionality while the others implement functionality
 * specific to their `main` functions.
 * We don't use `console` but rather we expect to be passed an `out` object
 * in Output.create() that just needs to have a `print()` method. Normally
 * this is the standard Node 'util' package but it could be anything!
 */

var colors = require('colors')

  , Output = {

    init: function (out, isDebug) {
      this.out = out // an object with a 'print' method, like `require('util')`
      this.isDebug = isDebug
      return this
    }

  , print: function (string) {
      this.out && this.out.print(string)
    }

    // generic method, like console.log, should avoid in favour of more specific 'views'
  , log: function (string) {
      if (typeof string != 'undefined')
        this.print(string)
      this.print('\n')
    }

  , debug: function (string) {
      this.isDebug && this.print('DEBUG: ' + String(string) + '\n')
    }

  , statusMsg: function (string) {
      this.log(string)
    }

  , warnMsg: function (string) {
      this.log(string.grey)
    }

  , repositoryError: function (err, msg) {
      this.log(msg.red)
    }

  , repositoryLoadError: function (err) {
      this.repositoryError(err, 'Something went wrong trying to load NPM!')
    }

  , heading: function (string, meta) {
      this.log(string.yellow + (meta ? (' (' + meta + ')').grey : ''))
      this.log(string.replace(/./g, '-'))
    }

  , welcome: function () {
      this.log("Welcome to ENDER - The open module JavaScript framework".red)
      this.log("-------------------------------------------------------")
    }

  , enderError: function (err) {
      this.log('Error: '.red.bold + err.message.red)
      if (this.isDebug)
        this.log(err.stack)
    }

  , unknownError: function (err) {
      this.enderError(err)
      if (!this.isDebug)
        this.log('Run with --debug to see more information')
    }

  , create: function (out, debug) {
      return Object.create(this).init(out, debug)
    }

}

module.exports = Output
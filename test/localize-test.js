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


var buster          = require('bustermove')
  , assert          = require('referee').assert
  , refute          = require('referee').refute
  , DependencyGraph = require('../lib/dependency-graph')


buster.testCase('localizePackageList', {
    'test leaves standard package list alone': function () {
      assert.equals(DependencyGraph({}, {}).localizePackageList([ 'one', 'two', 'three' ]), [ 'one', 'two', 'three' ], {})
    }

  , 'test strips out versions from names': function () {
      assert.equals(DependencyGraph({}, {}).localizePackageList([ 'one', 'two@0.1.2', 'three@1.2.3' ]), [ 'one', 'two', 'three' ], {})
    }

  , 'test returns local packages for relative paths': function () {
      var originalPackageList = [ 'one', './two', 'three/foo/bar', '/four' ]
        , expectedPackageList = [ 'one', 'two', 'three', 'four' ]
        , graph = {
              'one': {}
            , './two': { packageJSON: { name: 'two' } }
            , 'two': {}
            , 'three/foo/bar': { packageJSON: { name: 'three' } }
            , 'three': {}
            , '/four': { packageJSON: { name: 'four' } }
            , 'four': {}
          }

        assert.equals(DependencyGraph({}, graph).localizePackageList(originalPackageList, graph), expectedPackageList)
    }

  , 'test leaves unlocalizable packages alone': function () {
      var originalPackageList = [ 'one', './two', 'three/foo/bar', '/four' ]
        , expectedPackageList = [ 'one', './two', 'three', '/four' ]
        , graph = {
              'one': {}
            , './two': { packageJSON: { name: 'two' } }
            , 'three/foo/bar': { packageJSON: { name: 'three' } }
            , 'three': {}
            , '/four': { packageJSON: { name: 'four' } }
          }

        assert.equals(DependencyGraph({}, graph).localizePackageList(originalPackageList, graph), expectedPackageList)
    }
})
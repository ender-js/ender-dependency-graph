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
  , packageUtil     = require('ender-package-util')
  , DependencyGraph = require('../')


buster.testCase('constructDependencyGraph', {
    'setUp': function () {
      this.runTest = function (setupGraph, jsons, directories, expectedGraph, done) {
        var packageUtilMock = this.mock(packageUtil)
          , setupExpectations = function (parents, setupGraph) {
              Object.keys(setupGraph).forEach(function (p) {
                if (p == '$id')
                  return
                var id = setupGraph[p].$id || p // for doing special indirection
                if (jsons[id] != 'missing') {
                  packageUtilMock.expects('readPackageJSON')
                    .once()
                    .withArgs(parents, p)
                    .callsArgWith(2, null, jsons[id])
                  packageUtilMock.expects('getDependenciesFromDirectory')
                    [/\//.test(id) ? 'never' : 'once']() // we DON'T want to read node_modules dir for path
                    .withArgs(parents, p)
                    .callsArgWith(2, null, directories[id])
                  setupExpectations(parents.concat([ p ]), setupGraph[p])
                } else {
                  // dir & package.json missing
                  packageUtilMock.expects('readPackageJSON')
                    .once()
                    .withArgs(parents, p)
                    .callsArgWith(2, { code: 'ENOENT' })
                  packageUtilMock.expects('getDependenciesFromDirectory')
                    [/\//.test(id) ? 'never' : 'once']() // we DON'T want to read node_modules dir for path
                    .withArgs(parents, p)
                    .callsArgWith(2, { code: 'ENOENT' })
                }
              })
            }

        packageUtilMock.expects('getDependenciesFromDirectory')
          .once()
          .withArgs([], '.')
          .callsArgWith(2, null, Object.keys(setupGraph).filter(function (p) { return !/\//.test(p) }))
        setupExpectations([], setupGraph)
        DependencyGraph({}, Object.keys(setupGraph), function (err, dependencyGraph) {
          assert.equals(dependencyGraph.graphData, expectedGraph)
          done()
        })
      }
    }

  , 'test no dependencies': function (done) {
      var packages = {
              'pkg1': {}
            , 'some/path/to/pkg2': {}
          }
        , jsons = {
              'pkg1': { name: 'pkg1' }
            , 'some/path/to/pkg2': { name: 'pkg2name' } // name is different to dir, dirname shouldn't matter
          }
        , directories = {
              'pkg1': []
            , 'some/path/to/pkg2': []
          }
        , expectedGraph = {
              'pkg1': {
                  packageJSON: jsons['pkg1']
                , parents: []
                , dependencies: {}
              }
            , 'some/path/to/pkg2': {
                  packageJSON: jsons['some/path/to/pkg2']
                , parents: []
                , dependencies: {}
              }
          }
      this.runTest(packages, jsons, directories, expectedGraph, done)
    }

  , 'test complex dependencies': function (done) {
      var packages = {
              'pkg1': {
                  'foo': { 'bar': {} }
                , 'woohoo': {}
              }
            , 'some/path/to/pkg2': {
                  'wee': {
                      'hee': {
                          'yo': {}
                      }
                  }
                , 'foo': { 'bar': {} }
              }
          }
        , jsons = {
              'pkg1': {
                  name: 'pkg1'
                , dependencies: [ 'foo', 'woohoo' ]
              }
            , 'foo': {
                  name: 'foo'
                , dependencies: [ 'bar' ]
              }
            , 'bar': { name: 'bar' }
            , 'woohoo': { name: 'woohoo' }
            , 'some/path/to/pkg2': {
                  name: 'pkg2name'
                , dependencies: [ 'wee', 'foo' ]
              }
            , 'wee': {
                  name: 'wee'
                , dependencies: [ 'hee' ]
              }
            , 'hee': {
                  name: 'hee'
                , dependencies: [ 'yo' ]
              }
            , 'yo': { name: 'yo' }
          }
        , directories = {
              'pkg1': [ 'foo', 'woohoo' ]
            , 'pkg': [ 'foo', 'woohoo' ]
            , 'some/path/to/pkg2': [ 'wee', 'foo' ]
            , 'foo': [ 'bar' ]
            , 'bar': []
            , 'woohoo': []
            , 'wee': [ 'hee' ]
            , 'hee': [ 'yo' ]
            , 'yo': []
          }
        , expectedGraph = {
              'pkg1': {
                  packageJSON: jsons['pkg1']
                , parents: []
                , dependencies: {
                      'foo': {
                          packageJSON: jsons['foo']
                        , parents: [ 'pkg1' ]
                        , dependencies: {
                              'bar': {
                                  packageJSON: jsons['bar']
                                , parents: [ 'pkg1', 'foo' ]
                                , dependencies: {}
                              }
                          }
                      }
                    , 'woohoo': {
                          packageJSON: jsons['woohoo']
                        , parents: [ 'pkg1' ]
                        , dependencies: {}
                      }
                  }
              }
            , 'some/path/to/pkg2': {
                  packageJSON: jsons['some/path/to/pkg2']
                , parents: []
                , dependencies: {
                      'wee': {
                          packageJSON: jsons['wee']
                        , parents: [ 'some/path/to/pkg2' ]
                        , dependencies: {
                              'hee': {
                                  packageJSON: jsons['hee']
                                , parents: [ 'some/path/to/pkg2', 'wee' ]
                                , dependencies: {
                                      'yo': {
                                          packageJSON: jsons['yo']
                                        , parents: [ 'some/path/to/pkg2', 'wee', 'hee' ]
                                        , dependencies: {}
                                      }
                                  }
                              }
                          }
                      }
                    , 'foo': {
                          packageJSON: jsons['foo']
                        , parents: [ 'some/path/to/pkg2' ]
                        , dependencies: {
                              'bar': {
                                  packageJSON: jsons['bar']
                                , parents: [ 'some/path/to/pkg2', 'foo' ]
                                , dependencies: {}
                              }
                          }
                      }
                  }
              }
          }
      this.runTest(packages, jsons, directories, expectedGraph, done)
    }

  , 'test dependencies with missing directories': function (done) {
      var packages = {
              'pkg1': {
                  'foo': { 'bar': {} }
                , 'woohoo': {}
              }
          }
        , jsons = {
              'pkg1': {
                  name: 'pkg1'
                , dependencies: [ 'foo', 'woohoo' ]
              }
            , 'foo': {
                  name: 'foo'
                , dependencies: [ 'bar' ]
              }
            , 'bar': 'missing'
            , 'woohoo': 'missing'
          }
        , directories = {
              'pkg1': [ 'foo', 'woohoo' ]
            , 'pkg': [ 'foo' ]
            , 'foo': []
          }
        , expectedGraph = {
              'pkg1': {
                  packageJSON: jsons['pkg1']
                , parents: []
                , dependencies: {
                      'foo': {
                          packageJSON: jsons['foo']
                        , parents: [ 'pkg1' ]
                        , dependencies: {
                              'bar': 'missing'
                          }
                      }
                    , 'woohoo': 'missing'
                  }
              }
          }
      this.runTest(packages, jsons, directories, expectedGraph, done)
    }

  , 'test dependencies in scattered directories': function (done) {
      // this test is designed to show that even with missing dependency directories
      // the proper dependency graph can be built if the packages are available in the
      // graph somewhere.
      //
      // the $id awkwardness is so that we can specify the simulation of missing
      // directories & package.json files.
      //
      // see the 'directories' object to see what the simulated directory structure is
      // yet it should be able to piece together the full expectedGraph
      var packages = {
              'pkg1': {
                  'pkg4': { 'pkg6': { $id: 'pkg6-missing' } }
                , 'pkg3': { $id: 'pkg3-missing' }
              }
            , 'pkg2': {}
            , 'pkg3': {}
            , 'pkg5': { 'pkg6': {} }
          }
        , jsons = {
              'pkg1': { name: 'pkg1', dependencies: [ 'pkg4', 'pkg3' ] }
            , 'pkg2': { name: 'pkg2', dependencies: [] }
            , 'pkg3-missing': 'missing'
            , 'pkg3': { name: 'pkg3', dependencies: [] }
            , 'pkg4': { name: 'pkg4', dependencies: [ 'pkg6' ] }
            , 'pkg5': { name: 'pkg5', dependencies: [ 'pkg6' ] }
            , 'pkg6-missing': 'missing'
            , 'pkg6': { name: 'pkg6', dependencies: [] }
          }
        , directories = {
              'pkg1': [ 'pkg4' ]
            , 'pkg2': []
            , 'pkg3': []
            , 'pkg4': []
            , 'pkg5': [ 'pkg6' ]
            , 'pkg6': []
          }
        , expectedGraph = {
              'pkg1': {
                  packageJSON: jsons['pkg1']
                , parents: []
                , dependencies: {
                      'pkg4': {
                          packageJSON: jsons['pkg4']
                        , parents: [ 'pkg1' ]
                        , dependencies: {
                            'pkg6': {
                                packageJSON: jsons['pkg6']
                              , parents: [ 'pkg5' ]
                              , dependencies: {}
                            }
                          }
                      }
                    , 'pkg3': {
                          packageJSON: jsons['pkg3']
                        , parents: []
                        , dependencies: {}
                      }
                  }
              }
            , 'pkg2': {
                  packageJSON: jsons['pkg2']
                , parents: []
                , dependencies: {}
              }
            , 'pkg3': {
                  packageJSON: jsons['pkg3']
                , parents: []
                , dependencies: {}
              }
            , 'pkg5': {
                  packageJSON: jsons['pkg5']
                , parents: []
                , dependencies: {
                      'pkg6': {
                          packageJSON: jsons['pkg6']
                        , parents: [ 'pkg5' ]
                        , dependencies: {}
                      }
                  }
              }
          }
      this.runTest(packages, jsons, directories, expectedGraph, done)
    }
})
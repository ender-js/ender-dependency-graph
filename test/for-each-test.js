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

buster.testCase('forEach', {
    'no dependencies': {
        'setUp': function () {
          this.originalGraph = DependencyGraph({}, {
              'pkg1': {
                  dependencies: {}
                , packageJSON: { name: 'pkg1' }
                , parents: [ 'foo' ]
              }
            , 'some/path/to/pkg2': {
                  dependencies: {}
                , packageJSON: { name: 'pkg2' }
                , parents: [ 'foo', 'bar' ]
              }
          })
          this.callSpy = this.spy()

          this.verifySpy = function () {
            assert.equals(this.callSpy.callCount, 2)
            assert.equals(this.callSpy.getCall(0).args[0], 'pkg1')
            assert.equals(this.callSpy.getCall(0).args[1], [ 'foo' ])
            assert.equals(this.callSpy.getCall(0).args[2], this.originalGraph.graphData['pkg1'])
            assert.equals(this.callSpy.getCall(1).args[0], 'some/path/to/pkg2')
            assert.equals(this.callSpy.getCall(1).args[1], [ 'foo' , 'bar' ])
            assert.equals(this.callSpy.getCall(1).args[2], this.originalGraph.graphData['some/path/to/pkg2'])
          }
        }

      , 'test forEachUniqueOrderedDependency': function () {
          this.originalGraph.forEachUniqueOrderedDependency(this.originalGraph.allRootPackages(), this.callSpy)
          this.verifySpy()
        }

      , 'test forEachOrderedDependency': function () {
          // should do the same thing
          this.originalGraph.forEachOrderedDependency(this.originalGraph.allRootPackages(), this.callSpy)
          this.verifySpy()
        }
    }

  , 'simple dependencies': {
        'setUp': function () {
          this.originalGraph = DependencyGraph({}, {
              'apkg-2': {
                  parents: []
                , packageJSON: { name: 'apkg-2', dependencies: { 'mypkg-1': '*' } }
                , dependencies: {
                      'mypkg-1': {
                          parents: [ 'apkg-2' ]
                        , packageJSON: { name: 'mypkg-1' }
                        , dependencies: {}
                      }
                  }
              }
            , 'somepkg-5': {
                  parents: []
                , packageJSON: { name: 'somepkg-5', dependencies: { 'foo-4': '*' } }
                , dependencies: {
                      'foo-4': {
                          parents: [ 'somepkg-5' ]
                        , packageJSON: { name: 'foo-4', dependencies: { 'bar-3': '*' } }
                        , dependencies: {
                            'bar-3': {
                                parents: [ 'somepkg-5', 'foo-4' ]
                              , packageJSON: { name: 'bar-3' }
                              , dependencies: {}
                            }
                          }
                      }
                  }
              }
            , 'apkg-7': {
                  parents: []
                , packageJSON: { name: 'apkg-7', dependencies: { 'mypkg-6': '*' } }
                , dependencies: {
                      'mypkg-6': {
                          parents: [ 'apkg-7' ]
                        , packageJSON: { name: 'mypkg-6' }
                        , dependencies: {}
                      }
                  }
              }
          })
          this.callSpy = this.spy()
          this.verifySpy = function () {
            assert.equals(this.callSpy.args.length, 7)

            this.callSpy.args.forEach(function (c, i) {
              assert.equals(c[3], i)
              refute.isNull(c[2])
              refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
              assert.same(c[1], c[2].parents)
              assert.match(c[0], new RegExp('-' + (++i) + '$'))
            })
          }
        }

      , 'test forEachUniqueOrderedDependency': function () {
          this.originalGraph.forEachUniqueOrderedDependency(this.originalGraph.allRootPackages(), this.callSpy)
          this.verifySpy()
        }

      , 'test forEachOrderedDependency': function () {
          // should do the same thing
          this.originalGraph.forEachOrderedDependency(this.originalGraph.allRootPackages(), this.callSpy)
          this.verifySpy()
        }
    }

  , 'ender-js at front': {
        'setUp': function () {
          this.originalGraph = DependencyGraph({}, {
              'apkg-3': {
                  parents: []
                , packageJSON: { name: 'apkg-3', dependencies: { 'mypkg-2': '*' } }
                , dependencies: {
                      'mypkg-2': {
                          parents: [ 'apkg-3' ]
                        , packageJSON: { name: 'mypkg-2' }
                        , dependencies: {}
                      }
                  }
              }
            , 'somepkg-4': {
                  parents: []
                , packageJSON: { name: 'somepkg-4' }
                , dependencies: {}
              }
            , 'ender-js': {
                  parents: []
                , packageJSON: { name: 'ender-js' }
                , dependencies: {}
              } // it should spit this out first
            , 'apkg-6': {
                  parents: []
                , packageJSON: { name: 'apkg-6', dependencies: { 'mypkg-5': '*' } }
                , dependencies: {
                      'mypkg-5': {
                          parents: [ 'apkg-6' ]
                        , packageJSON: { name: 'mypkg-5' }
                        , dependencies: {}
                      }
                  }
              }
          })
          this.callSpy = this.spy()
          this.verifySpy = function () {
            assert.equals(this.callSpy.args.length, 6)

            this.callSpy.args.forEach(function (c, i) {
              assert.equals(c[3], i)
              refute.isNull(c[2])
              refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
              assert.same(c[1], c[2].parents)
              if (!i) {
                assert.equals(c[0], 'ender-js')
                assert.same(c[2], this.originalGraph.graphData['ender-js'])
              } else
                assert.match(c[0], new RegExp('-' + (++i) + '$'))
            }.bind(this))
          }
        }

      , 'test forEachUniqueOrderedDependency': function () {
          this.originalGraph.forEachUniqueOrderedDependency(this.originalGraph.allRootPackages(), this.callSpy)
          this.verifySpy()
        }

      , 'test forEachOrderedDependency': function () {
          // should do the same thing
          this.originalGraph.forEachOrderedDependency(this.originalGraph.allRootPackages(), this.callSpy)
          this.verifySpy()
        }
    }

  , 'duplicate dependencies': {
        'setUp': function () {
          this.originalGraph = DependencyGraph({}, {
              'apkg-6': {
                  parents: []
                , packageJSON: { name: 'apkg-6', dependencies: { 'mypkg-5': '*' } }
                , dependencies: {
                      'mypkg-5': {
                          parents: [ 'apkg-6' ]
                        , packageJSON: { name: 'mypkg-5', dependencies: { 'apkg-2': '*', 'apkg-4': '*' } }
                        , dependencies: {
                              'apkg-2': {
                                  parents: [ 'apkg-6', 'mypkg-5' ]
                                , packageJSON: { name: 'apkg-2', dependencies: { 'mypkg-1': '*' } }
                                , dependencies: {
                                      'mypkg-1': {
                                          parents: [ 'apkg-6', 'mypkg-5', 'apkg-2' ]
                                        , packageJSON: { name: 'mypkg-1' }
                                        , dependencies: {}
                                      }
                                  }
                              }
                            , 'apkg-4': {
                                  parents: [ 'apkg-6', 'mypkg-5' ]
                                , packageJSON: { name: 'apkg-4', dependencies: { 'mypkg-3': '*' } }
                                , dependencies: {
                                      'mypkg-3': {
                                          parents: [ 'apkg-6', 'mypkg-5', 'apkg-4' ]
                                        , packageJSON: { name: 'mypkg-3' }
                                        , dependencies: {}
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
            , 'somepkg-9': {
                  parents: []
                , packageJSON: { name: 'somepkg-9', dependencies: { 'foo-8': '*', 'mypkg-3': '*' } }
                , dependencies: {
                      'foo-8': {
                          parents: [ 'somepkg-9' ]
                        , packageJSON: { name: 'foo-8', dependencies: { 'bar-7': '*' } }
                        , dependencies: {
                            'bar-7': {
                                parents: [ 'somepkg-9', 'foo-8' ]
                              , packageJSON: { name: 'bar-7' }
                              , dependencies: {}
                            }
                          }
                      }
                    , 'mypkg-3': {
                          parents: [ 'somepkg-9' ]
                        , packageJSON: { name: 'mypkg-3' }
                        , dependencies: {}
                      }
                  }
              }
            , 'apkg-2': {
                  parents: []
                , packageJSON: { name: 'apkg-2', dependencies: { 'mypkg-1': '*' } }
                , dependencies: {
                      'mypkg-1': {
                          parents: [ 'apkg-2' ]
                        , packageJSON: { name: 'mypkg-1' }
                        , dependencies: {}
                      }
                  }
              }
            , 'lastpkg-10': {
                  parents: []
                , packageJSON: { name: 'lastpkg-10' }
                , dependencies: {}
              }
          })
          this.callSpy = this.spy()
        }

        // we should only see unique packages here, they have numbers in their names so we can match them
        // easily
      , 'test forEachUniqueOrderedDependency': function () {
          this.originalGraph.forEachUniqueOrderedDependency(this.originalGraph.allRootPackages(), this.callSpy)

          // expect only uniques
          assert.equals(this.callSpy.args.length, 10)

          this.callSpy.args.forEach(function (c, i) {
            assert.equals(c[3], i)
            refute.isNull(c[2])
            refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
            assert.same(c[1], c[2].parents)
            assert.match(c[0], new RegExp('-' + (++i) + '$'))
          })
        }

        // in this case we should see all packages in order, not just uniques, but we should get an argument
        // for uniqueness
      , 'test forEachOrderedDependency': function () {
          var expectedPackages =
              'mypkg-1 apkg-2 mypkg-3 apkg-4 mypkg-5 apkg-6 bar-7 foo-8 mypkg-3 somepkg-9 mypkg-1 apkg-2 lastpkg-10'
              .split(' ')
            , orderedIndex = 1

          this.originalGraph.forEachOrderedDependency(this.originalGraph.allRootPackages(), this.callSpy)

          assert.equals(this.callSpy.args.length, expectedPackages.length)

          this.callSpy.args.forEach(function (c, i) {
            // use 'orderedIndex' to check if the current package is a dupe or not according to the
            // package name
            var expectedIsUnique = new RegExp('-' + orderedIndex + '$').test(c[0])
            if (expectedIsUnique)
              orderedIndex++
            assert.equals(c[3], i)
            refute.isNull(c[2])
            refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
            assert.same(c[1], c[2].parents)
            assert.equals(c[0], expectedPackages[i])
            assert.equals(c[4], expectedIsUnique, 'index ' + i + ' ' + c[0])
          })
        }
    }

  , 'additional unnecessary dependencies': {
        'setUp': function () {
          this.originalGraph = DependencyGraph({}, {
              'apkg-2': {
                  parents: []
                , packageJSON: { name: 'apkg-2', dependencies: { 'mypkg-1': '*' } }
                , dependencies: {
                      'mypkg-1': {
                          parents: [ 'apkg-2' ]
                        , packageJSON: { name: 'mypkg-1' }
                        , dependencies: {}
                      }
                  }
              }
            , 'somepkg-5': {
                  parents: []
                , packageJSON: { name: 'somepkg-5', dependencies: { 'foo-4': '*' } }
                , dependencies: {
                      'foo-4': {
                          parents: [ 'somepkg-5' ]
                        , packageJSON: { name: 'foo-4', dependencies: { 'bar-3': '*' } }
                        , dependencies: {
                            'bar-3': {
                                parents: [ 'somepkg-5', 'foo-4' ]
                              , packageJSON: { name: 'bar-3' }
                              , dependencies: {}
                            }
                          }
                      }
                  }
              }
            , 'apkg-7': {
                  parents: []
                , packageJSON: { name: 'apkg-7', dependencies: { 'mypkg-6': '*' } }
                , dependencies: {
                      'mypkg-6': {
                          parents: [ 'apkg-7' ]
                        , packageJSON: { name: 'mypkg-6' }
                        , dependencies: {}
                      }
                  }
              }
          })
          this.callSpy = this.spy()
          this.verifySpy = function () {
            assert.equals(this.callSpy.args.length, 5)

            this.callSpy.args.forEach(function (c, i) {
              assert.equals(c[3], i)
              refute.isNull(c[2])
              refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
              assert.same(c[1], c[2].parents)
              assert.match(c[0], new RegExp('-' + (++i) + '$'))
            })
          }
        }

      , 'test forEachUniqueOrderedDependency': function () {
          this.originalGraph.forEachUniqueOrderedDependency([ 'apkg-2', 'somepkg-5' ], this.callSpy)
          this.verifySpy()
        }

      , 'test forEachOrderedDependency': function () {
          // should do the same thing
          this.originalGraph.forEachOrderedDependency([ 'apkg-2', 'somepkg-5' ], this.callSpy)
          this.verifySpy()
        }
    }
})
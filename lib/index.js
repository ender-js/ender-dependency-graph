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
 * Build a DependencyGraph object that represents a complete graph of
 * dependencies that exist in node_modules and in any paths that have been
 * specified as packages.
 * See the tests for what the data structure looks like.
 */

const async           = require('async')
    , packageUtil     = require('ender-package-util')
    , DependencyGraph = require('./dependency-graph')

    // Called for each root package and each sub-package within those packages node_modules
    // directories, and so on down all the way. We get dependencies from the package.json
    // files and also the directories inside node_modules
  , processPackage = function (parents, graphData, processSubgraph, pkg, callback) {
      var name = packageUtil.cleanName(pkg)

        , getJSONData = function (callback) {
            // get dependency list from package.json
            packageUtil.readPackageJSON(parents, name, function (err, json) {
              if (err) return callback(err) // wrapped in package-util.js
              callback(null, {
                  data         : json
                , dependencies : packageUtil.getDependenciesFromJSON(json)
              })
            })
          }

        , getDirectoryDependencies = function (callback) {
            // dependency list from the package's node_modules directory

            if (packageUtil.isPath(name)) {
              // not installed under ./node_modules/, 'name' is a dir, so don't fetch deps from dir/node_modules
              return callback(null, { dependencies: [] })
            }

            packageUtil.getDependenciesFromDirectory(parents, name, function (err, dependencies) {
              if (err) return callback(err) // wrapped in package-util.js
              callback(null, { dependencies: dependencies })
            })
          }

        , finish = function (err, data) {
            var childPackages

            if (err) {
              if (err.code == 'ENOENT') {
                graphData[name] = 'missing'
                return callback()
              }
              return callback(err) // wrapped in package-util.js (see getJSONData & getDirectoryDependencies)
            }

            // we have the data, now do something with it
            graphData[name] = {
                packageJSON  : data.json.data
              , dependencies : {} // init as empty
              , parents      : parents.slice(0) // make a copy of parents array
            }

            // concat dependencies in node_modules with those in package.json but don't duplicate
            childPackages = data.dir.dependencies.concat(data.json.dependencies.filter(function (p) {
              return data.dir.dependencies.indexOf(p) == -1
            }))

            // processSubgraph() is actually just constructDependencyGraphPart()
            processSubgraph(
                parents.concat([ pkg ])
              , graphData[name].dependencies
              , childPackages
              , callback
            )
          }

      if (graphData[name]) return callback() // already done this part of the graph

      async.parallel(
          {
              json : getJSONData
            , dir  : getDirectoryDependencies
          }
        , finish
      )
    }

    // recursive function, called for each node
  , constructDependencyGraphPart = function (memoizedProcessor, parents, graphData, childPackages, callback) {
      async.forEach(
          childPackages
        , memoizedProcessor.bind(null, parents, graphData, constructDependencyGraphPart.bind(null, memoizedProcessor))
        , callback
      )
    }

    // will return a *complete* dependency graph of ./package.json and ./node_modules,
    // we may not want everything in the result so we need to walk the graph using the
    // forEach*() methods below
  , constructDependencyGraph = function (options, packages, callback) {
      var graphData = {}

          // This bit of unfortunate complexity needs some explaination: we have 2 paths in our
          // dep graph construction, we search ./node_modules/* and we individually search through
          // the `packages` list--this leads to duplication of directory & package.json reads.
          // Even though this doesn't lead to a corrupt dep graph, the duplication is overhead
          // we can do without. The cleanest way is to memoize the processPackage() function and
          // make sure duplicate calls to it with the same `parents` and `pkg` arguments are
          // only handled once. This memoized function is passed around, it's only useful for
          // individual calls to `constructDependencyGraph()`.
        , memoizedProcessor = async.memoize(
              processPackage
            , function (parents, _t, _p, pkg) {
                // just a hash string to match duplicate `parents` and `pkg` arguments
                return [''].concat(parents.concat([pkg, ''])).join('$$')
              }
          )

          // a special case of the CWD, in case we are in a package to be included, if we
          // didn't do this then a plain `ender build` wouldn't work.
          // even though this will result in a double-scan of node_modules, processPackage()
          // won't allow duplicate scans below that.
        , scanRootDirectory = function (callback) {
            packageUtil.getDependenciesFromDirectory([], '.', function (err, dependencies) {
              if (err) return callback(err) // wrapped in package-utils.js
              constructDependencyGraphPart(memoizedProcessor, [], graphData, dependencies, callback)
            })
          }
        , collectGraphParts = function (part, store) {
            Object.keys(part).forEach(function (k) {
              if (typeof part[k].dependencies == 'object') {
                (store[k] || (store[k] = [])).push(part[k])
                collectGraphParts(part[k].dependencies, store)
              }
            })
          }
        , completeGraphParts = function (part, store) {
            Object.keys(part).forEach(function (k) {
              if (part[k] !== 'missing') return completeGraphParts(part[k].dependencies, store)
              if (store[k]) part[k] = store[k][0]
            })
          }
          // using collectGraphParts() and completeGraphParts() we first assemble a flat collection of
          // all packages by name, then we walk the full graph again and fill in any gaps where packages
          // may have dependencies that exist elsewhere in ther graph--npm doesn't always give us a
          // complete graph where there are duplicates so we have to go looking.
          // we end up with a graph that can contain many duplicates but it's a complete graph.
        , completeGraph = function () {
            var flattened = {}
              , dependencyGraph
            collectGraphParts(graphData, flattened)
            completeGraphParts(graphData, flattened)
            dependencyGraph = DependencyGraph(options, graphData)
            callback(null, dependencyGraph)
          }

      async.parallel(
          [ scanRootDirectory, constructDependencyGraphPart.bind(null, memoizedProcessor, [], graphData, packages) ]
        , function (err) {
            if (err) return callback(err) // wrapped in package-util.js
            completeGraph()
          }
      )
    }

module.exports                      = constructDependencyGraph
module.exports.create               = DependencyGraph
module.exports.getClientPackageName = DependencyGraph.getClientPackageName
module.exports.archyTree            = require('./archy-tree')
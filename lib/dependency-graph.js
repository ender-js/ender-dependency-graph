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

const packageUtil = require('ender-package-util')
    , defaultRootPackage = 'ender-js'

var getClientPackageName = function (options) {
      return options['client-lib'] || defaultRootPackage
    }

  , DependencyGraph = {
        init: function (options, graphData) {
          this.options  = options
          this.graphData = graphData
          return this
        }

        // recursive walk over the dependency graph, invoke the callback on each
        // leaf node, starting depth-first in key-order, which should give us the
        // correctly ordered dependencies
        // this may trigger the callback on duplicate packages (although the last
        // argument of the callback is a uniqueness indicator)
      , forEachOrderedDependency: function (packages, callback, _unique, _graphData, _pkglist) {
          var ejs
            , findPackage = function (name) {
                var k
                if (_graphData[name]) return _graphData[name]
                for (k in _graphData) {
                  if (_graphData[k].packageJSON.name == name) return _graphData[k]
                }
              }

          // _graphData, _unique & _pkglist are for internal use

          if (!_graphData) _graphData = this.graphData
          if (!_pkglist) { // first call, do top-level stuff
            ejs = packages.indexOf(getClientPackageName(this.options))
            // take root package from where it is and put it at the front
            if (ejs > 0) packages.splice(0, 0, packages.splice(ejs, 1)[0])
            _pkglist = []
          }
          packages.forEach(function (p) {
            var isUnique = _pkglist.indexOf(p) == -1
              , pkg

            if (isUnique || !_unique) {
              pkg = findPackage(p)
              if (pkg.dependencies && pkg.packageJSON.dependencies) {
                this.forEachOrderedDependency(
                    Object.keys(pkg.packageJSON.dependencies)
                  , callback
                  , _unique
                  , pkg.dependencies
                  , _pkglist
                )
              }
              callback(p, pkg.parents, pkg, _pkglist.length, isUnique) // _pkglist.length tells us the call index
              _pkglist.push(p)
            }
          }.bind(this))
        }

        // does the same as the above but doesn't trigger the callback for packages that have
        // already been passed.
        // this is for SourceBuild assembling
      , forEachUniqueOrderedDependency: function (packages, callback) {
          return this.forEachOrderedDependency(packages, callback, true)
        }

        // gives a list of packages by proper name from package.json, turns a path into a package name
      , localizePackageList: function (packages) {
          return packages.map(function (p) {
            return packageUtil.isPath(p)
                && typeof this.graphData[p] == 'object'
                && this.graphData[p].packageJSON
                && this.graphData[p].packageJSON.name
                && this.graphData[this.graphData[p].packageJSON.name]
              ? this.graphData[p].packageJSON.name
              : packageUtil.cleanName(p)
            }.bind(this))
          }

      , allRootPackages: function () {
          return Object.keys(this.graphData)
        }
    }

    // take existing graph data and instantiate a DependencyGraph object
  , create = function (options, graphData) {
      return Object.create(DependencyGraph).init(options, graphData)
    }

module.exports                      = create
module.exports.getClientPackageName = getClientPackageName
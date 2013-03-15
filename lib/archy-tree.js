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

const archy = require('archy')
require('colors')

// We use `archy` to print the tree but we have to turn our dependency tree into an
// archy-compatible tree.
// The 'preparePretty' argument will properly prepare the tree for stdout, otherwise
// it's a fairly plain structure that can be used for any type of output

var prepareTree = function (tree) {
      tree.nodes.forEach(prepareTree)
      if (tree.version) {
        tree.label =
            (tree.label + '@' + tree.version)[tree.first ? 'yellow' : 'grey']
          + ' - '[tree.first ? 'white' : 'grey']
          + (tree.description || '')[tree.first ? 'white' : 'grey']
      } else if (!tree.heading)
        tree.label = (tree.label + ' - ' + 'MISSING').red
      return tree
    }

  , buildArchyTree = function (packages, dependencyGraph, preparePretty) {
      var archyTree     = { label: 'Active packages:', nodes: [], heading: true }
        , localPackages = dependencyGraph.localizePackageList(packages)

      dependencyGraph.forEachOrderedDependency(localPackages, function (packageName, parents, data, index, first) {
        var archyTreeNode = archyTree
          , found
          , newNode
          , regexp
          , i
          , j

        parents = (parents || []).concat([ packageName ])

        for (i = 0; i < parents.length; i++) {
          found  = false
          regexp = new RegExp('^(.\\[\\d\\dm)?' + parents[i] + '(?:@.*)?$')

          for (j = 0; j < archyTreeNode.nodes.length; j++) {
            if (regexp.test(archyTreeNode.nodes[j].label)) {
              found         = true
              archyTreeNode = archyTreeNode.nodes[j]
              break
            }
          }

          if (!found) {
            archyTreeNode.nodes.push(newNode = { label: parents[i], nodes: [] })
            archyTreeNode = newNode
          }
        }

        if (!archyTreeNode.version) {
          archyTreeNode.first       = first
          if (data && data.packageJSON) {
            archyTreeNode.version     = data.packageJSON.version
            archyTreeNode.description = data.packageJSON.description
          }
        }
      })

      return preparePretty ? archy(prepareTree(archyTree)) : archyTree
    }

module.exports = buildArchyTree
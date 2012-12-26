#!/usr/bin/env node

const DependencyGraph = require('../')

var args    = process.argv.slice(2)
  , options = {}

  , printUsage = function () {
      console.error('Usage: ender-dependency-graph [--client-lib <client lib name>] <package1>[, <package2>[, <package3>]]')
    }

if (!args.length)
  return printUsage()

if (args[0] == '--client-lib') {
  args.shift()
  if (args.length < 2)
    return printUsage()
  options['client-lib'] = args.shift()
}

DependencyGraph(options, args, function (err, dependencyGraph) {
  if (err) throw err

  
  console.log(DependencyGraph.archyTree(args, dependencyGraph, true))
})
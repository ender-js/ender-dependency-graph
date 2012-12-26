# Ender Dependency Graph [![Build Status](https://secure.travis-ci.org/ender-js/ender-dependency-graph.png)](http://travis-ci.org/ender-js/ender-dependency-graph)

A component of the [Ender CLI](https://github.com/ender-js/Ender/), used to build a dependency graph of installed packages given a list of parent packages.

Similar to the `npm ls` command, this package understands Ender-specific packages by using [ender-package-util](https://github.com/ender-js/ender-package-util/) to interpret the *package.json* files (which may contain Ender-specific overrides for some root keys).

The `DependencyGraph` object returned by this package can be used to iterate over packages in the dependency graph. This is used for package-bundling in the Ender CLI.

The *ender-js* package (or alternative client-lib, supplied with the `'client-lib'` option), where it exists in the list of packages, will be automatically shifted to the top of the dependency graph so it is always processed first.

## About Ender

For more information checkout [http://ender.jit.su](http://ender.jit.su)

## API

### enderDependencyGraph(options, packages, callback)
`enderDependencyGraph()` called as a function, will construct a `DependencyGraph` object for the given list of packages, working in the current working directory, and return it to via the `callback` function.

The `options` object may contain an optional `'client-lib'` key that will override the default `'ender-js'`. The client-lib will be automatically shifted to the begining of the graph so that it will always be processed first.

Each node in the graph takes the form:

```js
{
    "packageJSON": {} // the package.json data, interpreted by ender-package-util
  , "parents": [] // an array of parent names/paths, useful for locating the package on disk
  , "dependencies": {} // any child-nodes of this node
}
```

Any dependencies in the tree, including root packages, that are not found on disk, will be identified by replacing the node object with the sring: `'missing'`.

-------------------------

### enderDependencyGraph.create(options, graphData)
`create()` is mainly for internal use but it's also useful for testing with dummy data. It will return a `DependencyGraph` structure given the `graphData` generated by scanning the filesystem and the *package.json* files. The `graphData` may also be constructed manually for unit testing purposes.

-------------------------

### enderDependencyGraph.getClientPackageName(options)
`getClientPackageName()` is a simple utility to work out the client-lib from the given options. By default it is `'ender-js'` but the `'client-lib'` property in the `options` object may override this value.

-------------------------

### enderDependencyGraph.archyTree(packages, dependencyGraph, preparePretty)
`archyTree()` will take a list of packages and a `DependencyGraph` object and return an archy-compatible tree out of the data. Each node takes the following structure:

```js
{
    "label": "" // the name of the package
  , "version": x.y.z // the semver for the packake
  , "description": "" // the package description from package.json
  , "nodes": [] // child nodes of this package
}
```

archy only cares about the `'label'` and `'nodes'` properties, the rest are there to allow for non-archy output methods.

By providing `true` for the third argument to `archyTree()`, `preparePretty`, you will receive back a string, already passed through archy, complete with versions, descriptions and colouring, ready for printing to stdout.

-------------------------

## Executable

If you install with `npm install ender-dependency-graph -g` (why would you?) then you'll get an `ender-dependency-graph` executable that you can run with a list of packages. It will scan your node_modules directory, understand the Ender-specific dependency structure and pretty-print a tree for you.

## Contributing

Contributions are more than welcome! Just fork and submit a GitHub pull request! If you have changes that need to be synchronized across the various Ender CLI repositories then please make that clear in your pull requests.

### Tests

Ender Dependency Graph uses [Buster](http://busterjs.org) for unit testing. You'll get it (and a bazillion unnecessary dependencies) when you `npm install` in your cloned local repository. Simply run `npm test` to run the test suite.

## Licence

*Ender Dependency Graph* is Copyright (c) 2012 [@rvagg](https://github.com/rvagg), [@ded](https://github.com/ded), [@fat](https://github.com/fat) and other contributors. It is licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.
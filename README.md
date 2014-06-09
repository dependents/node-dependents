node-dependents
==============

Get the modules that depend on (i.e., require) a given module

`npm install dependents`

### Usage

`getDependents(filename, directory, callback)`

* `filename`: the module that you want to get the dependents of
* `directory`: the directory to search for dependents
* `callback`: a function that should accept a list of filenames representing modules that dependent on the module in `filename`

Example:

```javascript
var getDependents = require('dependents');

getDependents('./a.js', './', function (dependents) {

});
```

Or via a shell command:

Requires `npm install -g dependents`

```bash
dependents filename directory
```

TODO: Support baseDir as option

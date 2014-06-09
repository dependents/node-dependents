var dir       = require('node-dir'),
    detective = require('detective-amd'),
    path      = require('path');

/**
 * Look-up-table whose keys are filenames of JS files in the directory
 * the value for each key is an object of (filename -> dummy value) files that depend on the key
 * @type {Object}
 */
var dependents = {};

module.exports = function (filename, directory, cb) {
  dir.readFiles(directory, {
      match: /.js$/,
      exclude: /^\./
    },
    function(err, content, currentFile, next) {
      if (err) throw err;

      var dependencies    = detective(content),
          currentFileDir  = path.dirname(currentFile);

      dependents[currentFile] = dependents[currentFile] || {};

      // Register the current file as dependent on each dependency
      dependencies.forEach(function(dep) {
        dep = path.resolve(currentFileDir, dep) + '.js';

        dependents[dep] = dependents[dep] || {};
        dependents[dep][currentFile] = 1;
      });

      next();
    },
    function(err){
      if (err) throw err;

      cb(Object.keys(dependents[filename] || {}));
    });
};

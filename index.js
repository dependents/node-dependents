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
  filename  = path.resolve(filename);
  directory = path.resolve(directory);

  dir.readFiles(directory, {
      match:   /.js$/,
      exclude: /^\./
    },
    function(err, content, currentFile, next) {
      if (err) throw err;

      if (! content) {
        next();
        return;
      }

      currentFile = path.resolve(currentFile);

      var dependencies = detective(content);

      dependents[currentFile] = dependents[currentFile] || {};

      // Register the current file as dependent on each dependency
      dependencies.forEach(function(dep) {
        dep = path.resolve(directory, dep) + '.js';
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

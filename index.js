var detective  = require('detective-amd'),
    path       = require('path'),
    fs         = require('fs'),
    q          = require('q'),
    getJSFiles = require('./lib/getJSFiles');

/**
 * Look-up-table whose keys are filenames of JS files in the directory
 * the value for each key is an object of (filename -> dummy value) files that depend on the key
 *
 * @type {Object}
 */
var dependents = {};

/**
 * Computes the dependents for the given file across a directory or list of filenames
 *
 * @param  {Object}       options
 * @param  {String}       options.filename  - The file whose dependents to compute
 * @param  {String|Array} options.directory - Directory name or list of filenames to process
 * @param  {String}       [options.config]  - Path to the shim config
 * @param  {Function}     options.success   - ({String[]}) -> null - Executed with the dependents for the given filename
 */
module.exports.for = function(options) {
  if (! options || ! options.filename) throw new Error('expected filename whose dependents to compute');

  options.filename = path.resolve(options.filename);

  processFiles.call(this, options);
};

/**
 * @param  {Object}   options
 * @param  {String}   options.directory
 * @param  {String}   options.filename
 * @param  {String[]} options.files
 * @param  {Function} options.success
 * @param  {Object}   options.shims
 */
function processFiles(options) {
  var directory = options.directory,
      filename  = options.filename,
      files     = options.files,
      cb        = options.success,
      shims     = options.shims;

  if (!cb)        throw new Error('expected callback');
  if (!directory) throw new Error('expected directory name');

  if (!files) {
    getJSFiles({
      directory: directory,
      contentCb: function(file, content) {
        processDependents(file, content, directory, shims);
      },
      // When all files have been processed
      filesCb: function() {
        cb(getDependentsForFile(filename));
      }
    });

  } else {
    files.forEach(function(filename) {
      var content = fs.readFileSync(filename).toString();
      try {
        processDependents(filename, content, directory, shims);
      } catch(e) {
        console.log(e);
        console.log(filename);
      }
    });

    cb(getDependentsForFile(filename));
  }
}

/**
 * @param {String} filename
 * @param {String} fileContent
 * @param {String} directory
 * @param {Object} shims
 */
function processDependents(filename, fileContent, directory, shims) {
  if (! fileContent) return;

  // @todo: Detect if it's commonjs or amd then choose the appropriate detective
  // var dependencies = precinct(fileContent);
  var dependencies = detective(fileContent);

  dependents[filename] = dependents[filename] || {};

  // Register the current file as dependent on each dependency
  dependencies.forEach(function(dep) {
    // Look up the dep to see if it's aliased in the config
    if (shims && shims[dep]) {
      dep = shims[dep];
    }

    dep                       = (directory ? path.resolve(directory, dep) : dep) + '.js';
    dependents[dep]           = dependents[dep] || {};
    dependents[dep][filename] = 1;
  });
}

/**
 * @param  {String} filename
 * @return {Array}
 */
function getDependentsForFile(filename) {
  return Object.keys(dependents[filename] || {});
}

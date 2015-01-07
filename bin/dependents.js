#!/usr/bin/env node

'use strict';

var dependents = require('../');
var util = require('../lib/util');

var getJSFiles = require('get-all-js-files');
var cluster = require('cluster');
var q = require('q');
var dir = require('node-dir');
var path = require('path');
var ConfigFile = require('requirejs-config-file').ConfigFile;

var program = require('commander');

program
  .version(require('../package.json').version)
  .usage('[options] <filename>')
  .option('-d, --directory <path>', 'location of JS files')
  .option('-c, --config [path]', 'location of a RequireJS config file for AMD')
  .option('-e, --exclude [path,...]',
    'comma-separated list of files and folder names to exclude')
  .parse(process.argv);

var directory = program.directory;
var config = program.config;
var exclude = program.exclude;
var filename = program.args[0];

/**
 * Uniquely aggregates the dependents across forks (if used).
 * This being an object allows us to avoid duplicate dependents.
 *
 * @type {Object}
 */
var _dependents = {};

/**
 * Minimum Number of files needed to require clustering
 *
 * @type {Number}
 */
var threshold = 500;

/**
 * The approximate number of times a worker should come back for more files to process.
 * Empirically set.
 * @type {Number}
 */
var numTripsPerWorker = 5;

/**
 * Forks separate node processes to find dependents for the filename in parallel
 *
 * @param  {String}   filename  - File to find the dependents for
 * @param  {Array}    files     - List of JS files to process
 * @param  {Function} cb        - Executed with String[] of dependent filenames
 */
function spawnWorkers(filename, files, cb) {
  var numCPUs = require('os').cpus().length;
  var numFiles = files.length;
  // We don't care to overshoot the number of files, slice will correct this
  var chunkSize = Math.ceil(numFiles / numCPUs / numTripsPerWorker);
  var numFilesProcessed = 0;
  var worker;
  var i;

  for (i = 0; i < numCPUs; i++) {
    worker = cluster.fork();
  }

  q.all(Object.keys(cluster.workers).map(function(id, idx) {
    var worker = cluster.workers[id];
    var deferred = q.defer();
    var delegateWork = function(worker) {
      var _files = getMoreFiles(files, chunkSize);

      if (!_files.length) {
        deferred.resolve();
        worker.kill();
        return;
      }

      worker.send({
        filename: filename,
        files: _files,
        config: config
      });

      numFilesProcessed += _files.length;
    };

    delegateWork(worker);

    worker.on('message', function(data) {
      if (data.err) { throw data.err; }
      data.deps.forEach(function(depFilename) {
        _dependents[depFilename] = 1;
      });

      delegateWork(worker);
    });

    return deferred.promise;
  }))
  .done(function() {
    if (numFilesProcessed !== numFiles) {
      throw new Error('missed some files');
    }

    cb(null, Object.keys(_dependents));
  });
}

/**
 * @param  {String[]} files
 * @param  {Number} chunkSize
 * @return {String[]}
 */
function getMoreFiles(files, chunkSize) {
  if (typeof getMoreFiles.tripNum === 'undefined') {
    getMoreFiles.tripNum = 0;
  }

  var start = getMoreFiles.tripNum * chunkSize;
  var end = (getMoreFiles.tripNum + 1) * chunkSize;
  var _files = files.slice(start, end);

  getMoreFiles.tripNum++;

  return _files;
}

/**
 * @param {Object} err
 * @param {String[]} dependents
 */
function printDependents(err, dependents) {
  dependents.forEach(function(dependent) {
    console.log(dependent);
  });
}

/**
 * Called when all JS files have been fetched
 * @param  {String[]} files
 */
function filesCb(files) {
  if (files.length >= threshold) {
    spawnWorkers(filename, files, printDependents);

  } else {
    dependents({
      filename: filename,
      directory: directory,
      files: files,
      config: config,
      exclusions: exclude,
      success: printDependents
    });
  }
}

if (cluster.isMaster) {
  if (!directory) {
    console.error('A directory was not supplied');
    process.exit(1);
  }

  if (!filename) {
    console.error('A filename was not supplied');
    process.exit(1);
  }

  if (exclude && typeof exclude === 'string') {
    exclude = exclude.split(',');
  }

  exclude = util.DEFAULT_EXCLUDE_DIR.concat(exclude);
  var exclusions = util.processExcludes(exclude, directory);

  // Convert once and reuse across processes
  if (config && typeof config !== 'object') {
    config = new ConfigFile(config).read();
  }

  if (util.isSassFile(filename)) {
    util.getSassFiles({
      directory: directory,
      filesCb: filesCb
    });

  } else {
    getJSFiles({
      directory: directory,
      dirOptions: {
        excludeDir: exclusions.directories,
        exclude: exclusions.files
      },
      filesCb: filesCb
    });
  }
}

if (cluster.isWorker) {
  process.on('message', function(args) {
    var filename = args.filename;
    var files = args.files;
    var config = args.config;

    dependents({
      filename: filename,
      directory: directory,
      files: files,
      config: config,
      exclusions: exclude,
      success: function(err, deps) {
        process.send({
          err: err,
          deps: deps
        });
      }
    });
  });
}

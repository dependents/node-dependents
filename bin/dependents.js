#!/usr/bin/env node

'use strict';

var dependents = require('../');
var program = require('commander');

program
  .version(require('../package.json').version)
  .usage('[options] <filename>')
  .option('-d, --directory <path>', 'root of all files')
  .option('-c, --config [path]', 'location of a RequireJS config file for AMD')
  .option('-w, --webpack-config [path]', 'location of a webpack config file')
  .option('-e, --exclude [path,...]',
    'comma-separated list of files and folder names to exclude')
  .parse(process.argv);

var directory = program.directory;
var filename = program.args[0];

if (!directory) {
  console.error('A directory was not supplied');
  process.exit(1);
}

if (!filename) {
  console.error('A filename was not supplied');
  process.exit(1);
}

dependents({
  directory: directory,
  config: program.config,
  webpackConfig: program.webpackConfig,
  exclude: program.exclude,
  filename: filename
}, function(err, dependents) {
  dependents.forEach(function(dependent) {
    console.log(dependent);
  });
});

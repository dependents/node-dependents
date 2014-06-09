#!/usr/bin/env node

'use strict';

var getDependents = require('../'),
    filename = process.argv[2],
    directory = process.argv[3];

getDependents(filename, directory, function(dependents) {
  dependents.forEach(function(dependent) {
    console.log(dependent);
  });
});

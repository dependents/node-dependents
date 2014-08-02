var dependents = require('../'),
    assert = require('assert');

dependents.for({
  filename: __dirname + '/example/b.js',
  directory: __dirname + '/example',
  success: function(dependents) {
    assert(dependents.length === 1);
    assert(dependents[0].indexOf('a.js') !== -1);
  }
});

var getDependents = require('../');

getDependents(__dirname + '/example/b.js', __dirname + '/example', function(dependents) {
  console.log('Dependents of ./example/b.js: ', dependents);
  console.log(dependents.length === 1);
  console.log(dependents[0].indexOf('a.js') !== -1);
});

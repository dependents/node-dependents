var getDependents = require('../'),
    filename = process.argv[2],
    directory = process.argv[3];

console.log('File: ', filename)
console.log('Dir: ', directory)
getDependents(filename, directory, function(dependents) {
  console.log(dependents);
});

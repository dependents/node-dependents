var getDependents = require('../'),
    filename = process.argv[2],
    directory = process.argv[3];

getDependents(filename, directory, function(dependents) {
  console.log(dependents);
});

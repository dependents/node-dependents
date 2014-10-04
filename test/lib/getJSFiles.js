var getJSFiles = require('../../lib/getJSFiles'),
    assert = require('assert');

getJSFiles(__dirname + '../example', function(files) {
  assert(files.length);
});
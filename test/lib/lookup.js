var assert = require('assert'),
    path = require('path'),
    ConfigFile = require('requirejs-config-file').ConfigFile,
    lookup = require('../../lib/lookup');

describe('lib/lookup', function() {
  var configPath = path.resolve(__dirname, '../example/config.json');

  it('returns the real path of an aliased module given a path to a requirejs config file', function() {
    assert(lookup(configPath, 'a') === './a/');
  });

  it('returns the looked up path given a loaded requirejs config object', function() {
    var configObject = new ConfigFile(configPath).read();
    assert(lookup(configObject, 'foobar') === './b/');
  });
});

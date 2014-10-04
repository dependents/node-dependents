var lookup = require('../../lib/lookup'),
    assert = require('assert'),
    ConfigFile = require('requirejs-config-file').ConfigFile,
    configPath = __dirname + 'config.json',
    configObject = new ConfigFile(configPath).read();

assert(lookup(configPath, 'a') === './a');
assert(lookup(configObject, 'b') === './b');
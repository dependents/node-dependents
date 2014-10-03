var ConfigFile = require('requirejs-config-file').ConfigFile;

/**
 * Determines the real path of a potentially aliased dependency path
 * via the paths section of a require config
 *
 * @param  {String|Object} config - Pass a loaded config object if you'd like to avoid rereading the config
 * @param  {String} depPath
 * @return {String}
 */
module.exports = function(config, depPath) {
  if (typeof config === 'string') {
    config = new ConfigFile(config).read();
  }

  var pathTokens = depPath.split('/');

  // Check if the top-most dir of path is an alias
  var alias = config.paths[pathTokens[0]];

  if (alias) {
    alias = alias[alias.length - 1] === '/' ? alias : alias + '/';

    // @todo: handle alias values that are relative paths
    // use the absolute path of the config for resolution

    depPath = alias + pathTokens.slice(1).join('/');
  }

  return depPath;
};

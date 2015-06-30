var dependents = require('../');

/**
 * @param  {Object} args
 * @param  {String} args.filename
 * @param  {String} args.directory
 * @param  {String[]} args.files
 * @param  {Object} args.config
 * @param  {String[]} args.exclude
 */
process.on('message', function(args) {
  dependents({
    filename: args.filename,
    directory: args.directory,
    files: args.files,
    config: args.config,
    exclusions: args.exclusions,
    success: function(err, deps) {
      process.send({
        err: err,
        deps: deps
      });
    }
  });
});
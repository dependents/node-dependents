var dependents = require('../');
var assert = require('assert');
var defaultExclusions = require('../lib/util').DEFAULT_EXCLUDE_DIR;
var sinon = require('sinon');

function listHasFile(list, file) {
  return list.some(function(f) {
    return f.indexOf(file) !== -1;
  });
}

describe('dependents', function() {
  it('reuses a given configuration object config', function(done) {
    var config = dependents._readConfig(__dirname + '/example/amd/config.json');
    var spy = sinon.spy(dependents, '_readConfig');

    dependents({
      filename: __dirname + '/example/error.js',
      directory: __dirname + '/example',
      config: config
    },
    function(err, dependents) {
      assert(!spy.called);
      done();
    });
  });

  describe('exceptions', function() {
    it('throws if a success callback was not supplied', function() {
      assert.throws(function() {
        dependents({
          filename: __dirname + '/example/error.js',
          directory: __dirname + '/example'
        });
      });
    });

    it('throws if a filename was not supplied', function() {
      assert.throws(function() {
        dependents({
          directory: __dirname + '/example'
        }, sinon.spy());
      });
    });

    it('throws if a directory was not supplied', function() {
      assert.throws(function() {
        dependents({
          filename: __dirname + '/example/error.js',
          success: function(err, dependents) {}
        }, sinon.spy());
      });
    });

    it('does not throw on esprima errors', function(done) {
      dependents({
        filename: __dirname + '/example/error.js',
        directory: __dirname + '/example'
      },
      function(err, dependents) {
        assert(!err);
        assert(!dependents.length);
        done();
      });
    });
  });

  describe('exclusions', function() {
    it('excludes common 3rd party folders by default', function(done) {
      dependents({
        filename: __dirname + '/example/exclusions/a.js',
        directory: __dirname + '/example/exclusions'
      },
      function(err, dependents) {
        assert(!dependents.some(function(dependent) {
          return defaultExclusions.indexOf(dependents) !== -1;
        }));
        done();
      });
    });

    it('excludes custom folders', function(done) {
      dependents({
        filename: __dirname + '/example/exclusions/a.js',
        directory: __dirname + '/example/exclusions',
        exclusions: ['customExclude']
      },
      function(err, dependents) {
        assert(!listHasFile(dependents, 'customExclude'));
        done();
      });
    });

    it('cannot exclude particular subdirectories', function(done) {
      // node-dir looks at a directory name at a time, not partial paths
      dependents({
        filename: __dirname + '/example/exclusions/a.js',
        directory: __dirname + '/example/exclusions',
        exclusions: ['customExclude/subdir']
      },
      function(err, dependents) {
        assert(listHasFile(dependents, 'customExclude/subdir'));
        done();
      });
    });
  });

  describe('amd', function() {
    it('returns the (non-aliased) dependents', function(done) {
      dependents({
        filename: __dirname + '/example/amd/b.js',
        directory: __dirname + '/example/amd'
      },
      function(err, dependents) {
        assert.equal(dependents.length, 1);
        assert(listHasFile(dependents, 'a.js'));
        done();
      });
    });

    it('resolves aliased modules if given a requirejs config', function(done) {
      dependents({
        filename: __dirname + '/example/amd/b.js',
        directory: __dirname + '/example/amd',
        config: __dirname + '/example/amd/config.json'
      },
      function(err, dependents) {
        assert.equal(dependents.length, 2);
        assert(listHasFile(dependents, 'a.js'));
        assert(listHasFile(dependents, 'c.js'));
        done();
      });
    });
  });

  describe('commonjs', function() {
    it('finds the dependents of commonjs modules', function(done) {
      dependents({
        filename: __dirname + '/example/commonjs/b.js',
        directory: __dirname + '/example/commonjs'
      }, function(err, dependents) {
        assert.ok(dependents.length);
        done();
      });
    });

    it('handles relative dependencies', function(done) {
      dependents({
        filename: __dirname + '/example/commonjs/b.js',
        directory: __dirname + '/example/commonjs',
      },
      function(err, dependents) {
        assert(listHasFile(dependents, 'c.js'));
        done();
      });
    });
  });

  describe('es6', function() {
    it('finds the dependents of es6 modules', function(done) {
      dependents({
        filename: __dirname + '/example/es6/b.js',
        directory: __dirname + '/example/es6'
      },
      function(err, dependents) {
        assert.ok(dependents.length);
        done();
      });
    });
  });

  describe('sass', function() {
    it('finds the dependents of sass files', function(done) {
      dependents({
        filename: __dirname + '/example/sass/_foo.scss',
        directory: __dirname + '/example/sass'
      },
      function(err, dependents) {
        assert.equal(dependents.length, 3);
        done();
      });
    });

    it('handles sass partials with underscored files', function(done) {
      dependents({
        filename: __dirname + '/example/sass/_foo.scss',
        directory: __dirname + '/example/sass'
      },
      function(err, dependents) {
        assert.ok(!err);
        assert(listHasFile(dependents, 'stylesUnderscore.scss'));
        done();
      });
    });

    it('handles deeply nested paths', function(done) {
      dependents({
        filename: __dirname + '/example/nestedsass/styles.scss',
        directory: __dirname + '/example/nestedsass'
      },
      function(err, dependents) {
        assert.ok(!err);
        assert.ok(dependents.length);
        assert(listHasFile(dependents, 'b.scss'));
        assert(listHasFile(dependents, 'a.scss'));
        done();
      });
    });

    it('handles files in the same subdirectory', function(done) {
      dependents({
        filename: __dirname + '/example/nestedsass/a/b/b.scss',
        directory: __dirname + '/example/nestedsass'
      },
      function(err, dependents) {
        assert.ok(!err);
        assert(listHasFile(dependents, 'b2.scss'));
        done();
      });
    });

    it('handles non-underscored imports from subdirectories', function(done) {
      dependents({
        filename: __dirname + '/example/nestedsass/a/b/b2.scss',
        directory: __dirname + '/example/nestedsass'
      },
      function(err, dependents) {
        assert.ok(!err);
        assert(listHasFile(dependents, 'styles.scss'));
        done();
      });
    });

    it('handles underscored imports from subdirectories', function(done) {
      dependents({
        filename: __dirname + '/example/nestedsass/a/b/_b3.scss',
        directory: __dirname + '/example/nestedsass'
      },
      function(err, dependents) {
        assert.ok(!err);
        assert(listHasFile(dependents, 'styles.scss'));
        done();
      });
    });
  });

  describe('stylus', function() {
    it('finds the dependents of stylus files', function(done) {
      dependents({
        filename: __dirname + '/example/stylus/another.styl',
        directory: __dirname + '/example/stylus'
      },
      function(err, dependents) {
        assert.equal(dependents.length, 1);
        assert(listHasFile(dependents, 'main.styl'));
        done();
      });
    });
  });
});

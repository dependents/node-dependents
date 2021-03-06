var dependents = require('../');
var assert = require('assert');
var sinon = require('sinon');
var q = require('q');
var defaultExclusions = dependents.DEFAULT_EXCLUDE_DIR;
var WorkerManager = require('../lib/WorkerManager');

function listHasFile(list, file) {
  return list.some(function(f) {
    return f.indexOf(file) !== -1;
  });
}

describe('dependents', function() {
  it('does not try to read an empty config string', function(done) {
    var spy = sinon.spy(dependents, '_readConfig');

    dependents({
      filename: __dirname + '/amd/js/a.js',
      directory: __dirname + '/amd/js',
      config: ''
    },
    function() {
      assert.ok(!spy.called);
      spy.restore();
      done();
    });
  });

  it('reuses a given configuration object config', function(done) {
    var config = {
      baseUrl: 'js',
      paths: {
        foobar: 'b',
        templates: '../templates'
      }
    };

    var spy = sinon.spy(dependents, '_readConfig');

    dependents({
      filename: __dirname + '/amd/js/a.js',
      directory: __dirname + '/amd/js',
      config: config
    },
    function() {
      spy.restore();
      assert.ok(!spy.called);
      done();
    });
  });

  it('does not hang when a directory contains a node binary script', function(done) {
    dependents({
      filename: __dirname + '/amd/js/script.js',
      directory: __dirname + '/amd/js'
    },
    function(err, dependents) {
      assert(!err);
      assert.ok(!dependents.length);
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
          filename: __dirname + '/example/error.js'
        }, sinon.spy());
      });
    });

    it('does not throw on esprima errors', function(done) {
      dependents({
        filename: __dirname + '/example/amd/js/a.js',
        config: __dirname + '/example/amd/config.json',
        directory: __dirname + '/example/amd/js'
      },
      function(err, dependents) {
        assert(!err);
        assert(!dependents.length);
        done();
      });
    });

    it('does not throw if the filename is not in the resulting dependents map', function(done) {
      assert.doesNotThrow(function() {
        dependents({
          filename: __dirname + '/mocha.opts',
          directory: __dirname + '/example'
        },
        function(err, dependents) {
          assert(!err);
          assert.ok(!dependents.length);
          done();
        });
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
        dependents.forEach(function(dep) {
          defaultExclusions.map(function(e) {
            return e.split('/')[0];
          })
          .forEach(function(folder) {
            assert.equal(dep.indexOf(folder), -1, folder);
          });
        });
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

    it('accepts a comma separated string of exclusions', function(done) {
      dependents({
        filename: __dirname + '/example/exclusions/a.js',
        directory: __dirname + '/example/exclusions',
        exclusions: 'customExclude,fileToExclude.js'
      },
      function(err, dependents) {
        assert(!listHasFile(dependents, 'customExclude'));
        assert(!listHasFile(dependents, 'fileToExclude.js'));
        done();
      });
    });

    it('cannot exclude particular subdirectories', function(done) {
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

    it('excludes particular files', function(done) {
      dependents({
        filename: __dirname + '/example/exclusions/a.js',
        directory: __dirname + '/example/exclusions',
        exclusions: ['fileToExclude.js']
      },
      function(err, dependents) {
        assert(!listHasFile(dependents, 'fileToExclude.js'));
        done();
      });
    });
  });

  describe('amd', function() {
    it('resolves aliased modules if given a requirejs config', function(done) {
      dependents({
        filename: __dirname + '/example/amd/js/b.js',
        directory: __dirname + '/example/amd/js',
        config: __dirname + '/example/amd/config.json'
      },
      function(err, dependents) {
        assert.equal(dependents.length, 2);
        assert(listHasFile(dependents, 'a.js'));
        assert(listHasFile(dependents, 'c.js'));
        done();
      });
    });

    it('resolves the dependents of a minified file', function(done) {
      dependents({
        filename: __dirname + '/example/amd/js/vendor/jquery.min.js',
        directory: __dirname + '/example/amd/js',
        config: __dirname + '/example/amd/config.json'
      },
      function(err, dependents) {
        assert.equal(dependents.length, 1);
        assert(listHasFile(dependents, 'b.js'));
        done();
      });
    });

    describe('when the baseUrl has a leading slash', function() {
      beforeEach(function() {
        this._config = {
          baseUrl: '/js',
          paths: {
            foobar: 'b',
            templates: '../templates',
            jquery: 'vendor/jquery.min'
          }
        };
      });

      describe('and we\'re given a pre-parsed config', function() {
        it('still finds the dependents of a file', function(done) {
          dependents({
            filename: __dirname + '/example/amd/js/vendor/jquery.min.js',
            directory: __dirname + '/example/amd/js',
            config: this._config,
            configPath: __dirname + '/example/amd/config.json'
          },
          function(err, dependents) {
            assert.equal(dependents.length, 1);
            assert(listHasFile(dependents, 'b.js'));
            done();
          });
        });
      });

      describe('and we are given a config location', function() {
        it('still finds the dependents of a file', function(done) {
          dependents({
            filename: __dirname + '/example/amd/js/vendor/jquery.min.js',
            directory: __dirname + '/example/amd/js',
            config: __dirname + '/example/amd/configWithLeadingSlash.json'
          },
          function(err, dependents) {
            assert.equal(dependents.length, 1);
            assert(listHasFile(dependents, 'b.js'));
            done();
          });
        });
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

    it('still works for files with es7', function(done) {
      dependents({
        filename: __dirname + '/example/es6/es7.js',
        directory: __dirname + '/example/es6'
      },
      function(err, dependents) {
        assert.equal(dependents.length, 0);
        done();
      });
    });

    it('still works for files with jsx', function(done) {
      dependents({
        filename: __dirname + '/example/es6/jsx.js',
        directory: __dirname + '/example/es6'
      },
      function(err, dependents) {
        assert.equal(dependents.length, 0);
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

  describe('parallelization', function(done) {
    it('delegates to the worker manager if the number of fetched files exceeds a threshold', function() {
      var deferred = q.defer();
      var filename = __dirname + '/example/commonjs/b.js';
      var deps = {};
      deps[filename] = {};
      deferred.resolve(deps);

      var stub = sinon.stub(WorkerManager.prototype, 'computeAllDependents').returns(deferred.promise);
      sinon.stub(dependents, '_shouldParallelize').returns(true);

      dependents({
        filename: __dirname + '/example/commonjs/b.js',
        directory: __dirname + '/example/commonjs'
      }, function() {
        dependents._shouldParallelize.restore();
        stub.restore();
        done();
      });
    });

    it('allows the file threshold to be configurable', function(done) {
      var deferred = q.defer();
      var filename = __dirname + '/example/commonjs/b.js';
      var deps = {};
      deps[filename] = {};
      deferred.resolve(deps);

      var stub = sinon.stub(WorkerManager.prototype, 'computeAllDependents').returns(deferred.promise);
      var spy = sinon.spy(dependents, '_shouldParallelize');
      var newThreshold = 1;

      dependents({
        filename: __dirname + '/example/commonjs/b.js',
        directory: __dirname + '/example/commonjs',
        parallelThreshold: newThreshold
      }, function() {
        var threshold = spy.args[0][1];
        assert.equal(threshold, newThreshold);
        spy.restore();
        stub.restore();
        done();
      });
    });
  });
});

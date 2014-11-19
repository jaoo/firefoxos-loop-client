'use strict';

var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

module.exports = function(grunt) {
  [
    'grunt-contrib-clean',
    'grunt-contrib-compress',
    'grunt-contrib-connect',
    'grunt-contrib-copy',
    'grunt-bower-task',
    'grunt-firefoxos',
    'grunt-git-describe',
    'grunt-html-build',
    'grunt-mocha'
  ].forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    connect: {
      test: {
        options: {
          port: 9002,
          middleware: function (connect) {
            return [
              mountFolder(connect, '.tmp'),
              mountFolder(connect, 'test'),
              mountFolder(connect, 'app')
            ];
          }
        }
      }
    },

    mocha: {
      all: {
        options: {
          run: true,
          urls: ['http://0.0.0.0:9002/index.html'],
          bail: true,
          logErrors: true,
          reporter: 'Spec'
        }
      }
    },

    clean: {
      server: [
        '.tmp'
      ],
      preTest: [
        'test/index.html'
      ],
      postTest: [
        'src/'
      ],
      app: [
        'application.zip'
      ]
    },

    copy: {
      test: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['index.template.html'],
          dest: 'test',
          rename: function() {
            return 'test/index.html';
          }
        }]
      },
      build: {
          expand: true,
          cwd: 'app',
          src: ['**'],
          dest: 'build'
      }
    },

    // We use htmlbuild to add the tests dependencies to test/index.html
    // This avoid us to manually add the dependencies every time we add a
    // new test or script file.
    htmlbuild: {
      src: 'test/index.template.html',
      // "dest" is not working with the current htmlbuild version, so we need
      // to manually move src/index.html to test/index.html
      // dest: 'test/',
      options: {
        beautify: true,
        relative: true,
        scripts: {
          libs: 'app/libs/*.js',
          tokbox: 'app/libs/tokbox/**/*.js',
          helpers: 'app/js/helpers/*.js',
          screens: 'app/js/screens/*.js',
          js: 'app/js/*.js',
        }
      }
    },

    'git-describe': {
      options: {
        prop: 'meta.revision',
        failOnError: false
      },
      me: {}
    },

    bower: {
      install: {
        options: {
          targetDir: 'build/libs/components/',
          verbose: true,
          copy: false
        }
      }
    },

    compress: {
      release: {
        options: {
          archive: 'application.zip',
        },
        files: [{
          cwd: 'build',
          expand: true,
          src: '**/*'
        }]
      }
    },

    ffospush: {
      app: {
        appId: 'loop.services.mozilla.org',
        zip: 'application.zip'
      }
    }

  });

  grunt.registerTask('test', 'Launch tests in shell with PhantomJS', [
    'clean:server',
    'clean:preTest',
    'htmlbuild',
    'copy:test',
    'clean:postTest',
    'connect:test',
    'mocha'
  ]);

  grunt.registerTask('saveRevision', function() {
    // By default we enter the unknown string (in case someone uses a zip)
    // if this is git repo, it will be overwritten later on
    grunt.file.write('build/js/version.js', "Version = { id: 'unknown' };");
    grunt.event.once('git-describe', function (rev) {
      grunt.file.write('build/js/version.js', 'Version = { id: \'' +
        rev.object + '\' };');
    });
    grunt.task.run('git-describe');
  });

  grunt.registerTask('configureProduction', function() {
    grunt.option("loopServer", "production");
    grunt.option("metrics", "production");
    grunt.option("debug", false);
    grunt.option("enforceDevices", true);
    grunt.option("performanceLog", "false");
  });

  grunt.registerTask('configureDevelopment', function() {
    grunt.option("loopServer", "development");
    grunt.option("metrics", "stage");
    grunt.option("debug", true);
    grunt.option("enforceDevices", false);
    grunt.option("performanceLog", "persistent");
  });

  grunt.registerTask('configure', function() {
    // Device Compatibilty Configuration, when enabled, only
    // the ALCATELOneTouch6015X is allowed
    var enforceDevices = grunt.option('enforceDevices') || false;
    if (enforceDevices) {
      var compatibilityF = "build/compatibility.json";
      var compatibility = grunt.file.readJSON(compatibilityF);
      compatibility.device.names = ["ALCATELOneTouch6015X"];
      grunt.file.write(compatibilityF, JSON.stringify(compatibility, null, 2));
    }

    // Read manifest and config files and some configuration operations require
    // changes in both of them
    var manifestFile = "build/manifest.webapp";
    var manifest = grunt.file.readJSON(manifestFile); //get file as a string

    var configFile = "build/js/config.js";
    var config = grunt.file.read(configFile); //get file as a string

    // Configure debug parameter, just require changes in config.js
    var debug = grunt.option('debug') || false;
    var DEBUG_DEF_VAL = false;
    if (debug) {
      config = config.replace("debug: " + DEBUG_DEF_VAL + ",", "debug: true,");
    } else {
      config = config.replace("debug: " + DEBUG_DEF_VAL + ",", "debug: false,");
    }

    // Configure loop version, require changes in config.js for telemetry report
    // and manifest.webapp for marketplace
    var version = grunt.option('loopVersion');
    var VERSION_DEF_VAL = "1.1d";
    if (version != undefined) {
      config = config.replace("version: '" + VERSION_DEF_VAL + "',", 
                              "version: '" + version + "',");
      manifest.version = version;
      // And we write the same version in the version.js
      grunt.file.write('build/js/version.js', 'Version = { id: \'' + 
                       version + '\' }');
    }

    // Configure loop server, require changes in config.js for server config 
    // and manifest.webapp for app origin
    var loopServer = grunt.option('loopServer') || "production";
    var SERVER_DEF_VAL = "server_url: 'https://loop.services.mozilla.com'";
    switch (loopServer) {
      case "stage":
        config = config.replace(SERVER_DEF_VAL, 
                              "server_url: 'https://loop.stage.mozaws.net'");
        manifest.origin = "app://loop.stage.mozaws.net";
        break;
      case "development":
        config = config.replace(SERVER_DEF_VAL, 
                              "server_url: 'https://loop-dev.stage.mozaws.net'");
        manifest.origin = "app://loop-dev.stage.mozaws.net";
        break;
      case "production":
        config = config.replace(SERVER_DEF_VAL,
                              "server_url: 'https://loop.services.mozilla.com'");
        manifest.origin = "app://loop.services.mozilla.com";
        break;
      default:
        config = config.replace(SERVER_DEF_VAL,
                              "server_url: 'https://loop.services.mozilla.com'");
        manifest.origin = "app://loop.services.mozilla.com";
        break;
    }

    // Configure performance logs, require changes in config.js
    var performanceLog = grunt.option('performanceLog') || "disabled";
    var perfConfig = " performanceLog: { enabled: false, persistent: false}";
    switch (performanceLog) {
      case "persistent":
        perfConfig = " performanceLog: { enabled: true, persistent: true}";
        break;
      case "enabled":
        perfConfig = " performanceLog: { enabled: true, persistent: false}";
        break;
      case "disabled":
        perfConfig = " performanceLog: { enabled: false, persistent: false}";
        break;
    }
    config = config.replace(
                /\/\/.*?cfg perfLog\n\s*(.*?):((?:.|\s)*?)(?=(,?)\s*\/\/ end)/,
                                          "// cfg perfLog" + "\n" + perfConfig);

    // Configure metrics (telemetry and input.mozilla), changes only config.js
    var metrics = grunt.option('metrics') || "stage";
    var metricsConfig = "  metrics: { enabled: false, feedback: { " +
        "serverUrl: 'https://input.allizom.org/api/v1/feedback'}, telemetry:" +
        " { serverUrl: 'https://fxos.telemetry.mozilla.org/submit/telemetry'}}";
    switch (metrics) {
      case "production":
        metricsConfig = "  metrics: { enabled: true, feedback: { " +
        "serverUrl: 'https://input.mozilla.org/api/v1/feedback'}, telemetry:" +
        " { serverUrl: 'https://fxos.telemetry.mozilla.org/submit/telemetry'}}";
        break;
      case "stage":
        metricsConfig = "  metrics: { enabled: true, feedback: { " +
        "serverUrl: 'https://input.allizom.org/api/v1/feedback'}, telemetry:" +
        " { serverUrl: 'https://fxos.telemetry.mozilla.org/submit/telemetry'}}";
        break;
      case "disabled":
        metricsConfig = "  metrics: { enabled: false, feedback: { " +
        "serverUrl: 'https://input.allizom.org/api/v1/feedback'}, telemetry:" +
        " { serverUrl: 'https://fxos.telemetry.mozilla.org/submit/telemetry'}}";
        break;
    }
    config = config.replace(
               /\/\/.*?cfg metrics\n\s*(.*?):((?:.|\s)*?)(?=(,?)\s*\/\/ end)/,
                                       "// cfg metrics" + "\n" + metricsConfig);

    grunt.file.write(configFile, config);
    grunt.file.write(manifestFile, JSON.stringify(manifest, null, 2));
  });


  grunt.registerTask('build', 'Build app for dev', [
    'bower:install',
    'copy',
    'saveRevision',
    'configure',
    'compress:release',
    'ffospush:app'
  ]);

  grunt.registerTask('buildProduction', 'Build app for dev', [
    'bower:install',
    'copy',
    'configureProduction',
    'saveRevision',
    'configure',
    'compress:release',
    'ffospush:app'
  ]);

  grunt.registerTask('buildDevelopment', 'Build app for dev', [
    'bower:install',
    'copy',
    'configureDevelopment',
    'saveRevision',
    'configure',
    'compress:release',
    'ffospush:app'
  ]);

  grunt.registerTask('release', 'Build app for release', [
    'clean',
    'copy',
    'bower:install',
    'saveRevision',
    'test',
    'configure',
    'compress:release'
  ]);

  grunt.registerTask('releaseProduction', 'Build app for release', [
    'clean',
    'copy',
    'configureProduction',
    'bower:install',
    'saveRevision',
    'test',
    'configure',
    'compress:release'
  ]);

  grunt.registerTask('releaseDevelopment', 'Build app for release', [
    'clean',
    'copy',
    'configureDevelopment',
    'bower:install',
    'saveRevision',
    'test',
    'configure',
    'compress:release'
  ]);

  grunt.registerTask('default', ['build']);
};

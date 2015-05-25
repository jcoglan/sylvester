if (this.ActiveXObject)
  load = function(path) {
    var fso = new ActiveXObject('Scripting.FileSystemObject'), file, runner
    try {
      file   = fso.OpenTextFile(path)
      runner = function() { eval(file.ReadAll()) }
      runner()
    } finally {
      try { if (file) file.Close() } catch (e) {}
    }
  };

if (typeof require === 'function') {
  JS = require('../node_modules/jstest/jstest')
  JS.ENV.Sylvester = require('../lib/sylvester')
  Sylvester.precision = 1e-6
  require('./runner')
}
else {
  load('lib/sylvester.js')
  load(JSCLASS_PATH + '/loader.js')
  load('test/runner.js')
}

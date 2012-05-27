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

(function() {
  var $ = (typeof global === 'object') ? global : this
  $.JSCLASS_PATH = 'node_modules/jsclass/src'
})()

if (typeof require === 'function') {
  require('../' + JSCLASS_PATH + '/loader')
  JS.ENV.Sylvester = require('../lib/sylvester')
  Sylvester.precision = 1e-6
  require('./runner')
}
else {
  load('lib/sylvester.js')
  load(JSCLASS_PATH + '/loader.js')
  load('test/runner.js')
}

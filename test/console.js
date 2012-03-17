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
  }

JSCLASS_PATH = 'node_modules/jsclass/src'

if (typeof require === 'function') {
  Sylvester = require('../lib/sylvester')
  require('jsclass')
  require('./runner')
}
else {
  load('lib/sylvester.js')
  load(JSCLASS_PATH + '/loader.js')
  load('test/runner.js')
}

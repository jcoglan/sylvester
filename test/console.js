if (typeof require === 'function') {
  Sylvester = require('../lib/sylvester')
  require('jsclass')
  require('./runner')
}
else {
  JSCLASS_PATH = 'node_modules/jsclass/src'
  load('lib/sylvester.js')
  load(JSCLASS_PATH + '/loader.js')
  load('test/runner.js')
}
JS.cacheBust = true

JS.Packages(function() { with(this) {
  var ROOT = JS.ENV.ROOT || '.'
  autoload(/.*Spec$/, {from: ROOT + '/test/specs', require: 'JS.Test'})
}})

JS.require( 'VectorSpec',
            'MatrixSpec',
            'LineSpec',
            'LineSegmentSpec',
            'PlaneSpec',

  function() { JS.Test.autorun() })

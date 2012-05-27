(function() {
  var api = (typeof require === 'function' && typeof exports === 'object')
          ? exports
          : this;
  
  api.Line    = Sylvester.Line;
  api.Matrix  = Sylvester.Matrix;
  api.Plane   = Sylvester.Plane;
  api.Polygon = Sylvester.Polygon;
  api.Vector  = Sylvester.Vector;
  
  if (typeof WScript !== 'undefined')
    this.Sylvester = Sylvester;
})();

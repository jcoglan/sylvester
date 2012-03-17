if (typeof require === 'function' && typeof module === 'object') {
  module.exports = Sylvester;
} else {
  this.Line    = Sylvester.Line;
  this.Matrix  = Sylvester.Matrix;
  this.Plane   = Sylvester.Plane;
  this.Polygon = Sylvester.Polygon;
  this.Vector  = Sylvester.Vector;
}

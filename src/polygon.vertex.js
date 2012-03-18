Sylvester.Polygon.Vertex = function(point) {
  this.setElements(point);
  if (this.elements.length === 2) { this.elements.push(0); }
  if (this.elements.length !== 3) { return null; }
};
Sylvester.Polygon.Vertex.prototype = new Sylvester.Vector;

// Returns true iff the vertex's internal angle is 0 <= x < 180
// in the context of the given polygon object. Returns null if the
// vertex does not exist in the polygon.
Sylvester.Polygon.Vertex.prototype.isConvex = function(polygon) {
  var node = polygon.nodeFor(this);
  if (node === null) { return null; }
  var prev = node.prev.data, next = node.next.data;
  var A = next.subtract(this);
  var B = prev.subtract(this);
  var theta = A.angleFrom(B);
  if (theta <= Sylvester.precision) { return true; }
  if (Math.abs(theta - Math.PI) <= Sylvester.precision) { return false; }
  return (A.cross(B).dot(polygon.plane.normal) > 0);
};
// Returns true iff the vertex's internal angle is 180 <= x < 360
Sylvester.Polygon.Vertex.prototype.isReflex = function(polygon) {
  var result = this.isConvex(polygon);
  return (result === null) ? null : !result;
};
Sylvester.Polygon.Vertex.prototype.type = function(polygon) {
  var result = this.isConvex(polygon);
  return (result === null) ? null : (result ? 'convex' : 'reflex');
};

// Method for converting a set of arrays/vectors/whatever to a set of Sylvester.Polygon.Vertex objects
Sylvester.Polygon.Vertex.convert = function(points) {
  var pointSet = points.toArray ? points.toArray() : points;
  var list = [], n = pointSet.length;
  for (var i = 0; i < n; i++) {
    list.push(new Sylvester.Polygon.Vertex(pointSet[i]));
  }
  return list;
};

Sylvester.Line.Segment = function() {};

Sylvester.Line.Segment.prototype = {
  eql: function(segment) {
    return (this.start.eql(segment.start) && this.end.eql(segment.end)) ||
        (this.start.eql(segment.end) && this.end.eql(segment.start));
  },

  dup: function() {
    return Sylvester.Line.Segment.create(this.start, this.end);
  },

  length: function() {
    var A = this.start.elements, B = this.end.elements;
    var C1 = B[0] - A[0], C2 = B[1] - A[1], C3 = B[2] - A[2];
    return Math.sqrt(C1*C1 + C2*C2 + C3*C3);
  },

  toVector: function() {
    var A = this.start.elements, B = this.end.elements;
    return Sylvester.Vector.create([B[0] - A[0], B[1] - A[1], B[2] - A[2]]);
  },

  midpoint: function() {
    var A = this.start.elements, B = this.end.elements;
    return Sylvester.Vector.create([(B[0] + A[0])/2, (B[1] + A[1])/2, (B[2] + A[2])/2]);
  },

  bisectingPlane: function() {
    return Sylvester.Plane.create(this.midpoint(), this.toVector());
  },

  translate: function(vector) {
    var V = vector.elements || vector;
    var S = this.start.elements, E = this.end.elements;
    return Sylvester.Line.Segment.create(
      [S[0] + V[0], S[1] + V[1], S[2] + (V[2] || 0)],
      [E[0] + V[0], E[1] + V[1], E[2] + (V[2] || 0)]
    );
  },

  isParallelTo: function(obj) {
    return this.line.isParallelTo(obj);
  },

  distanceFrom: function(obj) {
    var P = this.pointClosestTo(obj);
    return (P === null) ? null : P.distanceFrom(obj);
  },

  contains: function(obj) {
    if (obj.start && obj.end) { return this.contains(obj.start) && this.contains(obj.end); }
    var P = (obj.elements || obj).slice();
    if (P.length === 2) { P.push(0); }
    if (this.start.eql(P)) { return true; }
    var S = this.start.elements;
    var V = Sylvester.Vector.create([S[0] - P[0], S[1] - P[1], S[2] - (P[2] || 0)]);
    var vect = this.toVector();
    return V.isAntiparallelTo(vect) && V.modulus() <= vect.modulus();
  },

  intersects: function(obj) {
    return (this.intersectionWith(obj) !== null);
  },

  intersectionWith: function(obj) {
    if (!this.line.intersects(obj)) { return null; }
    var P = this.line.intersectionWith(obj);
    return (this.contains(P) ? P : null);
  },

  pointClosestTo: function(obj) {
    if (obj.normal) {
      // obj is a plane
      var V = this.line.intersectionWith(obj);
      if (V === null) { return null; }
      return this.pointClosestTo(V);
    } else {
      // obj is a line (segment) or point
      var P = this.line.pointClosestTo(obj);
      if (P === null) { return null; }
      if (this.contains(P)) { return P; }
      return (this.line.positionOf(P) < 0 ? this.start : this.end).dup();
    }
  },

  setPoints: function(startPoint, endPoint) {
    startPoint = Sylvester.Vector.create(startPoint).to3D();
    endPoint = Sylvester.Vector.create(endPoint).to3D();
    if (startPoint === null || endPoint === null) { return null; }
    this.line = Sylvester.Line.create(startPoint, endPoint.subtract(startPoint));
    this.start = startPoint;
    this.end = endPoint;
    return this;
  }
};

Sylvester.Line.Segment.create = function(v1, v2) {
  var S = new Sylvester.Line.Segment();
  return S.setPoints(v1, v2);
};

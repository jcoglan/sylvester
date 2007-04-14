// === Sylvester ===
// Vector and Matrix mathematics for JavaScript
// Copyright (c) 2007 James Coglan
// 
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

function Line() {}
Line.prototype = {

  // Returns true if the argument occupies the same space as the line
  eql: function(line) {
    return (this.isParallelTo(line) && this.contains(line.anchor));
  },

  // Returns a copy of the line
  dup: function() {
    return Line.create(this.anchor, this.direction);
  },

  // Returns the result of translating the line by the given vector
  translate: function(vector) {
    vector = Vector.create(vector).to3D();
    if (vector === null) { return null; }
    return Line.create(this.anchor.add(vector), this.direction);
  },

  // Returns true if the line is parallel to the argument. Here, 'parallel to'
  // means that the argument's direction is either parallel or antiparallel to
  // the line's own direction. A line is parallel to a plane if the two do not
  // have a unique intersection.
  isParallelTo: function(obj) {
    if (obj.normal) { return obj.isParallelTo(this); }
    return (this.direction.isParallelTo(obj.direction) || this.direction.isAntiparallelTo(obj.direction));
  },

  // Returns the line's perpendicular distance from the argument,
  //which can be a point, a line or a plane
  distanceFrom: function(obj) {
    if (obj.normal) { return obj.distanceFrom(this); }
    if (obj.direction) {
      // obj is a line
      if (this.isParallelTo(obj)) { return this.distanceFrom(obj.anchor); }
      var N = this.direction.cross(obj.direction).toUnitVector();
      return Math.abs(this.anchor.subtract(obj.anchor).dot(N));
    } else {
      // obj is a point
      var P = obj.to3D();
      if (P === null) { return null; }
      var A = P.subtract(this.anchor);
      return Math.abs(A.modulus() * Math.sin(A.angleFrom(this.direction)));
    }
  },

  // Returns true iff the argument is a point on the line
  contains: function(point) {
    var dist = this.distanceFrom(point);
    return (dist !== null && dist <= Sylvester.precision);
  },
  
  // Returns the distance from the anchor of the given point. Negative values are
  // returned for points that are in the opposite direction to the line's direction from
  // the line's anchor point.
  positionOf: function(point) {
    point = point.to3D();
    if (point === null) { return null; }
    if (!this.contains(point)) { return null; }
    return point.subtract(this.anchor).dot(this.direction);
  },

  // Returns true iff the line lies in the given plane
  liesIn: function(plane) {
    return plane.contains(this);
  },

  // Returns true iff the line has a unique point of intersection with the argument
  intersects: function(obj) {
    if (obj.normal) { return obj.intersects(this); }
    return (!this.isParallelTo(obj) && this.distanceFrom(obj) <= Sylvester.precision);
  },

  // Returns the unique intersection point with the argument, if one exists
  intersectionWith: function(obj) {
    if (!this.intersects(obj)) { return null; }
    if (obj.normal) { return obj.intersectionWith(this); }
    var P = this.anchor, X = this.direction, Q = obj.anchor, Y = obj.direction;
    var a = (X.dot(Q.subtract(P)) * Y.dot(Y) / X.dot(X)) + (X.dot(Y) * Y.dot(P.subtract(Q)));
    var s = a / (Y.dot(Y) - (X.dot(Y) * X.dot(Y)));
    return P.add(X.x(s));
  },

  // Returns the point on the line that is closest to the given point or line
  pointClosestTo: function(obj) {
    if (obj.direction) {
      // obj is a line
      if (this.intersects(obj)) { return this.intersectionWith(obj); }
      if (this.isParallelTo(obj)) { return null; }
      var S = this.direction.cross(obj.direction).toUnitVector().x(this.distanceFrom(obj));
      var L = obj.dup().translate(S);
      if (L.distanceFrom(this) > obj.distanceFrom(this)) { L = obj.dup().translate(S.x(-1)); }
      return this.intersectionWith(L);
    } else {
      // obj is a point
      var P = obj.to3D();
      if (P === null) { return null; }
      if (this.contains(P)) { return P; }
      var A = P.subtract(this.anchor);
      return P.add(this.direction.cross(this.direction.cross(A)).toUnitVector().x(this.distanceFrom(P)));
    }
  },

  // Returns a copy of the line rotated by t radians about the given line. Works by
  // finding the argument's closest point to this line's anchor point (call this C) and
  // rotating the anchor about C. Also rotates the line's direction about the argument's.
  // Be careful with this - the rotation axis' direction affects the outcome!
  rotate: function(t, line) {
    // If we're working in 2D
    if (typeof(line.direction) == 'undefined') { line = Line.create(line.to3D(), Vector.k); }
    var R = Matrix.Rotation(t, line.direction);
    var C = line.pointClosestTo(this.anchor);
    return Line.create(C.add(R.x(this.anchor.subtract(C))), R.x(this.direction));
  },
  
  // Returns a copy of the line with its direction vector reversed.
  // Useful when using lines for rotations.
  reverse: function() {
    return Line.create(this.anchor, this.direction.x(-1));
  },

  // Returns the line's reflection in the given point or line
  reflectionIn: function(obj) {
    if (obj.normal) {
      // obj is a plane
      var A = this.anchor.reflectionIn(obj);
      var D = obj.anchor.add(this.direction).reflectionIn(obj).subtract(obj.anchor);
      return Line.create(A, D);
    } else if (obj.direction) {
      // obj is a line - reflection obtained by rotating PI radians about obj
      return this.rotate(Math.PI, obj);
    } else {
      // obj is a point - just reflect the line's anchor in it
      var P = obj.to3D();
      if (P === null) { return null; }
      return Line.create(this.anchor.reflectionIn(P), this.direction);
    }
  },

  // Set the line's anchor point and direction.
  setVectors: function(anchor, direction) {
    anchor = Vector.create(anchor).to3D();
    direction = Vector.create(direction).to3D();
    if (anchor === null || direction === null || direction.modulus() === 0) { return null; }
    this.anchor = anchor;
    this.direction = direction.toUnitVector();
    return this;
  }
};

  
// Constructor function
Line.create = function(anchor, direction) {
  var L = new Line();
  return L.setVectors(anchor, direction);
};

// Axes
Line.X = Line.create(Vector.Zero(3), Vector.i);
Line.Y = Line.create(Vector.Zero(3), Vector.j);
Line.Z = Line.create(Vector.Zero(3), Vector.k);

var $L = Line.create;



Line.Segment = function() {}
Line.Segment.prototype = {

  // Returns the length of the line segment
  length: function() {
    return this.toVector().modulus();
  },
  
  // Returns the line segment as a vector equal to its
  // end point relative to its endpoint
  toVector: function() {
    return this.end.subtract(this.start);
  },
  
  // Returns the segment's midpoint as a vector
  midpoint: function() {
    return this.start.add(this.end).x(0.5);
  },
  
  // Returns the plane that bisects the segment
  bisectingPlane: function() {
    return Plane.create(this.midpoint(), this.toVector());
  },
  
  // Returns true iff the given point lies on the segment
  contains: function(point) {
    point = point.to3D();
    if (point === null) { return null; }
    if (point.eql(this.start)) { return true; }
    var V = point.subtract(this.start);
    return V.isParallelTo(this.toVector()) && V.modulus() <= this.toVector().modulus();
  },
  
  // Set the start and end-points of the segment
  setPoints: function(startPoint, endPoint) {
    startPoint = Vector.create(startPoint).to3D();
    endPoint = Vector.create(endPoint).to3D();
    if (startPoint === null || endPoint === null) { return null; }
    this.line = Line.create(startPoint, endPoint.subtract(startPoint));
    this.start = startPoint;
    this.end = endPoint;
    return this;
  }
};

// Constructor function
Line.Segment.create = function(v1, v2) {
  var S = new Line.Segment;
  return S.setPoints(v1, v2);
};



function Plane() {}
Plane.prototype = {

  // Returns true iff the plane occupies the same space as the argument
  eql: function(plane) {
    return (this.contains(plane.anchor) && this.isParallelTo(plane));
  },

  // Returns a copy of the plane
  dup: function() {
    return Plane.create(this.anchor, this.normal);
  },

  // Returns the result of translating the plane by the given vector
  translate: function(vector) {
    vector = Vector.create(vector).to3D();
    if (vector === null) { return null; }
    return Plane.create(this.anchor.add(vector), this.normal);
  },

  // Returns true iff the plane is parallel to the argument. Will return true
  // if the planes are equal, or if you give a line and it lies in the plane.
  isParallelTo: function(obj) {
    if (obj.normal) {
      // obj is a plane
      return (this.normal.isParallelTo(obj.normal) || this.normal.isAntiparallelTo(obj.normal));
    } else if (obj.direction) {
      // obj is a line
      return this.normal.isPerpendicularTo(obj.direction);
    }
    return null;
  },

  // Returns the plane's distance from the given object (point, line or plane)
  distanceFrom: function(obj) {
    if (this.intersects(obj) || this.contains(obj)) { return 0; }
    if (obj.anchor) {
      // obj is a plane or line
      return Math.abs(this.anchor.subtract(obj.anchor).dot(this.normal));
    } else {
      // obj is a point
      var P = obj.to3D();
      if (P === null) { return null; }
      return Math.abs(this.anchor.subtract(P).dot(this.normal))
    }
  },

  // Returns true iff the plane contains the given point or line
  contains: function(obj) {
    if (obj.normal) { return null; }
    if (obj.direction) {
      return (this.contains(obj.anchor) && this.normal.isPerpendicularTo(obj.direction));
    } else {
      var P = obj.to3D();
      if (P === null) { return null; }
      return (Math.abs(this.normal.dot(this.anchor) - this.normal.dot(P)) <= Sylvester.precision);
    }
  },

  // Returns true iff the plane has a unique point/line of intersection with the argument
  intersects: function(obj) {
    if (typeof(obj.direction) == 'undefined' && typeof(obj.normal) == 'undefined') { return null; }
    return !this.isParallelTo(obj);
  },

  // Returns the unique intersection with the argument, if one exists. The result
  // will be a vector if a line is supplied, and a line if a plane is supplied.
  intersectionWith: function(obj) {
    if (!this.intersects(obj)) { return null; }
    if (obj.direction) {
      // obj is a line
      var A = obj.anchor, D = obj.direction, P = this.anchor, N = this.normal;
      return A.add(D.x(N.dot(P.subtract(A)) / N.dot(D)));
    } else if (obj.normal) {
      // obj is a plane
      var direction = this.normal.cross(obj.normal).toUnitVector();
      // To find an anchor point, we find one co-ordinate that has a value
      // of zero somewhere on the intersection, and remember which one we picked
      var N = Matrix.Zero(2,2), i = 0;
      while (N.isSingular()) {
        i++;
        N = Matrix.create([
          [ this.normal.e(i%3 + 1), this.normal.e((i+1)%3 + 1) ],
          [ obj.normal.e(i%3 + 1),  obj.normal.e((i+1)%3 + 1)  ]
        ]);
      }
      // Then we solve the simultaneous equations in the remaining dimensions
      var intersection = N.inv().x(Vector.create([this.normal.dot(this.anchor), obj.normal.dot(obj.anchor)]));
      var anchor = [];
      for (var j = 1; j <= 3; j++) {
        // This formula picks the right element from intersection by
        // cycling depending on which element we set to zero above
        anchor.push((i == j) ? 0 : intersection.e((j + (5 - i)%3)%3 + 1));
      }
      return Line.create(anchor, direction);
    }
  },

  // Returns the point in the plane closest to the given point
  pointClosestTo: function(point) {
    point = point.to3D();
    if (point === null) { return null; }
    return point.add(this.normal.x(this.anchor.subtract(point).dot(this.normal)));
  },

  // Returns a copy of the plane, rotated by t radians about the given line
  // See notes on Line#rotate.
  rotate: function(t, line) {
    var R = Matrix.Rotation(t, line.direction);
    var C = line.pointClosestTo(this.anchor);
    return Plane.create(C.add(R.x(this.anchor.subtract(C))), R.x(this.normal));
  },

  // Returns the reflection of the plane in the given point, line or plane.
  reflectionIn: function(obj) {
    if (obj.normal) {
      // obj is a plane
      var A = this.anchor.reflectionIn(obj);
      var N = obj.anchor.add(this.normal).reflectionIn(obj).subtract(obj.anchor);
      return Plane.create(A, N);
    } else if (obj.direction) {
      // obj is a line
      return this.rotate(Math.PI, obj);
    } else {
      // obj is a point
      var P = obj.to3D();
      if (P === null) { return null; }
      return Plane.create(this.anchor.reflectionIn(P), this.normal);
    }
  },

  // Sets the anchor point and normal to the plane. If three arguments are specified,
  // the normal is calculated by assuming the three points should lie in the same plane.
  // If only two are sepcified, the second is taken to be the normal. Normal vector is
  // normalised before storage.
  setVectors: function(anchor, v1, v2) {
    anchor = Vector.create(anchor).to3D();
    v1 = Vector.create(v1).to3D();
    v2 = (typeof(v2) == 'undefined') ? null : Vector.create(v2).to3D();
    if (anchor === null || v1 === null || v1.modulus() === 0) { return null; }
    if (v2 !== null) {
      if (v2.modulus() === 0) { return null; }
      normal = (v1.subtract(anchor)).cross(v2.subtract(anchor)).toUnitVector();
    } else {
      normal = v1.toUnitVector();
    }
    this.anchor = anchor;
    this.normal = normal;
    return this;
  }
};

// Constructor function
Plane.create = function(anchor, v1, v2) {
  var P = new Plane();
  return P.setVectors(anchor, v1, v2);
};

// X-Y-Z planes
Plane.XY = Plane.create(Vector.Zero(3), Vector.k);
Plane.YZ = Plane.create(Vector.Zero(3), Vector.i);
Plane.ZX = Plane.create(Vector.Zero(3), Vector.j);
Plane.YX = Plane.XY; Plane.ZY = Plane.YZ; Plane.XZ = Plane.ZX;

var $P = Plane.create;

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

  // Returns the result of translating the line by the given vector/array
  translate: function(vector) {
    vector = vector.elements || vector;
    if (vector.length == 2) { vector.push(0); }
    return Line.create([
      this.anchor.elements[0] + vector[0],
      this.anchor.elements[1] + vector[1],
      this.anchor.elements[2] + vector[2]
    ], this.direction);
  },

  // Returns true if the line is parallel to the argument. Here, 'parallel to'
  // means that the argument's direction is either parallel or antiparallel to
  // the line's own direction. A line is parallel to a plane if the two do not
  // have a unique intersection.
  isParallelTo: function(obj) {
    if (obj.normal) { return obj.isParallelTo(this); }
    var theta = this.direction.angleFrom(obj.direction);
    return (Math.abs(theta) <= Sylvester.precision || Math.abs(theta - Math.PI) <= Sylvester.precision);
  },

  // Returns the line's perpendicular distance from the argument,
  // which can be a point, a line or a plane
  distanceFrom: function(obj) {
    if (obj.normal) { return obj.distanceFrom(this); }
    if (obj.direction) {
      // obj is a line
      if (this.isParallelTo(obj)) { return this.distanceFrom(obj.anchor); }
      var N = this.direction.cross(obj.direction).toUnitVector().elements;
      var A = this.anchor.elements, B = obj.anchor.elements;
      return Math.abs((A[0] - B[0]) * N[0] + (A[1] - B[1]) * N[1] + (A[2] - B[2]) * N[2]);
    } else {
      // obj is a point
      var P = obj.elements || obj;
      if (P.length == 2) { P.push(0); }
      var A = this.anchor.elements, D = this.direction.elements;
      var PA1 = P[0] - A[0], PA2 = P[1] - A[1], PA3 = P[2] - A[2];
      var modPA = Math.sqrt(PA1*PA1 + PA2*PA2 + PA3*PA3);
      if (modPA === 0) return 0;
      // Assumes direction vector is normalized
      var cosTheta = (PA1 * D[0] + PA2 * D[1] + PA3 * D[2]) / modPA;
      var sin2 = 1 - cosTheta*cosTheta;
      return Math.abs(modPA * Math.sqrt(sin2 < 0 ? 0 : sin2));
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
    if (obj.normal) { return obj.intersectionWith(this); }
    if (!this.intersects(obj)) { return null; }
    var P = this.anchor.elements, X = this.direction.elements,
        Q = obj.anchor.elements, Y = obj.direction.elements;
    var X1 = X[0], X2 = X[1], X3 = X[2], Y1 = Y[0], Y2 = Y[1], Y3 = Y[2];
    var PsubQ1 = P[0] - Q[0], PsubQ2 = P[1] - Q[1], PsubQ3 = P[2] - Q[2];
    var XdotQsubP = - X1*PsubQ1 - X2*PsubQ2 - X3*PsubQ3;
    var YdotPsubQ = Y1*PsubQ1 + Y2*PsubQ2 + Y3*PsubQ3;
    var XdotX = X1*X1 + X2*X2 + X3*X3;
    var YdotY = Y1*Y1 + Y2*Y2 + Y3*Y3;
    var XdotY = X1*Y1 + X2*Y2 + X3*Y3;
    var k = (XdotQsubP * YdotY / XdotX + XdotY * YdotPsubQ) / (YdotY - XdotY * XdotY);
    return Vector.create([P[0] + k*X1, P[1] + k*X2, P[2] + k*X3]);
  },

  // Returns the point on the line that is closest to the given point or line
  pointClosestTo: function(obj) {
    if (obj.direction) {
      // obj is a line
      if (this.intersects(obj)) { return this.intersectionWith(obj); }
      if (this.isParallelTo(obj)) { return null; }
      var D = this.direction.elements, E = obj.direction.elements;
      var D1 = D[0], D2 = D[1], D3 = D[2], E1 = E[0], E2 = E[1], E3 = E[2];
      // Create plane containing obj and the shared normal and intersect this with it
      // Thank you: http://www.cgafaq.info/wiki/Line-line_distance
      var x = (D3 * E1 - D1 * E3), y = (D1 * E2 - D2 * E1), z = (D2 * E3 - D3 * E2);
      var N = Vector.create([x * E3 - y * E2, y * E1 - z * E3, z * E2 - x * E1]);
      var P = Plane.create(obj.anchor, N);
      return P.intersectionWith(this);
    } else {
      // obj is a point
      var P = obj.elements || obj;
      if (P.length == 2) { P.push(0); }
      if (this.contains(P)) { return Vector.create(P); }
      var A = this.anchor.elements, D = this.direction.elements;
      var D1 = D[0], D2 = D[1], D3 = D[2], A1 = A[0], A2 = A[1], A3 = A[2];
      var x = D1 * (P[1]-A2) - D2 * (P[0]-A1), y = D2 * (P[2]-A3) - D3 * (P[1]-A2), z = D3 * (P[0]-A1) - D1 * (P[2]-A3);
      var V = Vector.create([D2 * x - D3 * z, D3 * y - D1 * x, D1 * z - D2 * y]);
      var k = this.distanceFrom(P) / V.modulus();
      return Vector.create([
        P[0] + V.elements[0] * k,
        P[1] + V.elements[1] * k,
        P[2] + V.elements[2] * k
      ]);
    }
  },

  // Returns a copy of the line rotated by t radians about the given line. Works by
  // finding the argument's closest point to this line's anchor point (call this C) and
  // rotating the anchor about C. Also rotates the line's direction about the argument's.
  // Be careful with this - the rotation axis' direction affects the outcome!
  rotate: function(t, line) {
    // If we're working in 2D
    if (typeof(line.direction) == 'undefined') { line = Line.create(line.to3D(), Vector.k); }
    var R = Matrix.Rotation(t, line.direction).elements;
    var C = line.pointClosestTo(this.anchor).elements;
    var A = this.anchor.elements, D = this.direction.elements;
    var C1 = C[0], C2 = C[1], C3 = C[2], A1 = A[0], A2 = A[1], A3 = A[2];
    var x = A1 - C1, y = A2 - C2, z = A3 - C3;
    return Line.create([
      C1 + R[0][0] * x + R[0][1] * y + R[0][2] * z,
      C2 + R[1][0] * x + R[1][1] * y + R[1][2] * z,
      C3 + R[2][0] * x + R[2][1] * y + R[2][2] * z
    ], [
      R[0][0] * D[0] + R[0][1] * D[1] + R[0][2] * D[2],
      R[1][0] * D[0] + R[1][1] * D[1] + R[1][2] * D[2],
      R[2][0] * D[0] + R[2][1] * D[1] + R[2][2] * D[2]
    ]);
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
      var A = this.anchor.elements, D = this.direction.elements;
      var A1 = A[0], A2 = A[1], A3 = A[2], D1 = D[0], D2 = D[1], D3 = D[2];
      var newA = this.anchor.reflectionIn(obj).elements;
      // Add the line's direction vector to its anchor, then mirror that in the plane
      var AD1 = A1 + D1, AD2 = A2 + D2, AD3 = A3 + D3;
      var Q = obj.pointClosestTo([AD1, AD2, AD3]).elements;
      var newD = [Q[0] + (Q[0] - AD1) - newA[0], Q[1] + (Q[1] - AD2) - newA[1], Q[2] + (Q[2] - AD3) - newA[2]];
      return Line.create(newA, newD);
    } else if (obj.direction) {
      // obj is a line - reflection obtained by rotating PI radians about obj
      return this.rotate(Math.PI, obj);
    } else {
      // obj is a point - just reflect the line's anchor in it
      var P = obj.elements || obj;
      if (P.length == 2) { P.push(0); }
      return Line.create(this.anchor.reflectionIn(P), this.direction);
    }
  },

  // Set the line's anchor point and direction.
  setVectors: function(anchor, direction) {
    if (!anchor.modulus) { anchor = Vector.create(anchor); }
    if (!direction.modulus) { direction = Vector.create(direction); }
    if (anchor.elements.length == 2) { anchor.elements.push(0); }
    if (direction.elements.length == 2) { direction.elements.push(0); }
    if (anchor.elements.length > 3 || direction.elements.length > 3) { return null; }
    var mod = direction.modulus();
    if (mod === 0) { return null; }
    this.anchor = anchor;
    this.direction = Vector.create([
      direction.elements[0] / mod,
      direction.elements[1] / mod,
      direction.elements[2] / mod
    ]);
    return this;
  }
};

  
// Constructor function
Line.create = function(anchor, direction) {
  var L = new Line();
  return L.setVectors(anchor, direction);
};
var $L = Line.create;

// Axes
Line.X = Line.create(Vector.Zero(3), Vector.i);
Line.Y = Line.create(Vector.Zero(3), Vector.j);
Line.Z = Line.create(Vector.Zero(3), Vector.k);



Line.Segment = function() {};
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
  
  // Returns true iff the line segment intersects the argument
  intersects: function(obj) {
    if (!this.line.intersects(obj)) { return false; }
    var P = this.line.intersectionWith(obj);
    return this.contains(P);
  },
  
  // Returns the unique point of intersection with the argument
  intersectionWith: function(obj) {
    return this.intersects(obj) ? this.line.intersectionWith(obj) : null;
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
    vector = vector.elements || vector;
    if (vector.length == 2) { vector.push(0); }
    return Plane.create([
      this.anchor.elements[0] + vector[0],
      this.anchor.elements[1] + vector[1],
      this.anchor.elements[2] + vector[2]
    ], this.normal);
  },

  // Returns true iff the plane is parallel to the argument. Will return true
  // if the planes are equal, or if you give a line and it lies in the plane.
  isParallelTo: function(obj) {
    var theta;
    if (obj.normal) {
      // obj is a plane
      theta = this.normal.angleFrom(obj.normal);
      return (Math.abs(theta) <= Sylvester.precision || Math.abs(Math.PI - theta) <= Sylvester.precision);
    } else if (obj.direction) {
      // obj is a line
      return this.normal.isPerpendicularTo(obj.direction);
    }
    return null;
  },
  
  // Returns true iff the receiver is perpendicular to the argument
  isPerpendicularTo: function(plane) {
    var theta = this.normal.angleFrom(plane.normal);
    return (Math.abs(Math.PI/2 - theta) <= Sylvester.precision);
  },

  // Returns the plane's distance from the given object (point, line or plane)
  distanceFrom: function(obj) {
    if (this.intersects(obj) || this.contains(obj)) { return 0; }
    if (obj.anchor) {
      // obj is a plane or line
      var A = this.anchor.elements, B = obj.anchor.elements, N = this.normal.elements;
      return Math.abs((A[0] - B[0]) * N[0] + (A[1] - B[1]) * N[1] + (A[2] - B[2]) * N[2]);
    } else {
      // obj is a point
      var P = obj.elements || obj;
      if (P.length == 2) { P.push(0); }
      var A = this.anchor.elements, N = this.normal.elements;
      return Math.abs((A[0] - P[0]) * N[0] + (A[1] - P[1]) * N[1] + (A[2] - P[2]) * N[2]);
    }
  },

  // Returns true iff the plane contains the given point or line
  contains: function(obj) {
    if (obj.normal) { return null; }
    if (obj.direction) {
      return (this.contains(obj.anchor) && this.contains(obj.anchor.add(obj.direction)));
    } else {
      var P = obj.elements || obj;
      if (P.length == 2) { P.push(0); }
      var A = this.anchor.elements, N = this.normal.elements;
      var diff = Math.abs(N[0]*(A[0] - P[0]) + N[1]*(A[1] - P[1]) + N[2]*(A[2] - P[2]));
      return (diff <= Sylvester.precision);
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
      var A = obj.anchor.elements, D = obj.direction.elements,
          P = this.anchor.elements, N = this.normal.elements;
      var multiplier = (N[0]*(P[0]-A[0]) + N[1]*(P[1]-A[1]) + N[2]*(P[2]-A[2])) / (N[0]*D[0] + N[1]*D[1] + N[2]*D[2]);
      return Vector.create([A[0] + D[0]*multiplier, A[1] + D[1]*multiplier, A[2] + D[2]*multiplier]);
    } else if (obj.normal) {
      // obj is a plane
      var direction = this.normal.cross(obj.normal).toUnitVector();
      // To find an anchor point, we find one co-ordinate that has a value
      // of zero somewhere on the intersection, and remember which one we picked
      var N = this.normal.elements, A = this.anchor.elements,
          O = obj.normal.elements, B = obj.anchor.elements;
      var solver = Matrix.Zero(2,2), i = 0;
      while (solver.isSingular()) {
        i++;
        solver = Matrix.create([
          [ N[i%3], N[(i+1)%3] ],
          [ O[i%3], O[(i+1)%3]  ]
        ]);
      }
      // Then we solve the simultaneous equations in the remaining dimensions
      var inverse = solver.inverse().elements;
      var x = N[0]*A[0] + N[1]*A[1] + N[2]*A[2];
      var y = O[0]*B[0] + O[1]*B[1] + O[2]*B[2];
      var intersection = [
        inverse[0][0] * x + inverse[0][1] * y,
        inverse[1][0] * x + inverse[1][1] * y
      ];
      var anchor = [];
      for (var j = 1; j <= 3; j++) {
        // This formula picks the right element from intersection by
        // cycling depending on which element we set to zero above
        anchor.push((i == j) ? 0 : intersection[(j + (5 - i)%3)%3]);
      }
      return Line.create(anchor, direction);
    }
  },

  // Returns the point in the plane closest to the given point
  pointClosestTo: function(point) {
    var P = point.elements || point;
    if (P.length == 2) { P.push(0); }
    var A = this.anchor.elements, N = this.normal.elements;
    var dot = (A[0] - P[0]) * N[0] + (A[1] - P[1]) * N[1] + (A[2] - P[2]) * N[2];
    return Vector.create([P[0] + N[0] * dot, P[1] + N[1] * dot, P[2] + N[2] * dot]);
  },

  // Returns a copy of the plane, rotated by t radians about the given line
  // See notes on Line#rotate.
  rotate: function(t, line) {
    var R = Matrix.Rotation(t, line.direction).elements;
    var C = line.pointClosestTo(this.anchor).elements;
    var A = this.anchor.elements, N = this.normal.elements;
    var C1 = C[0], C2 = C[1], C3 = C[2], A1 = A[0], A2 = A[1], A3 = A[2];
    var x = A1 - C1, y = A2 - C2, z = A3 - C3;
    return Plane.create([
      C1 + R[0][0] * x + R[0][1] * y + R[0][2] * z,
      C2 + R[1][0] * x + R[1][1] * y + R[1][2] * z,
      C3 + R[2][0] * x + R[2][1] * y + R[2][2] * z
    ], [
      R[0][0] * N[0] + R[0][1] * N[1] + R[0][2] * N[2],
      R[1][0] * N[0] + R[1][1] * N[1] + R[1][2] * N[2],
      R[2][0] * N[0] + R[2][1] * N[1] + R[2][2] * N[2]
    ]);
  },

  // Returns the reflection of the plane in the given point, line or plane.
  reflectionIn: function(obj) {
    if (obj.normal) {
      // obj is a plane
      var A = this.anchor.elements, N = this.normal.elements;
      var A1 = A[0], A2 = A[1], A3 = A[2], N1 = N[0], N2 = N[1], N3 = N[2];
      var newA = this.anchor.reflectionIn(obj).elements;
      // Add the plane's normal to its anchor, then mirror that in the other plane
      var AN1 = A1 + N1, AN2 = A2 + N2, AN3 = A3 + N3;
      var Q = obj.pointClosestTo([AN1, AN2, AN3]).elements;
      var newN = [Q[0] + (Q[0] - AN1) - newA[0], Q[1] + (Q[1] - AN2) - newA[1], Q[2] + (Q[2] - AN3) - newA[2]];
      return Plane.create(newA, newN);
    } else if (obj.direction) {
      // obj is a line
      return this.rotate(Math.PI, obj);
    } else {
      // obj is a point
      var P = obj.elements || obj;
      if (P.length == 2) { P.push(0); }
      return Plane.create(this.anchor.reflectionIn(P), this.normal);
    }
  },

  // Sets the anchor point and normal to the plane. If three arguments are specified,
  // the normal is calculated by assuming the three points should lie in the same plane.
  // If only two are sepcified, the second is taken to be the normal. Normal vector is
  // normalised before storage.
  setVectors: function(anchor, v1, v2) {
    if (!anchor.modulus) { anchor = Vector.create(anchor); }
    anchor = anchor.to3D(); if (anchor === null) { return null; }
    if (!v1.modulus) { v1 = Vector.create(v1); }
    v1 = v1.to3D(); if (v1 === null) { return null; }
    if (typeof(v2) == 'undefined') {
      v2 = null;
    } else {
      if (!v2.modulus) { v2 = Vector.create(v2); }
      v2 = v2.to3D(); if (v2 === null) { return null; }
    }
    var A1 = anchor.elements[0], A2 = anchor.elements[1], A3 = anchor.elements[2];
    var v11 = v1.elements[0], v12 = v1.elements[1], v13 = v1.elements[2];
    var normal, mod;
    if (v2 !== null) {
      var v21 = v2.elements[0], v22 = v2.elements[1], v23 = v2.elements[2];
      normal = Vector.create([
        (v12 - A2) * (v23 - A3) - (v13 - A3) * (v22 - A2),
        (v13 - A3) * (v21 - A1) - (v11 - A1) * (v23 - A3),
        (v11 - A1) * (v22 - A2) - (v12 - A2) * (v21 - A1)
      ]);
      mod = normal.modulus();
      if (mod === 0) { return null; }
      normal = Vector.create([normal.elements[0] / mod, normal.elements[1] / mod, normal.elements[2] / mod]);
    } else {
      mod = Math.sqrt(v11*v11 + v12*v12 + v13*v13);
      if (mod === 0) { return null; }
      normal = Vector.create([v1.elements[0] / mod, v1.elements[1] / mod, v1.elements[2] / mod]);
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
var $P = Plane.create;

// X-Y-Z planes
Plane.XY = Plane.create(Vector.Zero(3), Vector.k);
Plane.YZ = Plane.create(Vector.Zero(3), Vector.i);
Plane.ZX = Plane.create(Vector.Zero(3), Vector.j);
Plane.YX = Plane.XY; Plane.ZY = Plane.YZ; Plane.XZ = Plane.ZX;

// Returns the plane containing the given points (can be arrays as
// well as vectors). If the points are not coplanar, returns null.
Plane.fromPoints = function(points) {
  var list = [], i, P, n, N, prevN, totalN = Vector.Zero(3);
  for (i = 0; i < points.length; i++) {
    P = Vector.create(points[i]).to3D();
    if (P === null) { return null; }
    list.push(P);
    n = list.length;
    if (n > 2) {
      // Compute plane normal for the latest three points
      N = list[n-1].subtract(list[n-2]).cross(list[n-3].subtract(list[n-2])).toUnitVector();
      if (n > 3) {
        // If the latest normal is not (anti)parallel to the previous one, we've strayed off the plane.
        // This might be a slightly long-winded way of doing things, but we need the sum of all the normals
        // to find which way the plane normal should point so that the points form an anticlockwise list.
        if (N.angleFrom(prevN) !== null) {
          if (!(N.isParallelTo(prevN) || N.isAntiparallelTo(prevN))) { return null; }
        }
      }
      totalN = totalN.add(N);
      prevN = N;
    }
  }
  // We need to add in the normals at the start and end points, which the above misses out
  totalN = totalN.add(
    list[1].subtract(list[0]).cross(list[n-1].subtract(list[0])).toUnitVector()
  ).add(
    list[0].subtract(list[n-1]).cross(list[n-2].subtract(list[n-1])).toUnitVector()
  );
  return {plane: Plane.create(list[0], totalN), points: list};
};



function Polygon() {}
Polygon.prototype = {

  // Returns the vertex with the given ID. Vertices are numbered from 1.
  v: function(i) {
    if (i < 1 || i > this.vertices.last.id) { return null; }
    var node = null, vertex = this.vertices.first;
    for (var j = 0; j < this.vertices.length; j++) {
      if (vertex.id == i) node = vertex;
      vertex = vertex.next;
    }
    return node;
  },

  // Returns a copy of the polygon
  dup: function() {
    return Polygon.create(this.vertices);
  },
  
  // Returns a copy of the polygon after it's been translated
  // by the given vector. Any cached properties are transfered
  // to the new copy and changed as necessary.
  translate: function(vector) {
    vector = vector.to3D();
    if (vector === null) { return null; }
    var points = [];
    this.vertices.each(function(vertex) { points.push(vertex.add(vector)); } );
    var poly = Polygon.create(points);
    if (this.cached.triangles !== null) {
      poly.cached.triangles = [];
      for (var i = 0; i < this.cached.triangles.length; i++) {
        poly.cached.triangles.push(this.cached.triangles[i].translate(vector));
      }
    }
    return poly;
  },
  
  // Returns a copy of the polygon rotated about the given line
  // Any cached properties are transfered to the new copy and
  // changed as necessary.
  rotate: function(t, line) {
    var points = [];
    this.vertices.each(function(vertex) { points.push(vertex.rotate(t, line)); } );
    var poly = Polygon.create(points);
    if (this.cached.triangles !== null) {
      poly.cached.triangles = [];
      for (var i = 0; i < this.cached.triangles.length; i++) {
        poly.cached.triangles.push(this.cached.triangles[i].rotate(t, line));
      }
    }
    return poly;
  },
  
  // Scales a copy of the polygon relative to the given point
  // Any cached properties are transfered to the new copy and
  // changed as necessary.
  scale: function(k, point) {
    point = point.to3D();
    if (point === null) { return null; }
    var points = [];
    this.vertices.each(function(vertex) {
      points.push(point.add(vertex.subtract(point).x(k)));
    } );
    var poly = Polygon.create(points);
    if (this.cached.triangles !== null) {
      poly.cached.triangles = [];
      for (var i = 0; i < this.cached.triangles.length; i++) {
        poly.cached.triangles.push(this.cached.triangles[i].scale(k, point));
      }
    }
    return poly;
  },
  
  // Returns true iff the polygon is a triangle
  isTriangle: function() {
    return this.vertices.length == 3;
  },
  
  // Returns the area of the polygon. Requires that the polygon
  // be converted to triangles, so use with caution.
  area: function() {
    if (this.isTriangle()) {
      var base = this.v(2).subtract(this.v(1));
      return 0.5 * base.modulus() * this.v(3).distanceFrom(Line.create(this.v(1), base));
    } else {
      var trigs = this.toTriangles(), area = 0;
      for (var i = 0; i < trigs.length; i++) {
        area += trigs[i].area();
      }
      return area;
    }
  },
  
  // Returns the centroid of the polygon. Requires division into
  // triangles - use with caution
  centroid: function() {
    if (this.isTriangle()) {
      return this.v(1).add(this.v(2)).add(this.v(3)).x(1/3);
    } else {
      var A, M = 0, V = Vector.Zero(3), trigs = this.toTriangles();
      for (i = 0; i < trigs.length; i++) {
        A = trigs[i].area();
        M += A;
        V = V.add(trigs[i].centroid().x(A));
      }
      return V.x(1/M);
    }
  },
  
  // Returns the polygon's projection on the given plane as another polygon
  projectionOn: function(plane) {
    var points = [];
    this.vertices.each(function(vertex) { points.push(plane.pointClosestTo(vertex)); });
    return Polygon.create(points);
  },
  
  // Removes the given vertex from the polygon as long as it's not triangular.
  // Warning: vertices are NOT renumbered when removal happens.
  removeVertex: function(i) {
    var vertex = this.v(i);
    if (vertex === null) { return null; }
    if (!this.isTriangle()) {
      this.clearCache();
      var prev = vertex.prev, next = vertex.next;
      var prevWasConvex = prev.isConvex();
      var nextWasConvex = next.isConvex();
      if (vertex.isConvex()) {
        this.convexVertices.remove(vertex.copy);
      } else {
        this.reflexVertices.remove(vertex.copy);
      }
      this.vertices.remove(vertex);
      // Deal with previous vertex's change of class
      if (prevWasConvex != prev.isConvex()) {
        if (prevWasConvex) {
          this.convexVertices.remove(prev.copy);
          this.reflexVertices.append(prev.copy);
        } else {
          this.reflexVertices.remove(prev.copy);
          this.convexVertices.append(prev.copy);
        }
      }
      // Deal with next vertex's change of class
      if (nextWasConvex != next.isConvex()) {
        if (nextWasConvex) {
          this.convexVertices.remove(next.copy);
          this.reflexVertices.append(next.copy);
        } else {
          this.reflexVertices.remove(next.copy);
          this.convexVertices.append(next.copy);
        }
      }
    }
    return this;
  },
  
  // Returns true iff the point is strictly inside the polygon
  contains: function(point) {
    point = point.to3D();
    if (point === null) { return null; }
    if (!this.plane.contains(point)) { return false; }
    if (this.hasEdgeContaining(point)) { return false; }
    // Pick projection direction
    var axis = this.plane.normal.indexOf(this.plane.normal.max());
    var normal = Vector.create([(axis == 1) ? 1 : 0, (axis == 2) ? 1 : 0, (axis == 3) ? 1 : 0]);
    var rayDir = Vector.create([(axis == 3) ? 1 : 0, (axis == 1) ? 1 : 0, (axis == 2) ? 1 : 0]);
    // Project polygon and point onto a 2D plane
    var plane = Plane.create([0,0,0], normal);
    var projectedPoly = this.projectionOn(plane);
    var projectedPoint = plane.pointClosestTo(point);
    // Create ray from the point
    var ray = Line.create(projectedPoint, rayDir);
    var line, intersection, cuts = 0, vertex = this.vertices.first;
    for (var i = 0; i < this.vertices.length; i++) {
      line = Line.Segment.create(vertex, vertex.next);
      intersection = line.intersectionWith(ray);
      if (intersection !== null) {
        if (intersection.eql(line.start) || intersection.eql(line.end)) {
          // If the intersection is a vertex then rotate the polygon about the point slightly
          return this.rotate(Math.PI/180, Line.create(projectedPoint, normal)).contains(point);
        }
        if (ray.positionOf(intersection) >= 0) { cuts++; }
      } else if (ray.contains(line.start) && ray.contains(line.end)) {
        // If the edge lies on the ray then rotate the polygon
        return this.rotate(Math.PI/180, Line.create(projectedPoint, normal)).contains(point);
      }
      vertex = vertex.next;
    }
    return (cuts%2 != 0);
  },
  
  // Returns true if the given point lies on an edge of the polygon
  // May cause problems with 'hole-joining' edges
  hasEdgeContaining: function(point) {
    point = point.to3D();
    if (point === null) { return null; }
    var success = false;
    this.vertices.each(function(vertex) {
      if (Line.Segment.create(vertex, vertex.next).contains(point)) { success = true; }
    } );
    return success;
  },
  
  // Returns an array of 3-vertex polygons that the original has been split into
  // Stores the first calculation for faster retrieval later on
  toTriangles: function() {
    if (this.cached.triangles !== null) { return this.cached.triangles; }
    return this.setCache('triangles', this.triangulateByEarClipping());
  },
  
  // Implementation of ear clipping algorithm
  // Found in 'Triangulation by ear clipping', by David Eberly
  // at http://www.geometrictools.com
  // This will not deal with overlapping sections - contruct your polygons sensibly
  triangulateByEarClipping: function() {
    var poly = this.dup(), triangles = [], success, vertex, trig;
    while (!poly.isTriangle()) {
      success = false;
      while (!success) {
        success = true;
        // Ear tips must be convex vertices - let's pick one at random
        vertex = poly.convexVertices.randomNode();
        // Need to use .parent otherwise we're picking adjacent points in the convex list!
        // For convex vertices, this order will always be anticlockwise
        trig = Polygon.create([vertex, vertex.parent.next, vertex.parent.prev]);
        // Now test whether any reflex vertices lie within the ear
        poly.reflexVertices.each(function(V) {
          // Don't test points belonging to this triangle. V won't be
          // equal to vertex as V is reflex and vertex is convex.
          if (V != vertex.parent.prev.copy && V != vertex.parent.next.copy) {
            if (trig.contains(V) || trig.hasEdgeContaining(V)) { success = false; }
          }
        } );
      }
      triangles.push(trig);
      poly.removeVertex(vertex.parent.id);
    }
    // Need to do this to renumber the remaining vertices
    triangles.push(Polygon.create(poly.vertices.toArray()));
    return triangles;
  },
  
  // Sets the polygon's vertices
  setVertices: function(points) {
    if (points.toArray) { points = points.toArray(); }
    var P = Plane.fromPoints(points);
    if (P === null) { return null; }
    if (P.plane === null) { return null; }
    this.plane = P.plane;
    this.vertices = new LinkedList.Circular();
    var i, n = P.points.length, newVertex;
    // Construct linked list of vertices
    for (i = 0; i < n; i++) {
      newVertex = new Polygon.Vertex(this, P.points[i]);
      newVertex.id = i + 1;
      this.vertices.append(newVertex);
    }
    this.convexVertices = new LinkedList.Circular();
    this.reflexVertices = new LinkedList.Circular();
    var vertex = this.vertices.first;
    for (i = 0; i < n; i++){
      // Split vertices into convex / reflex groups
      // Each vertex has a copy property, which is a vector copied from the vertex.
      // The copy has a parent property which is the original vertex. This allows linking
      // between the vertex list and these category lists.
      if (vertex.isConvex()) {
        this.convexVertices.append(vertex.copy);
      } else {
        this.reflexVertices.append(vertex.copy);
      }
      vertex = vertex.next;
    }
    this.clearCache();
    return this;
  },
  
  // Clear any cached properties
  clearCache: function() {
    this.cached = {
      triangles: null
    };
  },
  
  // Set cached value and return the value
  setCache: function(key, value) {
    this.cached[key] = value;
    return value;
  }
};

// Constructor function
Polygon.create = function(points) {
  var P = new Polygon();
  return P.setVertices(points);
};



// The Polygon.Vertex class. This is used internally when dealing with polygon operations.
Polygon.Vertex = function(polygon, point) {
  this.polygon = polygon;
  this.setElements(point);
  this.copy = this.dup();
  this.copy.parent = this;
};
Polygon.Vertex.prototype = new Vector;

// Returns true iff the vertex's internal angle is 0 >= x > 180
Polygon.Vertex.prototype.isConvex = function() {
  var A = this.next.subtract(this);
  var B = this.prev.subtract(this);
  if (A.isParallelTo(B)) { return true; }
  if (A.isAntiparallelTo(B)) { return false; }
  var N = A.cross(B);
  return N.isParallelTo(this.polygon.plane.normal);
};
// Returns true iff the vertex's internal angle is 180 >= x > 360
Polygon.Vertex.prototype.isReflex = function() {
  return !this.isConvex();
};
Polygon.Vertex.prototype.type = function() {
  return this.isConvex() ? 'convex' : 'reflex';
};



// Linked list data structure - required for polygons
function LinkedList() {}
LinkedList.prototype = {
  length: 0,
  first: null,
  last: null,
  
  each: function(fn) {
    var vertex = this.first;
    for (var i = 0; i < this.length; i++) {
      fn(vertex);
      vertex = vertex.next;
    }
  },
  
  toArray: function() {
    var arr = [], node = this.first;
    if (node === null) { return arr; }
    for (var i = 0; i < this.length; i++) {
      arr.push(node);
      node = node.next;
    }
    return arr;
  },
  
  randomNode: function() {
    var n = Math.floor(Math.random() * this.length), node = this.first;
    for (i = 0; i < n; i++) { node = node.next; }
    return node;
  }
};

LinkedList.Circular = function() {};
LinkedList.Circular.prototype = new LinkedList;

LinkedList.Circular.prototype.append = function(node) {
  if (this.first === null) {
    node.prev = null;
    node.next = null;
    this.first = node;
    this.last = node;
  } else {
    node.prev = this.last;
    node.next = this.first;
    this.first.prev = node;
    this.last.next = node;
    this.last = node;
  }
  this.length++;
};

LinkedList.Circular.prototype.prepend = function(node) {
  if (this.first === null) {
    this.append(node);
  } else {
    node.prev = this.last;
    node.next = this.first;
    this.first.prev = node;
    this.last.next = node;
    this.first = node;
  }
  this.length++;
};

LinkedList.Circular.prototype.insertAfter = function(node, newNode) {
  newNode.prev = node;
  newNode.next = node.next;
  node.next.prev = newNode;
  node.next = newNode;
  if (newNode.prev == this.last) { this.last = newNode; }
  this.length++;
};

LinkedList.Circular.prototype.insertBefore = function(node, newNode) {
  newNode.prev = node.prev;
  newNode.next = node;
  node.prev.next = newNode;
  node.prev = newNode;
  if (newNode.next == this.first) { this.first = newNode; }
  this.length++;
};

LinkedList.Circular.prototype.remove = function(node) {
  node.prev.next = node.next;
  node.next.prev = node.prev;
  if (node == this.first) { this.first = node.next; }
  if (node == this.last) { this.last = node.prev; }
  node.prev = null;
  node.next = null;
  this.length--;
};

LinkedList.Circular.fromArray = function(list) {
  var linked = new LinkedList.Circular();
  for (var i = 0; i < list.length; i++) {
    list[i].id = i;
    linked.append(list[i]);
  }
  return linked;
};

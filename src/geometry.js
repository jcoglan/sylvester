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

var $P = Plane.create;



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
  
  // Returns a copy of the polygon rotated about the given line
  rotate: function(t, line) {
    var poly = this.dup();
    poly.vertices.each(function(vertex) {
      vertex.setElements(vertex.rotate(t, line).elements);
    } );
    // TODO: rotate triangles if they are cached
    return poly;
  },
  
  // Scales a copy of the polygon relative to the given point
  scale: function(k, point) {
    point = point.to3D();
    if (point === null) { return null; }
    var points = [];
    this.vertices.each(function(vertex) {
      points.push(point.add(vertex.subtract(point).x(k)));
    } );
    return Polygon.create(points);
  },
  
  // Returns true iff the polygon is a triangle
  isTriangle: function() {
    return this.vertices.length == 3;
  },
  
  // Returns the area of the polygon
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

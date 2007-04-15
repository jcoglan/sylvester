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

var Sylvester = {
  precision: 1e-6
};

function Vector() {}
Vector.prototype = {

  // Returns element i of the vector
  e: function(i) {
    return (i < 1 || i > this.dimensions()) ? null : this.elements[i - 1];
  },

  // Returns the number of elements the vector has
  dimensions: function() {
    return this.elements.length;
  },

  // Returns the modulus ('length') of the vector
  modulus: function() {
    return Math.sqrt(this.dot(this));
  },

  // Returns true iff the vector is equal to the argument
  eql: function(vector) {
    if (this.dimensions() != vector.dimensions()) { return false; }
    for (var i = 1; i <= this.dimensions(); i++) {
      if (Math.abs(this.e(i) - vector.e(i)) > Sylvester.precision) { return false; }
    }
    return true;
  },

  // Returns a copy of the vector
  dup: function() {
    return Vector.create(this.elements);
  },

  // Maps the vector to another vector according to the given function
  map: function(fn) {
    var elements = [];
    for (var i = 1; i <= this.dimensions(); i++) {
      elements.push(fn(this.e(i), i));
    }
    return Vector.create(elements);
  },

  // Returns a new vector created by normalizing the receiver
  toUnitVector: function() {
    var r = this.modulus();
    if (r === 0) { return this.dup(); }
    return this.map(function(x) { return x/r; });
  },

  // Returns the angle between the vector and the argument (also a vector)
  angleFrom: function(vector) {
    var dot = this.dot(vector);
    if (dot === null || this.modulus() === 0 || vector.modulus() === 0) { return null; }
    var theta = this.dot(vector) / (this.modulus() * vector.modulus());
    if (theta < -1) { theta = -1; }
    if (theta > 1) { theta = 1; }
    return Math.acos(theta);
  },

  // Returns true iff the vector is parallel to the argument
  isParallelTo: function(vector) {
    var angle = this.angleFrom(vector);
    return (angle === null) ? null : (angle <= Sylvester.precision);
  },

  // Returns true iff the vector is antiparallel to the argument
  isAntiparallelTo: function(vector) {
    var angle = this.angleFrom(vector);
    return (angle === null) ? null : (Math.abs(angle - Math.PI) <= Sylvester.precision);
  },

  // Returns true iff the vector is perpendicular to the argument
  isPerpendicularTo: function(vector) {
    var dot = this.dot(vector);
    return (dot === null) ? null : (Math.abs(dot) <= Sylvester.precision);
  },

  // Returns the result of adding the argument to the vector
  add: function(vector) {
    if (this.dimensions() != vector.dimensions()) { return null; }
    return this.map(function(x, i) { return x + vector.e(i); });
  },

  // Returns the result of subtracting the argument from the vector
  subtract: function(vector) {
    return this.add(vector.x(-1));
  },

  // Returns the result of multiplying the elements of the vector by the argument
  multiply: function(k) {
    return this.map(function(x) { return x*k; });
  },

  x: function(k) { return this.multiply(k); },

  // Returns the scalar product of the vector with the argument
  // Both vectors must have equal dimensionality
  dot: function(vector) {
    var i, product = 0;
    if (this.dimensions() != vector.dimensions()) { return null; }
    for (i = 1; i <= this.dimensions(); i++) {
      product += this.e(i) * vector.e(i);
    }
    return product;
  },

  // Returns the vector product of the vector with the argument
  // Both vectors must have dimensionality 3
  cross: function(vector) {
    if (this.dimensions() != 3 || vector.dimensions() != 3) { return null; }
    return Vector.create([
      (this.e(2) * vector.e(3)) - (this.e(3) * vector.e(2)),
      (this.e(3) * vector.e(1)) - (this.e(1) * vector.e(3)),
      (this.e(1) * vector.e(2)) - (this.e(2) * vector.e(1))
    ]);
  },

  // Returns the (absolute) largest element of the vector
  max: function() {
    var m = 0;
    for (var i = 1; i <= this.dimensions(); i++) {
      if (Math.abs(this.e(i)) > Math.abs(m)) { m = this.e(i); }
    }
    return m;
  },

  // Returns the index of the first match found
  indexOf: function(x) {
    var index = null, i;
    for (i = 1; i <= this.dimensions(); i++) {
      if (index === null && this.e(i) == x) {
        index = i;
      }
    }
    return index;
  },

  // Returns a diagonal matrix with the vector's elements as its diagonal elements
  toDiagonalMatrix: function() {
    return Matrix.Diagonal(this.elements);
  },

  // Returns the result of rounding the elements of the vector
  round: function() {
    return this.map(function(x) { return Math.round(x); });
  },

  // Sets the elements of the vector to the given value if they
  // differ from it by less than Sylvester.precision
  snapTo: function(x) {
    return this.map(function(y) {
      return (Math.abs(y - x) <= Sylvester.precision) ? x : y;
    });
  },

  // Returns the vector's distance from the argument, when considered as a point in space
  distanceFrom: function(obj) {
    if (obj.anchor) { return obj.distanceFrom(this); }
    if (obj.dimensions() != this.dimensions()) { return null; }
    return this.subtract(obj).modulus();
  },

  // Returns true if the vector is point on the given line
  liesOn: function(line) {
    return line.contains(this);
  },

  // Return true iff the vector is a point in the given plane
  liesIn: function(plane) {
    return plane.contains(this);
  },

  // Rotates the vector about the given object. The object should be a 
  // point if the vector is 2D, and a line if it is 3D. Be careful with line directions!
  rotate: function(t, obj) {
    switch (this.dimensions()) {
      case 2:
        if (obj.dimensions() != 2) { return null; }
        return obj.add(Matrix.Rotation(t).x(this.subtract(obj)));
        break;
      case 3:
        if (!obj.direction) { return null; }
        var C = obj.pointClosestTo(this);
        var R = Matrix.Rotation(t, obj.direction);
        return C.add(R.x(this.subtract(C)));
        break;
      default:
        return null;
    }
  },

  // Returns the result of reflecting the point in the given point, line or plane.
  reflectionIn: function(obj) {
    if (obj.anchor) {
      // obj is a plane or line
      var P = this.to3D();
      if (P === null) { return null; }
      var C = obj.pointClosestTo(P);
      return C.add(C.subtract(P));
    } else {
      // obj is a point
      if (this.dimensions() != obj.dimensions()) { return null; }
      return obj.add(obj.subtract(this));
    }
  },

  // Utility to make sure vectors are 3D. If they are 2D, a zero z-component is added
  to3D: function() {
    var V = this.dup();
    switch (V.dimensions()) {
      case 3: return V; break;
      case 2: return Vector.create([V.e(1), V.e(2), 0]); break;
      default: return null;
    }
  },

  // Returns a string representation of the vector
  inspect: function() {
    return '[' + this.elements.join(', ') + ']';
  },

  // Set vector's elements from an array
  setElements: function(els) {
    if (typeof(els) == 'undefined') { return null; }
    this.elements = [];
    if (els.elements) { els = els.elements; }
    for (var i = 0; i < els.length; i++) {
      if (!isNaN(els[i])) { this.elements.push(els[i]); }
    }
    if (this.elements.length === 0) { return null; }
    return this;
  }
};
  
// Constructor function
Vector.create = function(elements) {
  var V = new Vector();
  return V.setElements(elements);
};

// i, j, k unit vectors
Vector.i = Vector.create([1,0,0]);
Vector.j = Vector.create([0,1,0]);
Vector.k = Vector.create([0,0,1]);

// Random vector of size n
Vector.Random = function(n) {
  return Vector.Zero(n).map(function() { return Math.random(); });
};

// Vector filled with zeros
Vector.Zero = function(n) {
  var elements = [];
  for (var i = 0; i < n; i++) {
    elements.push(0)
  }
  return Vector.create(elements);
};



function Matrix() {}
Matrix.prototype = {

  // Returns element (i,j) of the matrix
  e: function(i,j) {
    if (i < 1 || i > this.rows() || j < 1 || j > this.cols()) { return null; }
    return this.elements[i - 1][j - 1];
  },

  // Returns row k of the matrix as a vector
  row: function(k) {
    if (k > this.rows()) { return null; }
    return Vector.create(this.elements[k - 1]);
  },

  // Returns column k of the matrix as a vector
  col: function(k) {
    if (k > this.cols()) { return null; }
    var col = [];
    for (var i = 1; i <= this.rows(); i++) {
      col.push(this.e(i,k));
    }
    return Vector.create(col);
  },

  // Returns the number of rows/columns the matrix has
  dimensions: function() {
    return {rows: this.rows(), cols: this.cols()};
  },

  // Returns the number of rows in the matrix
  rows: function() {
    return this.elements.length;
  },

  // Returns the number of columns in the matrix
  cols: function() {
    return this.elements[0].length;
  },

  // Returns true iff the matrix is equal to the argument. You can supply
  // a vector as the argument, in which case the receiver must be a
  // one-column matrix equal to the vector.
  eql: function(matrix) {
    matrix = Matrix.create(matrix);
    if (this.rows() != matrix.rows() || this.cols() != matrix.cols()) { return false; }
    var i, j;
    for (i = 1; i <= this.rows(); i++) {
      if (!this.row(i).eql(matrix.row(i))) { return false; }
    }
    return true;
  },

  // Returns a copy of the matrix
  dup: function() {
    return Matrix.create(this.elements);
  },

  // Maps the matrix to another matrix (of the same dimensions) according to the given function
  map: function(fn) {
    var els = [], i, j;
    for (i = 1; i <= this.rows(); i++) {
      els[i - 1] = [];
      for (j = 1; j <= this.cols(); j++) {
        els[i - 1][j - 1] = fn(this.e(i,j), i, j);
      }
    }
    return Matrix.create(els);
  },

  // Returns true iff the argument has the same dimensions as the matrix
  isSameSizeAs: function(matrix) {
    matrix = Matrix.create(matrix);
    return (this.rows() == matrix.rows() &&
        this.cols() == matrix.cols());
  },

  // Returns the result of adding the argument to the matrix
  add: function(matrix) {
    matrix = Matrix.create(matrix);
    if (!this.isSameSizeAs(matrix)) { return null; }
    return this.map(function(x, i, j) { return x + matrix.e(i,j); });
  },

  // Returns the result of subtracting the argument from the matrix
  subtract: function(matrix) {
    return this.add(matrix.x(-1));
  },

  // Returns true iff the matrix can multiply the argument from the left
  canMultiplyFromLeft: function(matrix) {
    var mat = Matrix.create(matrix);
    return (this.cols() == mat.rows());
  },

  // Returns the result of multiplying the matrix from the right by the argument.
  // If the argument is a scalar then just multiply all the elements. If the argument is
  // a vector, a vector is returned, which saves you having to remember calling
  // col(1) on the result.
  multiply: function(matrix) {
    var i, j;
    if (matrix.elements) {
      var returnVector = matrix.modulus ? true : false;
      matrix = Matrix.create(matrix);
      if (!this.canMultiplyFromLeft(matrix)) { return null; }
      var self = this;
      var M = Matrix.Zero(this.rows(), matrix.cols()).map(
        function(x, i, j) { return self.row(i).dot(matrix.col(j)); }
      );
      return returnVector ? M.col(1) : M;
    } else {
      return this.map(function(x) { return x * matrix; });
    }
  },

  x: function(matrix) { return this.multiply(matrix); },

  // Returns a submatrix taken from the matrix
  // Argument order is: start row, start col, nrows, ncols
  // Element selection wraps if the required index is outside the matrix's bounds, so you could
  // use this to perform row/column cycling or copy-augmenting.
  minor: function(a, b, c, d) {
    var self = this;
    return Matrix.Zero(c, d).map(
      function(x, i, j) { return self.e((i + a - 2)%self.rows() + 1, (j + b - 2)%self.cols() + 1); }
    );
  },

  // Returns the transpose of the matrix
  transpose: function() {
    var self = this;
    return Matrix.Zero(this.cols(), this.rows()).map(function(x, i, j) { return self.e(j,i); });
  },

  // Returns true iff the matrix is square
  isSquare: function() {
    return (this.rows() == this.cols());
  },

  // Returns the (absolute) largest element of the matrix
  max: function() {
    var m = 0;
    for (var i = 1; i <= this.rows(); i++) {
      if (Math.abs(this.row(i).max()) > Math.abs(m)) { m = this.row(i).max(); }
    }
    return m;
  },

  // Returns the indeces of the first match found by reading row-by-row from left to right
  indexOf: function(x) {
    var index = null, i, j;
    for (i = 1; i <= this.rows(); i++) {
      for (j = 1; j <= this.cols(); j++) {
        if (index === null && this.e(i,j) == x) {
          index = {i: i, j: j};
        }
      }
    }
    return index;
  },

  // If the matrix is square, returns the diagonal elements as a vector.
  // Otherwise, returns null.
  diagonal: function() {
    if (!this.isSquare) { return null; }
    var els = [];
    for (var i = 1; i <= this.rows(); i++) {
      els.push(this.e(i,i));
    }
    return Vector.create(els);
  },

  // Make the matrix upper (right) triangular by Gaussian elimination.
  // This method only adds multiples of rows to other rows. No rows are
  // scaled up or switched, and the determinant is preserved. Elements that
  // are within rounding error precision of zero are snapped to zero.
  toRightTriangular: function() {
    var i, j, M = this.dup(), nonzero;
    for (i = 1; i < M.rows(); i++) {
      if (M.e(i,i) == 0) {
        nonzero = false;
        for (j = i + 1; j <= M.rows(); j++) {
          if (M.e(j,i) != 0 && !nonzero) {
            nonzero = true;
            M.elements[i - 1] = M.row(i).add(M.row(j)).elements;
          }
        }
      }
      if (M.e(i,i) != 0) {
        for (j = i + 1; j <= M.rows(); j++) {
          M.elements[j - 1] = M.row(j).subtract(M.row(i).x(M.e(j,i) / M.e(i,i))).elements;
        }
      }
    }
    return M.snapTo(0);
  },

  toUpperTriangular: function() { return this.toRightTriangular(); },

  // Returns the determinant for square matrices
  determinant: function() {
    if (!this.isSquare()) { return null; }
    var els = this.toRightTriangular().diagonal().elements;
    var det = els[0];
    for (var i = 1; i < els.length; i++) { det = det * els[i]; }
    return det;
  },

  det: function() { return this.determinant(); },

  // Returns true iff the matrix is singular
  isSingular: function() {
    return (this.isSquare() && this.determinant() === 0);
  },

  // Returns the trace for square matrices
  trace: function() {
    if (!this.isSquare()) { return null; }
    var els = this.toRightTriangular().diagonal().elements;
    var tr = els[0];
    for (var i = 1; i < els.length; i++) { tr = tr + els[i]; }
    return tr;
  },

  tr: function() { return this.trace(); },

  // Returns the rank of the matrix
  rank: function() {
    var M = this.toRightTriangular(), rank = 0;
    for (var i = 1; i <= this.rows(); i++) {
      // toRightTriangular snaps values to zero
      if (M.row(i).modulus() > 0) { rank++; }
    }
    return rank;
  },
  
  rk: function() { return this.rank(); },

  // Returns the result of attaching the given argument to the right-hand side of the matrix
  augment: function(matrix) {
    matrix = Matrix.create(matrix); // Allows us to supply vectors
    var self = this.dup();
    var i, j;
    if (self.rows() != matrix.rows()) { return null; }
    for (i = 0; i < self.rows(); i++) {
      for (j = 0; j < matrix.cols(); j++) {
        self.elements[i][self.rows() + j] = matrix.e(i+1,j+1);
      }
    }
    return self;
  },

  // Returns the inverse (if one exists) using Gauss-Jordan
  inverse: function() {
    var i, j;
    if (!this.isSquare() || this.isSingular()) { return null; }
    var n = this.rows();
    var M = this.augment(Matrix.I(n)).toRightTriangular();
    // Matrix is non-singular so there will be no zeros on the diagonal
    for (i = 1; i <= n; i++) {
      M.elements[i - 1] = M.row(i).x(1 / M.e(i,i)).elements;
    }
    for (i = n; i > 1; i--) {
      for (j = 1; j < i; j++) {
        M.elements[j - 1] = M.row(j).subtract(M.row(i).x(M.e(j,i))).elements;
      }
    }
    return M.minor(1, n+1, n, n);
  },

  inv: function() { return this.inverse(); },

  // Returns the result of rounding all the elements
  round: function() {
    return this.map(function(x) { return Math.round(x); });
  },

  // Sets the elements of the matrix to the given value if they
  // differ from it by less than Sylvester.precision
  snapTo: function(x) {
    var M = this.dup();
    for (var i = 1; i <= M.rows(); i++) {
      M.elements[i - 1] = M.row(i).snapTo(x).elements;
    }
    return M;
  },

  // Returns a string representation of the matrix
  inspect: function() {
    var matrix = this.dup();
    for (var i = 0; i < matrix.rows(); i++) {
      matrix.elements[i] = Vector.create(matrix.elements[i]).inspect();
    }
    return matrix.elements.join('\n');
  },

  // Set the matrix's elements from an array. If the argument passed
  // is a vector, the resulting matrix will be a single column.
  setElements: function(els) {
    var row, i, j, success = true;
    if (typeof(els) == 'undefined') { return null; }
    this.elements = [];
    if (els.elements) { els = els.elements; }
    for (i = 0; i < els.length; i++) {
      if (typeof(els[i][0]) != 'undefined') {
        row = [];
        for (j = 0; j < els[i].length; j++) {
          if (!isNaN(els[i][j])) { row.push(els[i][j]); }
        }
        if (i > 0 && this.elements[i-1].length != row.length) {
          success = false;
        } else {
          this.elements.push(row);
        }
      } else {
        if (!isNaN(els[i])) { this.elements.push([els[i]]); }
      }
    }
    if (!success) {
      this.elements = [];
      return null;
    } else {
      return this;
    }
  }
};

// Constructor function
Matrix.create = function(elements) {
  var M = new Matrix();
  return M.setElements(elements);
};

// Identity matrix of size n
Matrix.I = function(n) {
  var els = [], i, j;
  for (i = 0; i < n; i++) {
    els[i] = [];
    for (j = 0; j < n; j++) {
      els[i][j] = (i == j) ? 1 : 0;
    }
  }
  return Matrix.create(els);
};

// Diagonal matrix - all off-diagonal elements are zero
Matrix.Diagonal = function(elements) {
  if (typeof(elements) == 'undefined') { return null; }
  var V = Vector.create(elements);
  var n = V.dimensions();
  if (n <= 0) { return null; }
  var M = Matrix.I(n);
  for (var i = 0; i < n; i++) {
    M.elements[i][i] = V.elements[i];
  }
  return M;
};

// Rotation matrix about some axis. If no axis is
// supplied, assume we're after a 2D transform
Matrix.Rotation = function(t, a) {
  if (!a) {
    return Matrix.create([
      [Math.cos(t),  -Math.sin(t)],
      [Math.sin(t),   Math.cos(t)]
    ]);
  }
  var axis = a.dup();
  if (axis.dimensions() != 3) { return null; }
  axis = axis.toUnitVector();
  var rot = Matrix.RotationZ(t);
  // Axis is parallel to z-axis - just return that rotation
  if (axis.isParallelTo(Vector.k)) { return rot; }
  var projectionOnXY = Vector.create([axis.e(1), axis.e(2), 0]);
  var z_rot = Matrix.I(3), inv_z_rot = Matrix.I(3);
  if (!projectionOnXY.isParallelTo(Vector.i)) {
    // Axis does not lie in X-Z plane - change co-ordinates through R(Z)
    var Za = projectionOnXY.cross(Vector.i).toUnitVector();
    var Zt = Za.e(3) * projectionOnXY.angleFrom(Vector.i);
    axis = Matrix.RotationZ(Zt).x(axis);
    z_rot = Matrix.RotationZ(Zt);
    inv_z_rot = Matrix.RotationZ(-Zt);
  }
  // Axis lies in X-Z plame - change co-ordinates so that axis = z-axis, through R(Y)
  var Ya = axis.cross(Vector.k).toUnitVector();
  var Yt = Ya.e(2) * axis.angleFrom(Vector.k);
  var y_rot = Matrix.RotationY(Yt);
  var inv_y_rot = Matrix.RotationY(-Yt);
  return inv_z_rot.x(inv_y_rot).x(rot).x(y_rot).x(z_rot);
};

// Special case rotations
Matrix.RotationX = function(t) {
  return Matrix.create([
    [            1,             0,             0 ],
    [            0,   Math.cos(t),  -Math.sin(t) ],
    [            0,   Math.sin(t),   Math.cos(t) ]
  ]);
};
Matrix.RotationY = function(t) {
  return Matrix.create([
    [  Math.cos(t),             0,   Math.sin(t) ],
    [            0,             1,             0 ],
    [ -Math.sin(t),             0,   Math.cos(t) ]
  ]);
};
Matrix.RotationZ = function(t) {
  return Matrix.create([
    [  Math.cos(t),  -Math.sin(t),             0 ],
    [  Math.sin(t),   Math.cos(t),             0 ],
    [            0,             0,             1 ]
  ]);
};

// Random matrix of n rows, m columns
Matrix.Random = function(n, m) {
  return Matrix.Zero(n, m).map(
    function() { return Math.random(); }
  );
};

// Matrix filled with zeros
Matrix.Zero = function(n, m) {
  var els = [], i, j;
  for (i = 0; i < n; i++) {
    els[i] = [];
    for (j = 0; j < m; j++) {
      els[i][j] = 0;
    }
  }
  return Matrix.create(els);
};



// Utility functions
var $V = Vector.create;
var $M = Matrix.create;

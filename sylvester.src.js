// === Sylvester ===
// Vector and Matrix mathematics modules for JavaScript
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
    return (i < 1 || i > this.elements.length) ? null : this.elements[i-1];
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
    var n = this.elements.length;
    if (n != vector.elements.length) { return false; }
    do {
      if (Math.abs(this.elements[n-1] - vector.elements[n-1]) > Sylvester.precision) { return false; }
    } while (--n);
    return true;
  },

  // Returns a copy of the vector
  dup: function() {
    return Vector.create(this.elements);
  },

  // Maps the vector to another vector according to the given function
  map: function(fn) {
    var elements = [];
    this.each(function(x, i) {
      elements.push(fn(x, i));
    });
    return Vector.create(elements);
  },
  
  // Calls the iterator for each element of the vector in turn
  each: function(fn) {
    var n = this.elements.length, k = n, i;
    do { i = k - n;
      fn(this.elements[i], i+1);
    } while (--n);
  },

  // Returns a new vector created by normalizing the receiver
  toUnitVector: function() {
    var r = this.modulus();
    if (r === 0) { return this.dup(); }
    return this.map(function(x) { return x/r; });
  },

  // Returns the angle between the vector and the argument (also a vector)
  angleFrom: function(vector) {
    var dot = this.dot(vector), mod1 = this.modulus(), mod2 = vector.modulus();
    if (dot === null || mod1*mod2 === 0) { return null; }
    var theta = dot / (mod1*mod2);
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
    if (this.elements.length != vector.elements.length) { return null; }
    return this.map(function(x, i) { return x + vector.elements[i-1]; });
  },

  // Returns the result of subtracting the argument from the vector
  subtract: function(vector) {
    if (this.elements.length != vector.elements.length) { return null; }
    return this.map(function(x, i) { return x - vector.elements[i-1]; });
  },

  // Returns the result of multiplying the elements of the vector by the argument
  multiply: function(k) {
    return this.map(function(x) { return x*k; });
  },

  x: function(k) { return this.multiply(k); },

  // Returns the scalar product of the vector with the argument
  // Both vectors must have equal dimensionality
  dot: function(vector) {
    var i, product = 0, n = this.elements.length;
    if (n != vector.elements.length) { return null; }
    do { product += this.elements[n-1] * vector.elements[n-1]; } while (--n);
    return product;
  },

  // Returns the vector product of the vector with the argument
  // Both vectors must have dimensionality 3
  cross: function(vector) {
    if (this.elements.length != 3 || vector.elements.length != 3) { return null; }
    return Vector.create([
      (this.elements[1] * vector.elements[2]) - (this.elements[2] * vector.elements[1]),
      (this.elements[2] * vector.elements[0]) - (this.elements[0] * vector.elements[2]),
      (this.elements[0] * vector.elements[1]) - (this.elements[1] * vector.elements[0])
    ]);
  },

  // Returns the (absolute) largest element of the vector
  max: function() {
    var m = 0, n = this.elements.length, k = n, i;
    do { i = k - n;
      if (Math.abs(this.elements[i]) > Math.abs(m)) { m = this.elements[i]; }
    } while (--n);
    return m;
  },

  // Returns the index of the first match found
  indexOf: function(x) {
    var index = null, n = this.elements.length, k = n, i;
    do { i = k - n;
      if (index === null && this.elements[i] == x) {
        index = i + 1;
      }
    } while (--n);
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
    if (obj.elements.length != this.elements.length) { return null; }
    // this.subtract(obj).modulus()
    var sum = 0, part;
    this.each(function(x, i) {
      part = x - obj.elements[i-1];
      sum += part * part;
    });
    return Math.sqrt(sum);
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
    var R, x, y, z;
    switch (this.elements.length) {
      case 2:
        if (obj.elements.length != 2) { return null; }
        // obj.add(Matrix.Rotation(t).x(this.subtract(obj)))
        R = Matrix.Rotation(t);
        x = this.elements[0] - obj.elements[0];
        y = this.elements[1] - obj.elements[1];
        return Vector.create([
          obj.elements[0] + R.elements[0][0] * x + R.elements[0][1] * y,
          obj.elements[1] + R.elements[1][0] * x + R.elements[1][1] * y
        ]);
        break;
      case 3:
        if (!obj.direction) { return null; }
        var C = obj.pointClosestTo(this);
        R = Matrix.Rotation(t, obj.direction);
        // C.add(R.x(this.subtract(C)))
        x = this.elements[0] - C.elements[0];
        y = this.elements[1] - C.elements[1];
        z = this.elements[2] - C.elements[2];
        return Vector.create([
          C.elements[0] + R.elements[0][0] * x + R.elements[0][1] * y + R.elements[0][2] * z,
          C.elements[1] + R.elements[1][0] * x + R.elements[1][1] * y + R.elements[1][2] * z,
          C.elements[2] + R.elements[2][0] * x + R.elements[2][1] * y + R.elements[2][2] * z
        ]);
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
      var C1 = C.elements[0], C2 = C.elements[1], C3 = C.elements[2];
      var P1 = P.elements[0], P2 = P.elements[1], P3 = P.elements[2];
      return Vector.create([C1 + (C1 - P1), C2 + (C2 - P2), C3 + (C3 - P3)]);
    } else {
      // obj is a point
      if (this.elements.length != obj.elements.length) { return null; }
      var self = this;
      return obj.map(function(x, i) { return x + (x - self.elements[i-1]); });
    }
  },

  // Utility to make sure vectors are 3D. If they are 2D, a zero z-component is added
  to3D: function() {
    var V = this.dup();
    switch (V.elements.length) {
      case 3: break;
      case 2: V.elements.push(0); break;
      default: return null;
    }
    return V;
  },

  // Returns a string representation of the vector
  inspect: function() {
    return '[' + this.elements.join(', ') + ']';
  },

  // Set vector's elements from an array
  setElements: function(els) {
    this.elements = els.elements ? els.elements : els;
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
  var elements = [];
  do { elements.push(Math.random());
  } while (--n);
  return Vector.create(elements);
};

// Vector filled with zeros
Vector.Zero = function(n) {
  var elements = [];
  do { elements.push(0);
  } while (--n);
  return Vector.create(elements);
};



function Matrix() {}
Matrix.prototype = {

  // Returns element (i,j) of the matrix
  e: function(i,j) {
    if (i < 1 || i > this.elements.length || j < 1 || j > this.elements[0].length) { return null; }
    return this.elements[i-1][j-1];
  },

  // Returns row k of the matrix as a vector
  row: function(i) {
    if (i > this.elements.length) { return null; }
    return Vector.create(this.elements[i-1]);
  },

  // Returns column k of the matrix as a vector
  col: function(j) {
    if (j > this.elements[0].length) { return null; }
    var col = [], n = this.elements.length, k = n, i;
    do { i = k - n;
      col.push(this.elements[i][j-1]);
    } while (--n);
    return Vector.create(col);
  },

  // Returns the number of rows/columns the matrix has
  dimensions: function() {
    return {rows: this.elements.length, cols: this.elements[0].length};
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
    if (!matrix.determinant) { matrix = Matrix.create(matrix); }
    if (this.elements.length != matrix.elements.length ||
        this.elements[0].length != matrix.elements[0].length) { return false; }
    var i;
    for (i = 1; i <= this.elements.length; i++) {
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
    var els = [], ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
    do { i = ki - ni;
      nj = kj;
      els[i] = [];
      do { j = kj - nj;
        els[i][j] = fn(this.elements[i][j], i + 1, j + 1);
      } while (--nj);
    } while (--ni);
    return Matrix.create(els);
  },

  // Returns true iff the argument has the same dimensions as the matrix
  isSameSizeAs: function(matrix) {
    if (!matrix.determinant) { matrix = Matrix.create(matrix); }
    return (this.elements.length == matrix.elements.length &&
        this.elements[0].length == matrix.elements[0].length);
  },

  // Returns the result of adding the argument to the matrix
  add: function(matrix) {
    if (!matrix.determinant) { matrix = Matrix.create(matrix); }
    if (!this.isSameSizeAs(matrix)) { return null; }
    return this.map(function(x, i, j) { return x + matrix.elements[i-1][j-1]; });
  },

  // Returns the result of subtracting the argument from the matrix
  subtract: function(matrix) {
    if (!matrix.determinant) { matrix = Matrix.create(matrix); }
    if (!this.isSameSizeAs(matrix)) { return null; }
    return this.map(function(x, i, j) { return x - matrix.elements[i-1][j-1]; });
  },

  // Returns true iff the matrix can multiply the argument from the left
  canMultiplyFromLeft: function(matrix) {
    if (!matrix.determinant) { matrix = Matrix.create(matrix); }
    // this.columns should equal matrix.rows
    return (this.elements[0].length == matrix.elements.length);
  },

  // Returns the result of multiplying the matrix from the right by the argument.
  // If the argument is a scalar then just multiply all the elements. If the argument is
  // a vector, a vector is returned, which saves you having to remember calling
  // col(1) on the result.
  multiply: function(matrix) {
    if (!matrix.elements) {
      return this.map(function(x) { return x * matrix; });
    }
    var returnVector = matrix.modulus ? true : false;
    if (!matrix.determinant) { matrix = Matrix.create(matrix); }
    if (!this.canMultiplyFromLeft(matrix)) { return null; }
    var ni = this.elements.length, ki = ni, i, nj, kj = matrix.elements[0].length, j;
    var cols = this.elements[0].length, elements = [], sum, nc, c;
    do { i = ki - ni;
      elements[i] = [];
      nj = kj;
      do { j = kj - nj;
        sum = 0;
        nc = cols;
        do { c = cols - nc;
          sum += this.elements[i][c] * matrix.elements[c][j];
        } while (--nc);
        elements[i][j] = sum;
      } while (--nj);
    } while (--ni);
    var M = Matrix.create(elements);
    return returnVector ? M.col(1) : M;
  },

  x: function(matrix) { return this.multiply(matrix); },

  // Returns a submatrix taken from the matrix
  // Argument order is: start row, start col, nrows, ncols
  // Element selection wraps if the required index is outside the matrix's bounds, so you could
  // use this to perform row/column cycling or copy-augmenting.
  minor: function(a, b, c, d) {
    var elements = [], ni = c, i, nj, j;
    var rows = this.elements.length, cols = this.elements[0].length;
    do { i = c - ni;
      elements[i] = [];
      nj = d;
      do { j = d - nj;
        elements[i][j] = this.elements[(a+i-1)%rows][(b+j-1)%cols];
      } while (--nj);
    } while (--ni);
    return Matrix.create(elements);
  },

  // Returns the transpose of the matrix
  transpose: function() {
    var rows = this.elements.length, cols = this.elements[0].length;
    var elements = [], ni = cols, i, nj, j;
    do { i = cols - ni;
      elements[i] = [];
      nj = rows;
      do { j = rows - nj;
        elements[i][j] = this.elements[j][i];
      } while (--nj);
    } while (--ni);
    return Matrix.create(elements);
  },

  // Returns true iff the matrix is square
  isSquare: function() {
    return (this.elements.length == this.elements[0].length);
  },

  // Returns the (absolute) largest element of the matrix
  max: function() {
    var m = 0, ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
    do { i = ki - ni;
      nj = kj;
      do { j = kj - nj;
        if (Math.abs(this.elements[i][j]) > Math.abs(m)) { m = this.elements[i][j]; }
      } while (--nj);
    } while (--ni);
    return m;
  },

  // Returns the indeces of the first match found by reading row-by-row from left to right
  indexOf: function(x) {
    var index = null, ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
    do { i = ki - ni;
      nj = kj;
      do { j = kj - nj;
        if (this.elements[i][j] == x) { return {i: i+1, j: j+1}; }
      } while (--nj);
    } while (--ni);
    return null;
  },

  // If the matrix is square, returns the diagonal elements as a vector.
  // Otherwise, returns null.
  diagonal: function() {
    if (!this.isSquare) { return null; }
    var els = [], n = this.elements.length, k = n, i;
    do { i = k - n;
      els.push(this.elements[i][i]);
    } while (--n);
    return Vector.create(els);
  },

  // Make the matrix upper (right) triangular by Gaussian elimination.
  // This method only adds multiples of rows to other rows. No rows are
  // scaled up or switched, and the determinant is preserved.
  toRightTriangular: function() {
    var M = this.dup(), els;
    var n = this.elements.length, k = n, i, np, kp = this.elements[0].length, p;
    do { i = k - n;
      if (M.elements[i][i] == 0) {
        for (j = i + 1; j < k; j++) {
          if (M.elements[j][i] != 0) {
            els = []; np = kp;
            do { p = kp - np;
              els.push(M.elements[i][p] + M.elements[j][p]);
            } while (--np);
            M.elements[i] = els;
            break;
          }
        }
      }
      if (M.elements[i][i] != 0) {
        for (j = i + 1; j < k; j++) {
          var multiplier = M.elements[j][i] / M.elements[i][i];
          els = []; np = kp;
          do { p = kp - np;
            // Elements with column numbers up to an including the number
            // of the row that we're subtracting can safely be set straight to
            // zero, since that's the point of this routine and it avoids having
            // to loop over and correct rounding errors later
            els.push(p <= i ? 0 : M.elements[j][p] - M.elements[i][p] * multiplier);
          } while (--np);
          M.elements[j] = els;
        }
      }
    } while (--n);
    return M;
  },

  toUpperTriangular: function() { return this.toRightTriangular(); },

  // Returns the determinant for square matrices
  determinant: function() {
    if (!this.isSquare()) { return null; }
    var M = this.toRightTriangular();
    var det = M.elements[0][0], n = M.elements.length - 1, k = n, i;
    do { i = k - n + 1;
      det = det * M.elements[i][i];
    } while (--n);
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
    var tr = this.elements[0][0], n = this.elements.length - 1, k = n, i;
    do { i = k - n + 1;
      tr += this.elements[i][i];
    } while (--n);
    return tr;
  },

  tr: function() { return this.trace(); },

  // Returns the rank of the matrix
  rank: function() {
    var M = this.toRightTriangular(), rank = 0;
    var ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
    do { i = ki - ni;
      nj = kj;
      do { j = kj - nj;
        if (Math.abs(M.elements[i][j]) > Sylvester.precision) { rank++; break; }
      } while (--nj);
    } while (--ni);
    return rank;
  },
  
  rk: function() { return this.rank(); },

  // Returns the result of attaching the given argument to the right-hand side of the matrix
  augment: function(matrix) {
    if (!matrix.determinant) { matrix = Matrix.create(matrix); }
    var els = this.dup().elements, cols = els[0].length;
    var ni = els.length, ki = ni, i, nj, kj = matrix.elements[0].length, j;
    if (ni != matrix.elements.length) { return null; }
    do { i = ki - ni;
      nj = kj;
      do { j = kj - nj;
        els[i][cols + j] = matrix.elements[i][j];
      } while (--nj);
    } while (--ni);
    return Matrix.create(els);
  },

  // Returns the inverse (if one exists) using Gauss-Jordan
  inverse: function() {
    if (!this.isSquare() || this.isSingular()) { return null; }
    var ni = this.elements.length, ki = ni, i, j;
    var M = this.augment(Matrix.I(ni)).toRightTriangular();
    var np, kp = M.elements[0].length, p, els, divisor;
    var inverse_elements = [], new_element;
    // Matrix is non-singular so there will be no zeros on the diagonal
    // Cycle through rows from last to first
    do { i = ni - 1;
      // First, normalise diagonal elements to 1
      els = []; np = kp;
      inverse_elements[i] = [];
      divisor = M.elements[i][i];
      do { p = kp - np;
        new_element = M.elements[i][p] / divisor;
        els.push(new_element);
        // Shuffle of the current row of the right hand side into the results
        // array as it will not be modified by later runs through this loop
        if (p >= ki) { inverse_elements[i].push(new_element); }
      } while (--np);
      M.elements[i] = els;
      // Then, subtract this row from those above it to
      // give the identity matrix on the left hand side
      for (j = 0; j < i; j++) {
        els = []; np = kp;
        do { p = kp - np;
          els.push(M.elements[j][p] - M.elements[i][p] * M.elements[j][i]);
        } while (--np);
        M.elements[j] = els;
      }
    } while (--ni);
    return Matrix.create(inverse_elements);
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
    var n = this.elements.length, k = n, i;
    do { i = k - n;
      M.elements[i]  = M.row(i+1).snapTo(x).elements;
    } while (--n);
    return M;
  },

  // Returns a string representation of the matrix
  inspect: function() {
    var matrix_rows = [];
    var n = this.elements.length, k = n, i;
    do { i = k - n;
      matrix_rows.push(Vector.create(this.elements[i]).inspect());
    } while (--n);
    return matrix_rows.join('\n');
  },

  // Set the matrix's elements from an array. If the argument passed
  // is a vector, the resulting matrix will be a single column.
  setElements: function(els) {
    if (els.elements) { els = els.elements; }
    if (typeof(els[0][0]) != 'undefined') {
      var ni = els.length, ki = ni, i, nj, kj, j;
      this.elements = [];
      do { i = ki - ni;
        nj = els[i].length; kj = nj;
        this.elements[i] = [];
        do { j = kj - nj;
          this.elements[i][j] = els[i][j];
        } while (--nj);
      } while(--ni);
      return this;
    }
    var n = els.length, k = n, i;
    this.elements = [];
    do { i = k - n;
      this.elements.push([els[i]]);
    } while (--n);
    return this;
  }
};

// Constructor function
Matrix.create = function(elements) {
  var M = new Matrix();
  return M.setElements(elements);
};

// Identity matrix of size n
Matrix.I = function(n) {
  var els = [], k = n, i, nj, j;
  do { i = k - n;
    els[i] = []; nj = k;
    do { j = k - nj;
      els[i][j] = (i == j) ? 1 : 0;
    } while (--nj);
  } while (--n);
  return Matrix.create(els);
};

// Diagonal matrix - all off-diagonal elements are zero
Matrix.Diagonal = function(elements) {
  var n = elements.length, k = n, i;
  var M = Matrix.I(n);
  do { i = k - n;
    M.elements[i][i] = elements[i];
  } while (--n);
  return M;
};

// Rotation matrix about some axis. If no axis is
// supplied, assume we're after a 2D transform
Matrix.Rotation = function(theta, a) {
  if (!a) {
    return Matrix.create([
      [Math.cos(theta),  -Math.sin(theta)],
      [Math.sin(theta),   Math.cos(theta)]
    ]);
  }
  var axis = a.dup();
  if (axis.dimensions() != 3) { return null; }
  var mod = axis.modulus();
  var x = axis.elements[0]/mod, y = axis.elements[1]/mod, z = axis.elements[2]/mod;
  var s = Math.sin(theta), c = Math.cos(theta), t = 1 - c;
  // Formula derived here: http://www.gamedev.net/reference/articles/article1199.asp
  // That proof rotates the co-ordinate system so theta
  // becomes -theta and sin becomes -sin here.
  return Matrix.create([
    [ t*x*x + c, t*x*y - s*z, t*x*z + s*y ],
    [ t*x*y + s*z, t*y*y + c, t*y*z - s*x ],
    [ t*x*z - s*y, t*y*z + s*x, t*z*z + c ]
  ]);
};

// Special case rotations
Matrix.RotationX = function(t) {
  var c = Math.cos(t), s = Math.sin(t);
  return Matrix.create([
    [  1,  0,  0 ],
    [  0,  c, -s ],
    [  0,  s,  c ]
  ]);
};
Matrix.RotationY = function(t) {
  var c = Math.cos(t), s = Math.sin(t);
  return Matrix.create([
    [  c,  0,  s ],
    [  0,  1,  0 ],
    [ -s,  0,  c ]
  ]);
};
Matrix.RotationZ = function(t) {
  var c = Math.cos(t), s = Math.sin(t);
  return Matrix.create([
    [  c, -s,  0 ],
    [  s,  c,  0 ],
    [  0,  0,  1 ]
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
  var els = [], ni = n, i, nj, j;
  do { i = n - ni;
    els[i] = [];
    nj = m;
    do { j = m - nj;
      els[i][j] = 0;
    } while (--nj);
  } while (--ni);
  return Matrix.create(els);
};



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
    if (vector.elements) { vector = vector.elements; }
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
  //which can be a point, a line or a plane
  distanceFrom: function(obj) {
    if (obj.normal) { return obj.distanceFrom(this); }
    if (obj.direction) {
      // obj is a line
      if (this.isParallelTo(obj)) { return this.distanceFrom(obj.anchor); }
      var N = this.direction.cross(obj.direction).toUnitVector();
      // this.anchor.subtract(obj.anchor).dot(N)
      var A = this.anchor, B = obj.anchor;
      var N1 = N.elements[0], N2 = N.elements[1], N3 = N.elements[2];
      var A1 = A.elements[0], A2 = A.elements[1], A3 = A.elements[2];
      var B1 = B.elements[0], B2 = B.elements[1], B3 = B.elements[2];
      return Math.abs((A1 - B1) * N1 + (A2 - B2) * N2 + (A3 - B3) * N3);
    } else {
      // obj is a point
      var P = obj.to3D();
      if (P === null) { return null; }
      // var A = P.subtract(this.anchor);
      // return Math.abs(A.modulus() * Math.sin(A.angleFrom(this.direction)));
      var A = this.anchor, D = this.direction;
      var P1 = P.elements[0], P2 = P.elements[1], P3 = P.elements[2];
      var A1 = A.elements[0], A2 = A.elements[1], A3 = A.elements[2];
      var D1 = D.elements[0], D2 = D.elements[1], D3 = D.elements[2];
      var PA1 = P1 - A1, PA2 = P2 - A2, PA3 = P3 - A3;
      var modPA = Math.sqrt(PA1*PA1 + PA2*PA2 + PA3*PA3);
      if (modPA === 0) return 0;
      // Assumes direction vector is normalised
      var cosTheta = (PA1 * D1 + PA2 * D2 + PA3 * D3) / modPA;
      var sin2 = 1 - cosTheta*cosTheta;
      return Math.abs(modPA * Math.sqrt(sin2 < 0 ? 0 : sin2));
    }
  },

  // Returns true iff the argument is a point on the line
  contains: function(point) {
    var dist = this.distanceFrom(point);
    return (dist !== null && dist <= Sylvester.precision);
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
    var P1 = P.elements[0], P2 = P.elements[1], P3 = P.elements[2];
    var Q1 = Q.elements[0], Q2 = Q.elements[1], Q3 = Q.elements[2];
    var X1 = X.elements[0], X2 = X.elements[1], X3 = X.elements[2];
    var Y1 = Y.elements[0], Y2 = Y.elements[1], Y3 = Y.elements[2];
    var PsubQ1 = P1 - Q1, PsubQ2 = P2 - Q2, PsubQ3 = P3 - Q3;
    var XdotQsubP = - X1*PsubQ1 - X2*PsubQ2 - X3*PsubQ3;
    var YdotPsubQ = Y1*PsubQ1 + Y2*PsubQ2 + Y3*PsubQ3;
    var XdotX = X1*X1 + X2*X2 + X3*X3;
    var YdotY = Y1*Y1 + Y2*Y2 + Y3*Y3;
    var XdotY = X1*Y1 + X2*Y2 + X3*Y3;
    var k = (XdotQsubP * YdotY / XdotX + XdotY * YdotPsubQ) / (YdotY - XdotY * XdotY);
    return Vector.create([P1 + k*X1, P2 + k*X2, P3 + k*X3]);
  },

  // Returns the point on the line that is closest to the given point or line
  pointClosestTo: function(obj) {
    if (obj.direction) {
      // obj is a line
      if (this.intersects(obj)) { return this.intersectionWith(obj); }
      if (this.isParallelTo(obj)) { return null; }
      var D = this.direction, E = obj.direction;
      var D1 = D.elements[0], D2 = D.elements[1], D3 = D.elements[2];
      var E1 = E.elements[0], E2 = E.elements[1], E3 = E.elements[2];
      // Create plane containing obj and the shared normal and intersect this with it
      // Thank you: http://www.cgafaq.info/wiki/Line-line_distance
      var N = Vector.create([
        (D3 * E1 - D1 * E3) * E3 - (D1 * E2 - D2 * E1) * E2,
        (D1 * E2 - D2 * E1) * E1 - (D2 * E3 - D3 * E2) * E3,
        (D2 * E3 - D3 * E2) * E2 - (D3 * E1 - D1 * E3) * E1
      ]);
      var P = Plane.create(obj.anchor, N);
      return P.intersectionWith(this);
    } else {
      // obj is a point
      var P = obj.to3D();
      if (P === null) { return null; }
      if (this.contains(P)) { return P; }
      // P.add(this.direction.cross(this.direction.cross(P.subtract(this.anchor))).toUnitVector().x(this.distanceFrom(P)))
      var A = this.anchor, D = this.direction;
      var D1 = D.elements[0], D2 = D.elements[1], D3 = D.elements[2];
      var A1 = A.elements[0], A2 = A.elements[1], A3 = A.elements[2];
      var P1 = P.elements[0], P2 = P.elements[1], P3 = P.elements[2];
      var V = Vector.create([
        D2 * (D1 * (P2-A2) - D2 * (P1-A1)) - D3 * (D3 * (P1-A1) - D1 * (P3-A3)),
        D3 * (D2 * (P3-A3) - D3 * (P2-A2)) - D1 * (D1 * (P2-A2) - D2 * (P1-A1)),
        D1 * (D3 * (P1-A1) - D1 * (P3-A3)) - D2 * (D2 * (P3-A3) - D3 * (P2-A2))
      ]);
      var k = this.distanceFrom(P) / V.modulus();
      return Vector.create([
        P.elements[0] + V.elements[0] * k,
        P.elements[1] + V.elements[1] * k,
        P.elements[2] + V.elements[2] * k
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
    var R = Matrix.Rotation(t, line.direction);
    var C = line.pointClosestTo(this.anchor);
    var A = this.anchor;
    var C1 = C.elements[0], C2 = C.elements[1], C3 = C.elements[2];
    var A1 = A.elements[0], A2 = A.elements[1], A3 = A.elements[2];
    return Line.create([
      C1 + R.elements[0][0] * (A1 - C1) + R.elements[0][1] * (A2 - C2) + R.elements[0][2] * (A3 - C3),
      C2 + R.elements[1][0] * (A1 - C1) + R.elements[1][1] * (A2 - C2) + R.elements[1][2] * (A3 - C3),
      C3 + R.elements[2][0] * (A1 - C1) + R.elements[2][1] * (A2 - C2) + R.elements[2][2] * (A3 - C3)
    ], R.x(this.direction));
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

// Utility functions
var $V = Vector.create;
var $M = Matrix.create;
var $L = Line.create;
var $P = Plane.create;

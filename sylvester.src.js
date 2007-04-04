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

var Vector = {

  // Generic vector class
  Abstract: function(args) {
  
    // Returns element i of the vector
    this.e = function(i) {
      return (i < 1 || i > this.dimensions()) ? null : this.elements[i - 1];
    };
    
    // Returns the number of elements the vector has
    this.dimensions = function() {
      return this.elements.length;
    };
    
    // Returns the modulus ('length') of the vector
    this.modulus = function() {
      return Math.sqrt(this.dot(this));
    };
    
    // Returns true iff the vector is equal to the argument
    this.eql = function(vector) {
      if (this.dimensions() != vector.dimensions()) { return false; }
      for (var i = 1; i <= this.dimensions(); i++) {
        if (Math.abs(this.e(i) - vector.e(i)) > Sylvester.precision) { return false; }
      }
      return true;
    };
    
    // Returns a copy of the vector
    this.dup = function() {
      return Vector.create(this.elements);
    };
    
    // Maps the vector to another vector according to the given function
    this.map = function(fn) {
      var elements = [];
      for (var i = 1; i <= this.dimensions(); i++) {
        elements.push(fn(this.e(i), i));
      }
      return Vector.create(elements);
    };
    
    // Alters the vector so that its modulus is unity. Returns the vector
    this.normalize = function() {
      var r = this.modulus();
      this.setElements(this.map(function(x) { return x/r; }).elements);
      return this;
    };
    
    // Returns a new vector created by normalizing the receiver
    this.toUnitVector = function() {
      return this.dup().normalize();
    };
    
    // Returns the angle between the vector and the argument (also a vector)
    this.angleFrom = function(vector) {
      var dot = this.dot(vector);
      if (dot === null || this.modulus() === 0 || vector.modulus() === 0) { return null; }
      var theta = this.dot(vector) / (this.modulus() * vector.modulus());
      if (theta < -1) { theta = -1; }
      if (theta > 1) { theta = 1; }
      return Math.acos(theta);
    };
    
    // Returns true iff the vector is parallel to the argument
    this.isParallelTo = function(vector) {
      var angle = this.angleFrom(vector);
      return (angle === null) ? null : (angle <= Sylvester.precision);
    };
    
    // Returns true iff the vector is antiparallel to the argument
    this.isAntiparallelTo = function(vector) {
      var angle = this.angleFrom(vector);
      return (angle === null) ? null : (Math.abs(angle - Math.PI) <= Sylvester.precision);
    };
    
    // Returns true iff the vector is perpendicular to the argument
    this.isPerpendicularTo = function(vector) {
      var dot = this.dot(vector);
      return (dot === null) ? null : (Math.abs(dot) <= Sylvester.precision);
    };
    
    // Returns the result of adding the argument to the vector
    this.add = function(vector) {
      if (this.dimensions() != vector.dimensions()) { return null; }
      return this.map(function(x, i) { return x + vector.e(i); });
    };
    
    // Returns the result of subtracting the argument from the vector
    this.subtract = function(vector) {
      return this.add(vector.x(-1));
    };
    
    // Returns the result of multiplying the elements of the vector by the argument
    this.multiply = function(k) {
      return this.map(function(x) { return x*k; });
    };
    
    this.x = function(k) { return this.multiply(k); };
    
    // Returns the scalar product of the vector with the argument
    // Both vectors must have equal dimensionality
    this.dot = function(vector) {
      var i, product = 0;
      if (this.dimensions() != vector.dimensions()) { return null; }
      for (i = 1; i <= this.dimensions(); i++) {
        product += this.e(i) * vector.e(i);
      }
      return product;
    };
    
    // Returns the vector product of the vector with the argument
    // Both vectors must have dimensionality 3
    this.cross = function(vector) {
      if (this.dimensions() != 3 || vector.dimensions() != 3) { return null; }
      return Vector.create([
        (this.e(2) * vector.e(3)) - (this.e(3) * vector.e(2)),
        (this.e(3) * vector.e(1)) - (this.e(1) * vector.e(3)),
        (this.e(1) * vector.e(2)) - (this.e(2) * vector.e(1))
      ]);
    };
    
    // Returns the (absolute) largest element of the vector
    this.max = function() {
      var m = 0;
      for (var i = 1; i <= this.dimensions(); i++) {
        if (Math.abs(this.e(i)) > Math.abs(m)) { m = this.e(i); }
      }
      return m;
    };
    
    // Returns the index of the first match found
    this.indexOf = function(x) {
      var index = null, i;
      for (i = 1; i <= this.dimensions(); i++) {
        if (index === null && this.e(i) == x) {
          index = i;
        }
      }
      return index;
    };
    
    // Returns a diagonal matrix with the vector's elements as its diagonal elements
    this.toDiagonalMatrix = function() {
      return Matrix.Diagonal(this.elements);
    };
    
    // Returns the result of rounding the elements of the vector
    this.round = function() {
      return this.map(function(x) { return Math.round(x); });
    };
    
    // Sets the elements of the vector to the given value if they
    // differ from it by less than Sylvester.precision
    this.snapTo = function(x) {
      this.setElements(this.map(function(y) {
        return (Math.abs(y - x) <= Sylvester.precision) ? x : y;
      }).elements);
      return this;
    };
    
    // Unitily to make sure vectors are 3D. If they are 2D, a zero z-component is added
    this.to3D = function() {
      var V = this.dup();
      if (V.dimensions() == 3) { return V; }
      if (V.dimensions() == 2) {
        return Vector.create([V.e(1), V.e(2), 0]);
      }
      return null;
    };
    
    // Returns a string representation of the vector
    this.inspect = function() {
      return '[' + this.elements.join(', ') + ']';
    };
    
    // Set vector's elements from an array
    this.setElements = function(els) {
      if (els == undefined) { return null; }
      this.elements = [];
      if (els.elements) { els = els.elements; }
      for (var i = 0; i < els.length; i++) {
        if (!isNaN(els[i])) { this.elements.push(els[i]); }
      }
      if (this.elements.length === 0) { return null; }
      return this;
    };
  },
  
  // Constructor function
  create: function(elements) {
    var V = new Vector.Abstract();
    return V.setElements(elements);
  }
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



var Matrix = {

  // Generic matrix class
  Abstract: function(els) {
  
    // Returns element (i,j) of the matrix
    this.e = function(i,j) {
      if (i < 1 || i > this.rows() || j < 1 || j > this.cols()) { return null; }
      return this.elements[i - 1][j - 1];
    };
    
    // Returns row k of the matrix as a vector
    this.row = function(k) {
      if (k > this.rows()) { return null; }
      return Vector.create(this.elements[k - 1]);
    };
    
    // Returns column k of the matrix as a vector
    this.col = function(k) {
      if (k > this.cols()) { return null; }
      var col = [];
      for (var i = 1; i <= this.rows(); i++) {
        col.push(this.e(i,k));
      }
      return Vector.create(col);
    };
    
    // Returns the number of rows/columns the matrix has
    this.dimensions = function() {
      return {rows: this.rows(), cols: this.cols()};
    };
    
    // Returns the number of rows in the matrix
    this.rows = function() {
      return this.elements.length;
    };
    
    // Returns the number of columns in the matrix
    this.cols = function() {
      return this.elements[0].length;
    };
    
    // Returns true iff the matrix is equal to the argument. You can supply
    // a vector as the argument, in which case the receiver must be a
    // one-column matrix equal to the vector.
    this.eql = function(matrix) {
      matrix = Matrix.create(matrix);
      if (this.rows() != matrix.rows() || this.cols() != matrix.cols()) { return false; }
      var i, j;
      for (i = 1; i <= this.rows(); i++) {
        if (!this.row(i).eql(matrix.row(i))) { return false; }
      }
      return true;
    };
    
    // Returns a copy of the matrix
    this.dup = function() {
      return Matrix.create(this.elements);
    };
    
    // Maps the matrix to another matrix (of the same dimensions) according to the given function
    this.map = function(fn) {
      var els = [], i, j;
      for (i = 1; i <= this.rows(); i++) {
        els[i - 1] = [];
        for (j = 1; j <= this.cols(); j++) {
          els[i - 1][j - 1] = fn(this.e(i,j), i, j);
        }
      }
      return Matrix.create(els);
    };
    
    // Returns true iff the argument has the same dimensions as the matrix
    this.isSameSizeAs = function(matrix) {
      matrix = Matrix.create(matrix);
      return (this.rows() == matrix.rows() &&
          this.cols() == matrix.cols());
    };
    
    // Returns the result of adding the argument to the matrix
    this.add = function(matrix) {
      matrix = Matrix.create(matrix);
      if (!this.isSameSizeAs(matrix)) { return null; }
      return this.map(function(x, i, j) { return x + matrix.e(i,j); });
    };
    
    // Returns the result of subtracting the argument from the matrix
    this.subtract = function(matrix) {
      return this.add(matrix.x(-1));
    };
    
    // Returns true iff the matrix can multiply the argument from the left
    this.canMultiplyFromLeft = function(matrix) {
      var mat = Matrix.create(matrix);
      return (this.cols() == mat.rows());
    };
    
    // Returns the result of multiplying the matrix from the right by the argument.
    // If the argument is a scalar then just multiply all the elements.
    this.multiply = function(matrix) {
      var i, j;
      if (matrix.elements) {
        matrix = Matrix.create(matrix);
        if (!this.canMultiplyFromLeft(matrix)) { return null; }
        var self = this;
        return Matrix.Zero(this.rows(), matrix.cols()).map(
          function(x, i, j) { return self.row(i).dot(matrix.col(j)); }
        );
      } else {
        return this.map(function(x) { return x * matrix; });
      }
    };
    
    this.x = function(matrix) { return this.multiply(matrix); };
    
    // Returns a submatrix taken from the matrix
    // Argument order is: start row, start col, nrows, ncols
    // Element selection wraps if the required index is outside the matrix's bounds, so you could
    // use this to perform row/column cycling or copy-augmenting.
    this.minor = function(a, b, c, d) {
      var self = this;
      return Matrix.Zero(c, d).map(
        function(x, i, j) { return self.e((i + a - 2)%self.rows() + 1, (j + b - 2)%self.cols() + 1); }
      );
    };
    
    // Returns the transpose of the matrix
    this.transpose = function() {
      var self = this;
      return Matrix.Zero(this.cols(), this.rows()).map(function(x, i, j) { return self.e(j,i); });
    };
    
    // Returns true iff the matrix is square
    this.isSquare = function() {
      return (this.rows() == this.cols());
    };
    
    // Returns the (absolute) largest element of the matrix
    this.max = function() {
      var m = 0;
      for (var i = 1; i <= this.rows(); i++) {
        if (Math.abs(this.row(i).max()) > Math.abs(m)) { m = this.row(i).max(); }
      }
      return m;
    };
    
    // Returns the indeces of the first match found by reading row-by-row from left to right
    this.indexOf = function(x) {
      var index = null, i, j;
      for (i = 1; i <= this.rows(); i++) {
        for (j = 1; j <= this.cols(); j++) {
          if (index === null && this.e(i,j) == x) {
            index = {i: i, j: j};
          }
        }
      }
      return index;
    };
    
    // If the matrix is square, returns the diagonal elements as a vector.
    // Otherwise, returns null.
    this.diagonal = function() {
      if (!this.isSquare) { return null; }
      var els = [];
      for (var i = 1; i <= this.rows(); i++) {
        els.push(this.e(i,i));
      }
      return Vector.create(els);
    };
    
    // Make the matrix upper (right) triangular by Gaussian elimination.
    // This method only adds multiples of rows to other rows. No rows are
    // scaled up or switched, and the determinant is preserved. Elements that
    // are within rounding error precision of zero are snapped to zero.
    this.toRightTriangular = function() {
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
    };
    
    this.toUpperTriangular = function() { return this.toRightTriangular(); };
    
    // Returns the determinant for square matrices
    this.determinant = function() {
      if (!this.isSquare()) { return null; }
      var els = this.toRightTriangular().diagonal().elements;
      var det = els[0];
      for (var i = 1; i < els.length; i++) { det = det * els[i]; }
      return det;
    };
    
    this.det = function() { return this.determinant(); };
    
    // Returns true iff the matrix is singular
    this.isSingular = function() {
      return (this.isSquare() && this.determinant() === 0);
    };
    
    // Returns the trace for square matrices
    this.trace = function() {
      if (!this.isSquare()) { return null; }
      var els = this.toRightTriangular().diagonal().elements;
      var tr = els[0];
      for (var i = 1; i < els.length; i++) { tr = tr + els[i]; }
      return tr;
    };
    
    this.tr = function() { return this.trace(); };
    
    // Returns the result of attaching the given argument to the right-hand side of the matrix
    this.augment = function(matrix) {
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
    };
    
    // Returns the inverse (if one exists) using Gauss-Jordan
    this.inverse = function() {
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
    };
    
    this.inv = function() { return this.inverse(); };
    
    // Returns the result of rounding all the elements
    this.round = function() {
      return this.map(function(x) { return Math.round(x); });
    };
    
    // Sets the elements of the matrix to the given value if they
    // differ from it by less than Sylvester.precision
    this.snapTo = function(x) {
      for (var i = 1; i <= this.rows(); i++) {
        this.elements[i - 1] = this.row(i).snapTo(x).elements;
      }
      return this;
    };
    
    // Returns a string representation of the matrix
    this.inspect = function() {
      var matrix = this.dup();
      for (var i = 0; i < matrix.rows(); i++) {
        matrix.elements[i] = Vector.create(matrix.elements[i]).inspect();
      }
      return matrix.elements.join('\n');
    };
    
    // Set the matrix's elements from an array. If the argument passed
    // is a vector, the resulting matrix will be a single column.
    this.setElements = function(els) {
      var row, i, j, success = true;
      if (els == undefined) { return null; }
      this.elements = [];
      if (els.elements) { els = els.elements; }
      for (i = 0; i < els.length; i++) {
        if (els[i][0] !== undefined) {
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
    };
  },

  // Constructor function
  create: function(elements) {
    var M = new Matrix.Abstract();
    return M.setElements(elements);
  }
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
  if (elements == undefined) { return null; }
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
  axis = a.dup();
  if (axis.dimensions() != 3) { return null; }
  axis.normalize();
  var rot = Matrix.RotationZ(t);
  // Axis is parallel to z-axis - just return that rotation
  if (axis.isParallelTo(Vector.k)) { return rot; }
  var projectionOnXY = Vector.create([axis.e(1), axis.e(2), 0]);
  var z_rot = Matrix.I(3), inv_z_rot = Matrix.I(3);
  if (!projectionOnXY.isParallelTo(Vector.i)) {
    // Axis does not lie in X-Z plane - change co-ordinates through R(Z)
    var Za = projectionOnXY.cross(Vector.i).normalize();
    var Zt = Za.e(3) * projectionOnXY.angleFrom(Vector.i);
    axis = Matrix.RotationZ(Zt).x(axis).col(1);
    z_rot = Matrix.RotationZ(Zt);
    inv_z_rot = Matrix.RotationZ(-Zt);
  }
  // Axis lies in X-Z plame - change co-ordinates so that axis = z-axis, through R(Y)
  var Ya = axis.cross(Vector.k).normalize();
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



var Line = {

  // Generic line class
  Abstract: function() {
  
    // Returns true if the argument occupies the same space as the line
    this.eql = function(line) {
      return (this.isParallelTo(line) && this.includes(line.anchor));
    };
    
    // Returns a copy of the line
    this.dup = function() {
      return Line.create(this.anchor, this.direction);
    };
    
    // Shifts the line by the given vector
    this.shift = function(vector) {
      vector = Vector.create(vector).to3D();
      if (vector === null) { return null; }
      this.anchor = this.anchor.add(vector);
      return this;
    };
    
    // Returns true if the line is parallel to the argument. Here, 'parallel to'
    // means that the argument's direction is either parallel or antiparallel to
    // the line's own direction.
    this.isParallelTo = function(obj) {
      return (this.direction.isParallelTo(obj.direction) || this.direction.isAntiparallelTo(obj.direction));
    };
    
    // Returns the line's perpendicular distance from the argument,
    //which can be a point (a vector) or another line.
    // TODO: add support for planes
    this.distanceFrom = function(obj) {
      if (obj.direction) {
        // obj is a line
        if (this.isParallelTo(obj)) { return this.distanceFrom(obj.anchor); }
        var N = this.direction.cross(obj.direction).toUnitVector();
        return Math.abs(this.anchor.subtract(obj.anchor).dot(N));
      } else {
        // obj is a point
        var P = Vector.create(obj).to3D();
        if (P === null) { return null; }
        var A = P.subtract(this.anchor);
        return Math.abs(A.modulus() * Math.sin(A.angleFrom(this.direction)));
      }
    };
    
    // Returns true iff the argument is a point on the line
    this.includes = function(point) {
      var dist = this.distanceFrom(point);
      return (dist !== null && dist <= Sylvester.precision);
    };
    
    // Returns true iff the line has a unique point of intersection with the argument
    // TODO: add support for planes
    this.intersects = function(line) {
      return (!this.isParallelTo(line) && this.distanceFrom(line) <= Sylvester.precision);
    };
    
    // Returns the unique intersection point with the argument, if one exists
    // TODO: add plane support
    this.intersectionWith = function(obj) {
      if (!this.intersects(obj)) { return null; }
      var P = this.anchor, X = this.direction, Q = obj.anchor, Y = obj.direction;
      var a = (X.dot(Q.subtract(P)) * Math.pow(Y.modulus() / X.modulus(), 2)) + (X.dot(Y) * Y.dot(P.subtract(Q)));
      var s = a / (Math.pow(Y.modulus(), 2) - Math.pow(X.dot(Y), 2));
      return P.add(X.x(s));
    };
    
    // Returns the point on the line that is closest to the given point
    // TODO: add line support
    this.pointClosestTo = function(point) {
      point = Vector.create(point).to3D();
      if (point === null) { return null; }
      if (this.includes(point)) { return point; }
      var A = point.subtract(this.anchor);
      return point.add(this.direction.cross(this.direction.cross(A)).toUnitVector().x(this.distanceFrom(point)));
    };
    
    // Set the line's anchor point and direction.
    this.setVectors = function(anchor, direction) {
      anchor = Vector.create(anchor).to3D();
      direction = Vector.create(direction).to3D();
      if (anchor === null || direction === null || direction.modulus() === 0) { return null; }
      this.anchor = anchor;
      this.direction = direction.toUnitVector();
      return this;
    };
  },
  
  // Constructor function
  create: function(anchor, direction) {
    var L = new Line.Abstract();
    return L.setVectors(anchor, direction);
  }
};

// Axes
Line.X = Line.create(Vector.Zero(3), Vector.i);
Line.Y = Line.create(Vector.Zero(3), Vector.j);
Line.Z = Line.create(Vector.Zero(3), Vector.k);

// Utility functions
$V = Vector.create;
$M = Matrix.create;
$L = Line.create;

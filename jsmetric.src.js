// === jsMetric ===
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

var Vector = {

  // Generic vector class
  Abstract: function(args) {
  
    // Returns element i of the vector
    this.e = function(i) {
      return this.elements[i - 1];
    };
    
    // Returns the number of elements the vector has
    this.dimensions = function() {
      return this.elements.length;
    };
    
    // Returns the modulus ('length') of the vector
    this.modulus = function() {
      var r = 0;
      for (i = 1; i <= this.dimensions(); i++) {
        r += Math.pow(this.e(i), 2);
      }
      return Math.sqrt(r);
    };
    
    // Set vector's elements from an array
    this.setElements = function(args) {
      this.elements = [];
      for (var i = 0; i < args.length; i++) {
        if (!isNaN(args[i])) { this.elements.push(args[i]); }
      }
      this.r = this.modulus();
      this.d = this.dimensions();
      this.x = null || this.e(0);
      this.y = null || this.e(1);
      this.z = null || this.e(2);
      this.t = null || this.e(3);
    };
    
    // Construct the vector
    this.setElements(args);
    
    // Returns true iff the vector is equal to the argument
    this.eql = function(vector) {
      return (this.inspect() == vector.inspect());
    };
    
    // Returns a copy of the vector
    this.dup = function() {
      return Vector.create(this.elements);
    };
    
    // Alters the vector so that its modulus is unity. Returns the vector
    this.normalize = function() {
      var new_elements = [];
      for (var i = 0; i < this.dimensions(); i++) {
        new_elements.push(this.elements[i]/this.modulus());
      }
      this.setElements(new_elements);
      return this;
    };
    
    // Returns a new vector created by normalizing the receiver
    this.toUnitVector = function() {
      return this.dup().normalize();
    };
    
    // Returns the angle between the vector and the argument (also a vector)
    this.angleFrom = function(vector) {
      return Math.acos(this.dot(vector) / (this.modulus() * vector.modulus()));
    };
    
    // Returns true iff the vector is parallel to the argument
    this.isParallelTo = function(vector) {
      if (this.dimensions() != vector.dimensions()) {
        return null;
      } else {
        return (this.angleFrom(vector) < 1e-20);
      }
    };
    
    // Returns the result of adding the argument to the vector
    this.add = function(vector) {
      if (this.dimensions() != vector.dimensions()) {
        return null;
      } else {
        var elements = [];
        for (var i = 1; i <= this.dimensions(); i++) {
          elements.push(this.e(i) + vector.e(i));
        }
        return Vector.create(elements);
      }
    };
    
    // Returns the result of subtracting the argument from the vector
    this.subtract = function(vector) {
      return this.add(vector.x(-1));
    };
    
    // Returns the result of multiplying the elements of the vector by the argument
    this.multiply = function(k) {
      var new_elements = [];
      for (var i = 1; i <= this.dimensions(); i++) {
        new_elements.push(k * this.e(i));
      }
      return Vector.create(new_elements);
    };
    
    this.x = function(k) { return this.multiply(k); };
    
    // Returns the scalar product of the vector with the argument
    // Both vectors must have equal dimensionality
    this.dot = function(vector) {
      var i, product = 0;
      if (this.dimensions() != vector.dimensions()) {
        return null;
      } else {
        for (i = 1; i <= this.dimensions(); i++) {
          product += this.e(i) * vector.e(i);
        }
        return product;
      }
    };
    
    // Returns the vector product of the vector with the argument
    // Both vectors must have dimensionality 3
    this.cross = function(vector) {
      if (this.dimensions() != 3 || vector.dimensions() != 3) {
        return null;
      } else {
        return Vector.create(
          (this.e(2) * vector.e(3)) - (this.e(3) * vector.e(2)),
          (this.e(3) * vector.e(1)) - (this.e(1) * vector.e(3)),
          (this.e(1) * vector.e(2)) - (this.e(2) * vector.e(1))
        );
      }
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
      var new_elements = [];
      for (var i = 1; i <= this.dimensions(); i++) {
        new_elements.push(Math.round(this.e(i)));
      }
      return Vector.create(new_elements);
    };
    
    // Returns a string representation of the vector
    this.inspect = function() {
      return '[' + this.elements.join(', ') + ']';
    };
  },
  
  // Constructor function
  create: function() {
    if (arguments[0][0] == undefined) {
      return new Vector.Abstract(arguments);
    } else {
      return new Vector.Abstract(arguments[0]);
    }
  }
};

// i, j, k unit vectors
Vector.i = Vector.create(1,0,0);
Vector.j = Vector.create(0,1,0);
Vector.k = Vector.create(0,0,1);

// Random vector of size n
Vector.Random = function(n) {
  var elements = [];
  for (var i = 0; i < n; i++) {
    elements.push(Math.random());
  }
  return Vector.create(elements);
};



var Matrix = {

  // Generic matrix class
  Abstract: function(els) {
  
    // Returns element (i,j) of the matrix
    this.e = function(i,j) {
      return this.elements[i - 1][j - 1];
    };
    
    // Returns row k of the matrix as a vector
    this.row = function(k) {
      if (k > this.dimensions().rows) {
        return null;
      } else {
        return Vector.create(this.elements[k - 1]);
      }
    };
    
    // Returns column k of the matrix as a vector
    this.col = function(k) {
      if (k > this.dimensions().cols) {
        return null;
      } else {
        var col = [];
        for (var i = 1; i <= this.dimensions().rows; i++) {
          col.push(this.e(i,k));
        }
        return Vector.create(col);
      }
    };
    
    // Returns the number of rows/columns the matrix has
    this.dimensions = function() {
      return {rows: this.elements.length, cols: this.elements[0].length};
    };
    
    // Set the matrix's elements from an array. If the argument passed
    // is a vector, the resulting matrix will be a single column.
    this.setElements = function(els) {
      var row, i, j, success = true;
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
      if (!success) { this.elements = []; }
    };
    
    // Construct the matrix
    this.setElements(els);
    
    // Returns true iff the matrix is equal to the argument. You can supply
    // a vector as the argument, in which case the receiver must be a
    // one-column matrix equal to the vector.
    this.eql = function(matrix) {
      matrix = Matrix.create(matrix);
      return (this.inspect() == matrix.inspect());
    };
    
    // Returns a copy of the matrix
    this.dup = function() {
      return Matrix.create(this.elements);
    };
    
    // Returns true iff the argument has the same dimensions as the matrix
    this.isSameSizeAs = function(matrix) {
      matrix = Matrix.create(matrix);
      return (this.dimensions().rows == matrix.dimensions().rows &&
          this.dimensions().cols == matrix.dimensions().cols);
    };
    
    // Returns the result of adding the argument to the matrix
    this.add = function(matrix) {
      matrix = Matrix.create(matrix);
      if (!this.isSameSizeAs(matrix)) {
        return null;
      } else {
        var new_els = [], i, j;
        for (i = 1; i <= this.dimensions().rows; i++) {
          new_els[i - 1] = [];
          for (j = 1; j <= this.dimensions().cols; j++) {
            new_els[i - 1].push(this.e(i,j) + matrix.e(i,j));
          }
        }
        return Matrix.create(new_els);
      }
    };
    
    // Returns the result of subtracting the argument from the matrix
    this.subtract = function(matrix) {
      return this.add(matrix.x(-1));
    };
    
    // Returns true iff the matrix can multiply the argument from the left
    this.canMultiplyFromLeft = function(matrix) {
      var mat = Matrix.create(matrix);
      return (this.dimensions().cols == mat.dimensions().rows);
    };
    
    // Returns the result of multiplying the matrix from the right by the argument.
    // If the argument is a scalar then just multiply all the elements.
    this.multiply = function(matrix) {
      var i, j;
      if (matrix.elements) {
        matrix = Matrix.create(matrix);
        if (!this.canMultiplyFromLeft(matrix)) {
          return null;
        } else {
          var new_els = [], A, B;
          for (i = 0; i < this.dimensions().rows; i++) {
            A = this.row(i+1);
            new_els[i] = [];
            for (j = 0; j < matrix.dimensions().cols; j++) {
              B = matrix.col(j+1);
              new_els[i][j] = A.dot(B);
            }
          }
          return Matrix.create(new_els);
        }
      } else {
        var M = this.dup();
        for (i = 0; i < this.dimensions().rows; i++) {
          for (j = 0; j < this.dimensions().cols; j++) {
            M.elements[i][j] = M.e(i+1,j+1) * matrix;
          }
        }
        return M;
      }
    };
    
    this.x = function(matrix) { return this.multiply(matrix); };
    
    // Returns a submatrix taken from the matrix
    // Argument order is: start row, start col, nrows, ncols
    this.minor = function(a, b, c, d) {
      if (a < 1 || b < 1 || a + c - 1 > this.dimensions().rows || b + d - 1 > this.dimensions().cols) {
        return null;
      } else {
        var i, j, new_els = [];
        for (i = a; i <= a + c - 1; i++) {
          new_els[i - a] = [];
          for (j = b; j <= b + d - 1; j++) {
            new_els[i - a][j - b] = this.e(i,j);
          }
        }
        return Matrix.create(new_els);
      }
    };
    
    // Returns true iff the matrix is square
    this.isSquare = function() {
      var d = this.dimensions();
      return (d.rows == d.cols);
    };
    
    // Returns the (absolute) largest element of the matrix
    this.max = function() {
      var m = 0;
      for (var i = 1; i <= this.dimensions().rows; i++) {
        if (Math.abs(this.row(i).max()) > Math.abs(m)) { m = this.row(i).max(); }
      }
      return m;
    };
    
    // Returns the indeces of the first match found by reading row-by-row from left to right
    this.indexOf = function(x) {
      var index = null, i, j;
      for (i = 1; i <= this.dimensions().rows; i++) {
        for (j = 1; j <= this.dimensions().cols; j++) {
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
      if (!this.isSquare) {
        return null;
      } else {
        var els = [];
        for (var i = 1; i <= this.dimensions().rows; i++) {
          els.push(this.e(i,i));
        }
        return Vector.create(els);
      }
    };
    
    // Diagonalize the matrix by Gaussian elimination. This method only
    // adds multiples of rows to other rows. No rows are scaled up or
    // switched, and the determinant is preserved.
    this.diagonalize = function() {
      var i, j;
      for (i = 1; i < this.dimensions().rows; i++) {
        if (this.e(i,i) != 0) {
          for (j = i + 1; j <= this.dimensions().rows; j++) {
            this.elements[j - 1] = this.row(j).subtract(this.row(i).x(this.e(j,i) / this.e(i,i))).elements;
          }
        }
      }
      return this;
    };
    
    // Returns the result of diagonalizing the matrix
    this.toDiagonalMatrix = function() {
      return this.dup().diagonalize();
    };
    
    // Returns the determinant for square matrices
    this.determinant = function() {
      if (!this.isSquare()) {
        return null;
      } else {
        var els = this.toDiagonalMatrix().diagonal().elements;
        var det = els[0];
        for (var i = 1; i < els.length; i++) { det = det * els[i]; }
        return det;
      }
    };
    
    this.det = function() { return this.determinant(); };
    
    // Returns true iff the matrix is singular
    this.isSingular = function() {
      return (this.isSquare() && this.determinant() === 0);
    };
    
    // Returns the trace for square matrices
    this.trace = function() {
      if (!this.isSquare()) {
        return null;
      } else {
        var els = this.toDiagonalMatrix().diagonal().elements;
        var tr = els[0];
        for (var i = 1; i < els.length; i++) { tr = tr + els[i]; }
        return tr;
      }
    };
    
    this.tr = function() { return this.trace(); };
    
    // Returns the result of attaching the given argument to the right-hand side of the matrix
    this.augment = function(matrix) {
      matrix = Matrix.create(matrix); // Allows us to supply vectors
      var self = this.dup();
      var i, j;
      if (self.dimensions().rows == matrix.dimensions().rows) {
        for (i = 0; i < self.dimensions().rows; i++) {
          for (j = 0; j < matrix.dimensions().cols; j++) {
            self.elements[i][self.dimensions().rows + j] = matrix.e(i+1,j+1);
          }
        }
        return self;
      } else {
        return null;
      }
    };
    
    // Returns the inverse (if one exists) using Gauss-Jordan
    this.inverse = function() {
      var i, j;
      if (this.isSquare() && !this.isSingular()) {
        var n = this.dimensions().rows;
        var M = this.augment(Matrix.I(n));
        M.diagonalize(); // Matrix is non-singular so there will be no zeros on the diagonal
        for (i = 1; i <= n; i++) {
          M.elements[i - 1] = M.row(i).x(1 / M.e(i,i)).elements;
        }
        for (i = n; i > 1; i--) {
          for (j = 1; j < i; j++) {
            M.elements[j - 1] = M.row(j).subtract(M.row(i).x(M.e(j,i))).elements;
          }
        }
        return M.minor(1, n+1, n, n);
      } else {
        return null;
      }
    };
    
    this.inv = function() { return this.inverse(); };
    
    // Returns the result of rounding all the elements
    this.round = function() {
      var new_els = [], i, j;
      for (i = 1; i < this.dimensions().rows; i++) {
        new_els[i - 1] = [];
        for (j = 1; j < this.dimensions().cols; j++) {
          new_els[i - 1].push(Math.round(this.e(i,j)));
        }
      }
      return Matrix.create(new_els);
    };
    
    // Returns a string representation of the matrix
    this.inspect = function() {
      var matrix = this.dup();
      for (var i = 0; i < matrix.dimensions().rows; i++) {
        matrix.elements[i] = Vector.create(matrix.elements[i]).inspect();
      }
      return matrix.elements.join('\n');
    };
  },

  // Constructor function
  create: function(elements) {
    return new Matrix.Abstract(elements);
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
Matrix.Diagonal = function() {
  var V = (arguments[0][0] == undefined) ? Vector.create(arguments) : Vector.create(arguments[0]);
  var n = V.dimensions();
  if (n > 0) {
    var M = Matrix.I(n);
    for (var i = 0; i < n; i++) {
      M.elements[i][i] = V.elements[i];
    }
    return M;
  } else {
    return null;
  }
};

// Rotation matrix about some axis. If no axis is
// supplied, assume we're after a 2D transform
Matrix.Rotation = function(t, a) {
  var axis = a.dup();
  if (!axis) {
    return Matrix.create([
      [Math.cos(t),  -Math.sin(t)],
      [Math.sin(t),   Math.cos(t)]
    ]);
  } else {
    if (axis.dimensions() == 3) {
      axis.normalize();
      var rot = Matrix.RotationZ(t);
      if (axis.isParallelTo(Vector.k)) {
        // Axis is parallel to z-axis - just return that rotation
        return rot;
      } else {
        var projectionOnXY = Vector.create(axis.e(1), axis.e(2), 0);
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
      }
    } else {
      return null;
    }
  }
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
  var els = [], i, j;
  for (i = 0; i <= n; i++) {
    els[i] = [];
    for (j = 0; j <= m; j++) {
      els[i][j] = Math.random();
    }
  }
  return Matrix.create(els);
};

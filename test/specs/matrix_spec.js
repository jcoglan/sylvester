JS.ENV.MatrixSpec = JS.Test.describe("Matrix", function() { with(this) {
  before(function() { with(this) {
    this.Matrix = Sylvester.Matrix
    this.$M = Matrix.create
  }})
  
  test("create", function() { with(this) {
    var M = $M([
      [0,3,4,8],
      [3,9,7,3]
    ])
    assertEqual( '[0, 3, 4, 8]\n[3, 9, 7, 3]', M.inspect() )
    assertEqual( '[0, 2, 7, 5]', $M([[0,2,7,5]]).inspect() )
    assertEqual( '[0]\n[2]\n[7]\n[5]', $M([[0],[2],[7],[5]]).inspect() )
    assertEqual( '[128]', $M([[128]]).inspect() )
    assertEqual( '[]', $M([]).inspect() )
  }})
  
  test("I", function() { with(this) {
    assert( Matrix.I(3).eql($M([[1,0,0],[0,1,0],[0,0,1]])) )
    assert( Matrix.I(1).eql($M([[1]])) )
    assert( Matrix.I(0).eql($M([])) )
  }})
  
  test("e", function() { with(this) {
    var M = $M([
      [0,3,4,8],
      [3,9,7,3]
    ])
    assertEqual( 0, M.e(1,1) )
    assertEqual( 8, M.e(1,4) )
    assertNull( M.e(2,6) )
  }})
  
  test("rows and columns", function() { with(this) {
    var M = $M([
      [0,3,4,8],
      [3,9,7,3]
    ])
    assert( M.row(2).eql([3,9,7,3]) )
    assertNull( M.row(3) )
    assert( M.col(2).eql([3,9]) )
    assertNull( M.col(6) )
    assertNull( $M([]).row(1) )
    assertNull( $M([]).col(1) )
  }})
  
  test("dimensions", function() { with(this) {
    var M = $M([
      [0,3,4,8],
      [3,9,7,3]
    ])
    assertEqual( 2, M.rows() )
    assertEqual( 4, M.cols() )
    assertEqual( [0,0], [$M([]).rows(), $M([]).cols()] )
    assertEqual( {rows: 0, cols: 0}, $M([]).dimensions() )
  }})
  
  test("dup", function() { with(this) {
    var M1 = $M([
      [2,3,8],
      [7,0,2],
      [6,3,0]
    ])
    var M2 = M1.dup()
    assert( M1.eql(M2) )
    M2.elements[1][1] = 99
    assert( ! M1.eql(M2) )
    assertEqual( 0, M1.elements[1][1] )
  }})
  
  test("eql", function() { with(this) {
    var M = $M([
      [2,3,8],
      [7,0,2],
      [6,3,0]
    ])
    assert( M.eql([[2,3,8],  [7,0,2],  [6,3,0]]) )
    assert( ! M.eql([[7,3,8],  [7,0,2],  [6,3,0]]) )
    assert( ! M.eql([[2,7,8],  [7,0,2],  [6,3,0]]) )
    assert( ! M.eql([[2,3,7],  [7,0,2],  [6,3,0]]) )
    assert( ! M.eql([[2,3,8],  [8,0,2],  [6,3,0]]) )
    assert( ! M.eql([[2,3,8],  [7,7,2],  [6,3,0]]) )
    assert( ! M.eql([[2,3,8],  [7,0,7],  [6,3,0]]) )
    assert( ! M.eql([[2,3,8],  [7,0,2],  [7,3,0]]) )
    assert( ! M.eql([[2,3,8],  [7,0,2],  [6,7,0]]) )
    assert( ! M.eql([[2,3,8],  [7,0,2],  [6,3,7]]) )
  }})
  
  test("map", function() { with(this) {
    assert(
      $M([
        [2,3,8],
        [7,0,2],
        [6,3,0]
      ]).map(function(x, i, j) { return x + j }).eql([
        [3,5,11],
        [8,2,5],
        [7,5,3]
      ])
    )
  }})
  
  test("Random", function() { with(this) {
    var M
    for (var i = 1; i < 5; i++) {
      M = Matrix.Random(4,i)
      assertEqual( 4, M.rows() )
      assertEqual( i, M.cols() )
      M = Matrix.Random(i,3)
      assertEqual( i, M.rows() )
      assertEqual( 3, M.cols() )
    }
  }})
  
  test("Zero", function() { with(this) {
    var M
    for (var i = 1; i < 5; i++) {
      M = Matrix.Random(5,i)
      assertEqual( 5, M.rows() )
      assertEqual( i, M.cols() )
      M = Matrix.Random(i,2)
      assertEqual( i, M.rows() )
      assertEqual( 2, M.cols() )
    }
    assert( Matrix.Random(0,0).eql($M([])) )
  }})
  
  test("isSameSizeAs", function() { with(this) {
    assert( Matrix.Random(2,5).isSameSizeAs(Matrix.Zero(2,5)) )
    assert( ! Matrix.Random(2,6).isSameSizeAs(Matrix.Zero(2,5)) )
    assert( ! Matrix.Random(1,5).isSameSizeAs(Matrix.Zero(2,5)) )
  }})
  
  test("arithmetic", function() { with(this) {
    var M1 = $M([
      [2,5,9,3],
      [9,2,8,5]
    ])
    var M2 = $M([
      [7,1,0,8],
      [0,4,3,8]
    ])
    var M = $M([
      [9,6,   9,11],
      [9,6.0,11,13]
    ])
    assert( M1.add(M2).eql(M) )
    assert( M2.add(M1).eql(M) )
    assertNull( M1.add(Matrix.Zero(2,5)) )
    M = $M([
      [-5,4,9.0,-5],
      [9,-2,5,-3]
    ])
    assert( M1.subtract(M2).eql(M) )
    assert( M2.subtract(M1).eql(M.x(-1)) )
    assertNull( M1.subtract(Matrix.Zero(2,7)) )
    assert(M2.x(3).eql([
      [21,3,0,24],
      [0,12,9,24]  
    ]))
  }})
  
  test("multiplication", function() { with(this) {
    var M1 = $M([
      [2,5,9,3],
      [9,2,8,5]
    ])
    var M2 = $M([
      [2,9],
      [0,2],
      [8,1],
      [0,6]
    ])
    assertEqual( 2, M1.x(M2).rows() )
    assertEqual( 2, M1.x(M2).cols() )
    assert(M1.x(M2).eql([
      [76, 55],
      [82, 123]
    ]))
    assertEqual( 4, M2.x(M1).rows() )
    assertEqual( 4, M2.x(M1).cols() )
    assertNull( M1.x(M1.x(M2)) )
    assertNotNull( M1.x(M2.x(M1)) )
  }})
  
  test("minor", function() { with(this) {
    var M2 = $M([
      [2,9],
      [0,2],
      [8,1],
      [0,6]
    ])
    var M = $M([
      [9,2,9],
      [2,0,2],
      [1,8,1]
    ])
    assert( M2.minor(1,2,3,3).eql(M) )
  }})
  
  test("isSquare", function() { with(this) {
    assert( Matrix.Zero(9,9).isSquare() )
    assert( ! Matrix.Zero(4,9).isSquare() )
    assert( ! Matrix.Zero(9,3).isSquare() )
    assert( $M([]).isSquare() )
  }})
  
  test("max and index", function() { with(this) {
    var M = $M([
      [2,5,9,3],
      [9,2,8,5]
    ])
    assertEqual( 9, M.max() )
    assert( M.indexOf(8).i == 2 && M.indexOf(8).j == 3 )
    assert( M.indexOf(9).i == 1 && M.indexOf(9).j == 3 )
  }})
  
  test("diagonal", function() { with(this) {
    var M = $M([
      [9,2,9],
      [2,0,2],
      [1,8,1]
    ])
    assert( M.diagonal().eql([9,0,1]) )
  }})
  
  test("toRightTriangular", function() { with(this) {
    for (var i = 0, M; i < 8; i++) {
      M = Matrix.Random(3,3);
      assertMatch( /^\[[0-9\-\.]+, [0-9\-\.]+, [0-9\-\.]+\]\n\[0, [0-9\-\.]+, [0-9\-\.]+\]\n\[0, 0, [0-9\-\.]+\]$/,
                   M.toRightTriangular().inspect() )
    }
  }})
  
  test("transpose", function() { with(this) {
    var M1 = $M([
      [3,9,8,4],
      [2,0,1,5]  
    ])
    var M2 = $M([
      [3,2],
      [9,0],
      [8,1],
      [4,5]
    ])
    assert( M1.transpose().eql(M2) )
    assert( M2.transpose().eql(M1) )
  }})
  
  test("determinant", function() { with(this) {
    for (var i = 0, M; i < 5; i++) {
      M = Matrix.Random(3,3).x(10).elements
      assert(
        M[0][0] * (M[1][1]*M[2][2] - M[1][2]*M[2][1]) +
        M[0][1] * (M[1][2]*M[2][0] - M[1][0]*M[2][2]) +
        M[0][2] * (M[1][0]*M[2][1] - M[1][1]*M[2][0]) -
        $M(M).determinant()
        < Sylvester.precision
      )
    }
    assertNull( Matrix.Random(3,4).determinant() )
    assertEqual( 1, $M([]).det() )
  }})
  
  test("isSingular", function() { with(this) {
    var M = Matrix.Random(3,3).x(10)
    M.elements[0][0] = M.elements[1][0] = M.elements[2][0] = 0
    assert( M.isSingular() )
    assert( ! Matrix.Zero(4,3).isSingular() )
  }})
  
  test("trace", function() { with(this) {
    var M = $M([
      [8,1,6],
      [0,1,7],
      [0,1,5]  
    ])
    assertEqual( 14, M.tr() )
    assertNull( Matrix.Random(4,5).tr() )
  }})
  
  test("rank", function() { with(this) {
    var M = $M([
      [1,9,4,6],
      [9,2,7,4],
      [18,4,14,8]
    ])
    assertEqual( 2, M.rk() )
  }})
  
  test("augment", function() { with(this) {
    assert($M([
      [7,2,9,4],
      [4,8,2,6],
      [9,2,5,6]
    ]).augment([
      [4,6],
      [5,2],
      [8,2]
    ]).eql([
      [7,2,9,4,4,6],
      [4,8,2,6,5,2],
      [9,2,5,6,8,2]
    ]))
  }})
  
  test("inverse", function() { with(this) {
    for (var i = 0, M; i < 10; i++) {
      M = Matrix.Random(4,4).x(5)
      if (M.isSingular()) { continue; }
      assert( M.x(M.inv()).eql(Matrix.I(4)) )
      assert( M.inv().x(M).eql(Matrix.I(4)) )
    }
    assert( $M([[4]]).inv().eql($M([[0.25]])) )
  }})
  
  test("Rotation", function() { with(this) {
    assert(Matrix.Rotation(Math.PI/2).eql([
      [0,-1], [1,0]
    ]))
    assert(Matrix.Rotation(Math.PI/2, Sylvester.Vector.j).eql([
      [0,0,1],
      [0,1,0],
      [-1,0,0]
    ]))
  }})
  
  test("Diagonal", function() { with(this) {
    assert(Matrix.Diagonal([3,9,5,7]).eql([
      [3,0,0,0],
      [0,9,0,0],
      [0,0,5,0],
      [0,0,0,7]
    ]))
  }})
}})

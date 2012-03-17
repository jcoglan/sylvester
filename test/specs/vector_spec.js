JS.ENV.VectorSpec = JS.Test.describe("Vector", function() { with(this) {
  before(function() { with(this) {
    this.Vector = Sylvester.Vector
    this.$V = Vector.create
  }})
  
  test("create", function() { with(this) {
    assertEqual( '[0, 1, 7, 5]', $V([0, 1, 7, 5]).inspect() )
    assertEqual( '[0, 1.4, 7.034, 5.28638]', $V([0, 1.4, 7.034, 5.28638]).inspect() )
  }})
  
  test("e", function() { with(this) {
    var V = $V([0,3,4,5])
    assertEqual( 0, V.e(1) )
    assertEqual( 5, V.e(4) )
    assertEqual( null, V.e(5) )
  }})
  
  test("Zero", function() { with(this) {
    assertEqual( '[0, 0, 0, 0]', Vector.Zero(4).inspect() )
    for (var i = 1; i < 8; i++) {
      assertEqual( 0, Vector.Zero(i).modulus() )
      assertEqual( i, Vector.Zero(i).dimensions() )
    }  
  }})
  
  test("Random", function() { with(this) {
    for (var i = 1; i < 8; i++) {
      assertEqual( i, Vector.Random(i).dimensions() )
    }
  }})
  
  test("modulus", function() { with(this) {
    assertEqual( Math.sqrt(50), $V([0,3,4,5]).modulus() )
    assertEqual( 1, Vector.i.modulus() )
  }})
  
  test("dimensions", function() { with(this) {
    assertEqual( 4, $V([0,3,4,5]).dimensions() )
  }})
  
  test("eql", function() { with(this) {
    var V = Vector.Random(6)
    assert( V.eql(V) )
    assert( Vector.Zero(3).eql([0,0,0]) )
    assert( $V([3,6,9]).eql([3.0,6.0,9.0]) )
    assert( ! $V([3.01,6,9]).eql([3.0,6.0,9.0]) )
    assert( ! $V([3,6,9]).eql([3,6,10]) )
    assert( ! $V([3,6,9]).eql([3,7,9]) )
    assert( ! $V([3,6,9]).eql([4,6,9]) )
  }})
  
  test("single element", function() { with(this) {
    var V = $V([4])
    assertEqual( '[4]', V.inspect() )
    assertEqual( 4, V.modulus() )
  }})
  
  test("dup", function() { with(this) {
    var V = $V([3,4,5])
    var dup = V.dup()
    assert( V.eql(dup) )
    dup.elements[0] = 24
    assert( V.eql([3,4,5]) )
    assert( dup.eql([24,4,5]) )
  }})
  
  test("map", function() { with(this) {
    var V = $V([1,6,3,9])
    assert( V.map(function(x) { return x*x }).eql([1,36,9,81]) )
  }})
  
  test("normalize", function() { with(this) {
    var V = $V([8,2,9,4])
    assertEqual( 1, V.toUnitVector().modulus() )
    assert( V.toUnitVector().x(Math.sqrt(165)).eql(V) )
    assert( V.toUnitVector().isParallelTo(V) )
  }})
  
  test("angleFrom", function() { with(this) {
    var k = Sylvester.precision
    assertEqual( Math.PI/2, Vector.i.angleFrom(Vector.j) )
    assertEqual(
      Math.round((Math.PI/4)*k)/k,
      Math.round(($V([1,0]).angleFrom($V([1,1])))*k)/k
    )
    assertNull( Vector.i.angleFrom([1,6,3,5]) )
  }})
  
  test("angle types", function() { with(this) {
    assert( Vector.i.isParallelTo(Vector.i.x(235457)) )
    assertNull( Vector.i.isParallelTo([8,9]) )
    assert( Vector.i.isAntiparallelTo(Vector.i.x(-235457)) )
    assertNull( Vector.i.isAntiparallelTo([8,9]) )
    assert( Vector.i.isPerpendicularTo(Vector.k) )
    assertNull( Vector.i.isPerpendicularTo([8,9,0,3]) )
  }})
  
  test("arithmetic", function() { with(this) {
    var V1 = $V([2,9,4])
    var V2 = $V([5,13,7])
    assert( V1.add(V2).eql([7,22,11]) )
    assert( V1.subtract(V2).eql([-3,-4,-3]) )
    assertNull( V1.add([2,8]) )
    assertNull( V1.subtract([9,3,6,1,7]) )
    assert( V1.x(4).eql([8,36,16]) )
  }})
  
  test("products", function() { with(this) {
    var V1 = $V([2,9,4])
    var V2 = $V([5,13,7])
    assertEqual( 2* 5 + 9*13 + 4*7, V1.dot(V2) )
    assert( V1.cross(V2).eql([9*7-4*13, 4*5-2*7, 2*13-9*5]) )
    assertNull( V1.dot([7,9]) )
    assertNull( V2.cross([9,1,4,3]) )
  }})
  
  test("max", function() { with(this) {
    var V = $V([2,8,5,9,3,7,12])
    assertEqual( 12, V.max() )
    V = $V([-17,8,5,9,3,7,12])
    assertEqual( -17, V.max() )
  }})
  
  test("indexOf", function() { with(this) {
    var V = $V([2,6,0,3])
    assertEqual( 1, V.indexOf(2) )
    assertEqual( 4, V.indexOf(3) )
    assertEqual( 2, V.indexOf(V.max()) )
    assertNull( V.indexOf(7) )
  }})
  
  test("toDiagonalMatrix", function() { with(this) {
    assert(
      $V([2,6,4,3]).toDiagonalMatrix().eql([
        [2,0,0,0],
        [0,6,0,0],
        [0,0,4,0],
        [0,0,0,3]
      ])
    )
  }})
  
  test("round", function() { with(this) {
    assert( $V([2.56, 3.5, 3.49]).round().eql([3,4,3]) )
  }})
  
  test("distanceFrom", function() { with(this) {
    assertEqual( $V([1,9,0,13]).modulus(), $V([3,9,4,6]).distanceFrom([2,0,4,-7]) )
    assertEqual( Math.sqrt(64 + 49), $V([2,8,7]).distanceFrom(Sylvester.Line.X) )
    assertEqual( 78, $V([28,-43,78]).distanceFrom(Sylvester.Plane.XY) )
    assertEqual( 5, $V([7,4,0]).distanceFrom(Sylvester.Line.Segment.create([0,0,0], [4,0,0])) )
  }})
  
  test("liesIn", function() { with(this) {
    assert( $V([12,0,0]).liesOn(Sylvester.Line.X) )
    assert( ! $V([12,1,0]).liesOn(Sylvester.Line.X) )
    assert( ! $V([12,0,3]).liesOn(Sylvester.Line.X) )
    assert( $V([9,16,4]).liesOn(Sylvester.Line.Segment.create([2,9,4], [14,21,4])) )
    assert( ! $V([9,17,4]).liesOn(Sylvester.Line.Segment.create([2,9,4], [14,21,4])) )
    assert( $V([0,-3,6]).liesIn(Sylvester.Plane.YZ) )
    assert( ! $V([4,-3,6]).liesIn(Sylvester.Plane.YZ) )
  }})
  
  test("reflectionIn", function() { with(this) {
    assert( $V([3,0,0]).reflectionIn([0,3,0]).eql([-3,6,0]) )
    assert( $V([3,0,0]).reflectionIn(Sylvester.Line.create([0,0,0], [1,0,1])).eql([0,0,3]) )
    var V1 = $V([25,-48,77])
    var V2 = $V([25,-48,-77])
    assert( V1.reflectionIn(Sylvester.Plane.XY).eql(V2) )
    assert( V2.reflectionIn(Sylvester.Plane.YX).eql(V1) )
  }})
  
  test("rotate", function() { with(this) {
    assert( $V([12,1]).rotate(Math.PI/2, [5,1]).eql([5,8]) )
    assert( Vector.i.rotate(-Math.PI/2, Sylvester.Line.create([10, 0, 100], Vector.k)).eql([10,9,0]) )
  }})
}})

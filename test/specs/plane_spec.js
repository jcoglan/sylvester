JS.ENV.PlaneSpec = JS.Test.describe("Plane", function() { with(this) {
  before(function() { with(this) {
    this.Plane = Sylvester.Plane
    this.$P = Plane.create
  }})
  
  test("eql", function() { with(this) {
    assert( Plane.XY.dup().eql($P([34,-99,0], [0,0,-4])) )
    assert( ! Plane.XY.dup().eql($P([34,-99,1], [0,0,-4])) )
    assert( ! Plane.XY.dup().eql($P([34,-99,0], [1,0,-4])) )
    assert( ! Plane.XY.dup().eql($P([34,-99,0], [0,-1,-4])) )  
  }})
  
  test("dup", function() { with(this) {
    var P = Plane.XY.dup()
    P.anchor.setElements([3,4,5])
    P.normal.setElements([0,2,6])
    assert( Plane.XY.anchor.eql([0,0,0]) )
    assert( Plane.XY.normal.eql(Sylvester.Vector.k) )
  }})
  
  test("translate", function() { with(this) {
    assert( Plane.XY.translate([5,12,-14]).eql($P([89,-34,-14], Sylvester.Vector.k)) )
    assert( Plane.XY.anchor.eql(Sylvester.Vector.Zero(3)) )
  }})
  
  test("isParallelTo", function() { with(this) {
    assert( Plane.XY.dup().translate([5,12,-14]).isParallelTo(Plane.XY) )
    assert( Plane.XY.isParallelTo(Sylvester.Line.create([4,8,10], [2,-6,0])) )
  }})
  
  test("distanceFrom", function() { with(this) {
    assertEqual( 14, Plane.XY.dup().translate([5,12,-14]).distanceFrom(Plane.XY) )
    assertEqual( 0, Plane.XY.dup().translate([5,12,-14]).distanceFrom($P([0,0,0], [1,0,1])) )
    assertEqual( 10, Plane.XY.distanceFrom(Sylvester.Line.create([4,8,10], [2,-6,0])) )
    assertEqual( 0, Plane.XY.distanceFrom(Sylvester.Line.create([4,8,10], [2,-6,2])) )
  }})
  
  test("contains", function() { with(this) {
    assert( Plane.XY.contains(Sylvester.Line.X) )
    assert( Plane.XY.contains(Sylvester.Vector.i) )
  }})
  
  test("pointClosestTo", function() { with(this) {
    assert( Plane.YZ.pointClosestTo([3,6,-3]).eql([0,6,-3]) )
  }})
  
  test("rotate", function() { with(this) {
    assert( Plane.XY.rotate(Math.PI/2, Sylvester.Line.Y).eql(Plane.YZ) )
  }})
  
  test("reflectionIn", function() { with(this) {
    assert( Plane.XY.reflectionIn(Sylvester.Vector.create([12,65,-4])).eql($P([0,0,-8], Sylvester.Vector.k)) )
    assert( Plane.XY.reflectionIn(Sylvester.Line.Z).eql(Plane.XY) )
    assert( Plane.XY.reflectionIn(Sylvester.Line.create([0,0,0], [1,0,1])).eql(Plane.YZ) )
    assert( $P([5,0,0], [1,1,0]).reflectionIn($P([5,0,0], [0,1,0])).eql($P([5,0,0], [-1,1,0])) )
    assert( $P([0,5,0], [0,1,1]).reflectionIn($P([0,5,0], [0,0,1])).eql($P([0,5,0], [0,-1,1])) )
    assert( $P([0,0,5], [1,0,1]).reflectionIn($P([0,0,5], [1,0,0])).eql($P([0,0,5], [1,0,-1])) )
  }})
  
  test("containment", function() { with(this) {
    var i, P1, P2, L1, L2, Vector = Sylvester.Vector
    for (i = 0; i < 10; i++) {
      P1 = $P(Vector.create([-50,-50,-50]).add(Vector.Random(3).x(100)), Vector.create([-50,-50,-50]).add(Vector.Random(3).x(100)))
      P2 = $P(Vector.create([-50,-50,-50]).add(Vector.Random(3).x(100)), Vector.create([-50,-50,-50]).add(Vector.Random(3).x(100)))
      if (P1.intersects(P2)) {
        L1 = P1.intersectionWith(P2)
        L2 = P2.intersectionWith(P1)
        assert( L1.eql(L2) )
        assert( L1.liesIn(P1) )
        assert( P2.contains(L1) )
      }
    }
  }})
}})

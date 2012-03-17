JS.ENV.LineSpec = JS.Test.describe("Line", function() { with(this) {
  before(function() { with(this) {
    this.Line = Sylvester.Line
    this.$L = Line.create
  }})
  
  test("dup", function() { with(this) {
    var L = Line.X.dup()
    assert( L.eql(Line.X) )
    L.anchor.setElements([8,2,5])
    L.direction.setElements([2,5,6])
    assert( Line.X.anchor.eql([0,0,0]) )
    assert( Line.X.direction.eql(Sylvester.Vector.i) )
    assert( ! L.eql(Line.X) )
  }})
  
  test("equality with antiparallel lines", function() { with(this) {
    assert( Line.X.eql($L([0,0,0], [-12,0,0])) )
  }})
  
  test("contains", function() { with(this) {
    assert( Line.X.contains([99,0,0]) )
    assert( ! Line.X.contains([99,1,0]) )
    assert( ! Line.X.contains([99,0,2]) )
    assert( $L([0,0,0], [1,1,1]).contains(Line.Segment.create([-2,-2,-2], [13,13,13])) )
  }})
  
  test("isParallelTo", function() { with(this) {
    assert( Line.X.isParallelTo($L([0,0,-12], [-4,0,0])) )
    assert( Line.X.isParallelTo(Sylvester.Plane.create([0,0,-4], Sylvester.Vector.k)) )
    assert( ! Line.Z.isParallelTo(Sylvester.Plane.create([0,0,-4], Sylvester.Vector.k)) )
    assert( Line.Z.isParallelTo(Line.Segment.create([9,2,6], [9,2,44])) )
    assert( ! Line.Z.isParallelTo(Line.Segment.create([9,3,6], [9,2,44])) )
  }})
  
  test("translate", function() { with(this) {
    assert( Line.X.dup().translate([0,0,12]).eql($L([0,0,12], Sylvester.Vector.i)) )
  }})
  
  test("intersectionWith", function() { with(this) {
    for (var i = 0, O, V, V1, V2, L1, L2; i < 5; i++) {
      O = Sylvester.Vector.create([-5,-5,-5])
      V = O.add(Sylvester.Vector.Random(3).x(10))
      V1 = O.add(Sylvester.Vector.Random(3).x(10))
      V2 = O.add(Sylvester.Vector.Random(3).x(10))
      L1 = $L(V, V1)
      L2 = $L(V.add(V1.x(-20 + 40*Math.random())), V2)
      V = L1.intersectionWith(L2)
      assert( L1.contains(V) )
      assert( L2.contains(V) )
    }
    assert( $L([5,0], [0,1]).intersectionWith($L([0,0], [-1,-1])).eql([5,5,0]) )
    assert( Line.X.intersects(Line.Segment.create([7,-4,0], [7,5,0])) )
    assert( ! Line.X.intersects(Line.Segment.create([7,-4,-1], [7,5,0])) )
  }})
  
  test("positionOf", function() { with(this) {
    assert( $L([0,0,0], [1,1,-1]).positionOf([3,3,-3]) - Math.sqrt(27) <= Sylvester.precision )
  }})
  
  test("pointClosestTo", function() { with(this) {
    assert( Line.X.pointClosestTo(Sylvester.Vector.create([26,-2,18])).eql([26,0,0]) )
    assert( $L([0,0,0], [1,0,0]).pointClosestTo($L([0,0,24], [1,1,0])).eql([0,0,0]) )
    assert( $L([0,0,24], [1,1,0]).pointClosestTo($L([0,0,0], [-1,0,0])).eql([0,0,24]) )
    assert( Line.X.pointClosestTo(Line.Segment.create([3,5], [9,9])).eql([3,0,0]) )
    assert( Line.X.pointClosestTo(Line.Segment.create([2,-2,2], [4,2,2])).eql([3,0,0]) )
  }})
  
  test("distanceFrom", function() { with(this) {
    assertEqual( 24, $L([0,0,0], [1,0,0] ).distanceFrom($L([0,0,24], [1,1,0])) )
    assertEqual( 12, $L([12,0,0], Sylvester.Vector.k).distanceFrom(Sylvester.Plane.YZ) )
    assertEqual( 0, $L([12,0,0], [1,0,200]).distanceFrom(Sylvester.Plane.YZ) )
    assert( Math.abs(Math.sqrt(18) - Line.X.distanceFrom(Line.Segment.create([12,3,3], [15,4,3]))) <= Sylvester.precision )
  }})
  
  test("reflectionIn", function() { with(this) {
    assert( Line.Z.reflectionIn([28,0,-12]).eql($L([56,0,0], Sylvester.Vector.k.x(-1))) )
    assert( Line.X.reflectionIn($L([0,0,0],[1,0,1])).eql(Line.Z) )
    var L1 = Line.X.dup()
    var L2 = $L([5,0,0], Sylvester.Vector.k)
    assert( L1.reflectionIn(Sylvester.Plane.create([5,0,0], [1,0,1])).eql(L2) )
    assert( L2.reflectionIn(Sylvester.Plane.create([5,0,0], [1,0,1])).eql(L1) )
    assert( $L([-4,3], [0,-1]).reflectionIn(Sylvester.Vector.create([0,0])).eql($L([4,100], [0,4])) )
  }})
  
  test("rotate", function() { with(this) {
    assert( Line.X.rotate(Math.PI, $L([12,0,0],[1,0,1])).eql($L([12,0,0], Sylvester.Vector.k)) )
    assert( $L([10,0,0], [0,1,1]).rotate(-Math.PI/2, Line.Y).eql($L([0,0,10], [1,-1,0])) )
    assert( $L([9,0], Sylvester.Vector.j).rotate(Math.PI/2, Sylvester.Vector.create([9,9])).eql($L([0,9], Sylvester.Vector.i)) )
  }})
}})

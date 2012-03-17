JS.ENV.LineSegmentSpec = JS.Test.describe("Line.Segment", function() { with(this) {
  before(function() { with(this) {
    this.Line = Sylvester.Line
    this.$L = Line.create
  }})
  
  before(function() { with(this) {
    segment  = Line.Segment.create([5,5,5], [10,10,10])
    segment2 = Line.Segment.create([1,1,0], [1,2,0])
  }})
  
  test("eql", function() { with(this) {
    assert( segment.eql(segment) )
    assert( ! segment.eql(segment2) )
    assert( segment.eql(Line.Segment.create(segment.end, segment.start)) )
  }})
  
  test("dup", function() { with(this) {
    var seg = segment.dup()
    assert( segment.eql(seg) )
    seg.start.setElements([23,87,56])
    assert( ! segment.eql(seg) )
    assert( segment.start.eql([5,5,5]) )
  }})
  
  test("length", function() { with(this) {
    assert( segment.length() - Math.sqrt(75) <= Sylvester.precision )
  }})
  
  test("toVector", function() { with(this) {
    assert( segment.toVector().eql([5,5,5]) )
  }})
  
  test("midpoint", function() { with(this) {
    assert( segment.midpoint().eql([7.5,7.5,7.5]) )
  }})
  
  test("bisectingPlane", function() { with(this) {
    assert( segment.bisectingPlane().eql(Sylvester.Plane.create([7.5,7.5,7.5], [1,1,1])) )
  }})
  
  test("translate", function() { with(this) {
    assert( segment.translate([9,2,7]).eql(Line.Segment.create([14,7,12], [19,12,17])) )
  }})
  
  test("isParallelTo", function() { with(this) {
    assert( segment2.isParallelTo(Line.Y) )
    assert( ! segment2.isParallelTo(Line.Z) )
    assert( segment2.isParallelTo(Sylvester.Plane.XY) )
    assert( segment2.isParallelTo(Sylvester.Plane.YZ) )
    assert( ! segment2.isParallelTo(Sylvester.Plane.ZX) )
    assert( ! segment.isParallelTo(segment2) )
    assert( segment2.isParallelTo(segment2) )
  }})
  
  test("contains", function() { with(this) {
    assert( segment.contains(segment.midpoint()) )
    assert( segment.contains([5,5,5]) )
    assert( segment.contains([10,10,10]) )
    assert( ! segment.contains([4.9999,4.9999,4.9999]) )
    assert( ! segment.contains([10.00001, 10.00001, 10.00001]) )
    assert( segment.contains(Line.Segment.create([5,5,5], [8,8,8])) )
    assert( segment.contains(Line.Segment.create([7,7,7], [10,10,10])) )
    assert( ! segment.contains(Line.Segment.create([4,4,4], [8,8,8])) )
  }})
  
  test("distanceFrom", function() { with(this) {
    assertEqual( 5, segment.distanceFrom([5,5,0]) )
    assertEqual( 2, segment.distanceFrom([10,12,10]) )
    assertEqual( Math.sqrt(2* 25), segment.distanceFrom(Line.X) )
    assertEqual( 1, segment.distanceFrom($L([11,10,10], [0,1])) )
    assertEqual( 5, segment.distanceFrom(Sylvester.Plane.XY) )
    assertEqual( Math.sqrt(4 + 25 + 25), segment.distanceFrom(Line.Segment.create([7,0,0], [9,0,0])) )
  }})
  
  test("intersection", function() { with(this) {
    assert( ! segment.intersects(Line.X) )
    assert( ! segment.intersects(Line.Y) )
    assert( ! segment.intersects(Line.Z) )
    assert( ! segment.intersects(Sylvester.Plane.XY) )
    assert( ! segment.intersects(Sylvester.Plane.YZ) )
    assert( ! segment.intersects(Sylvester.Plane.ZX) )
    assert( segment.intersectionWith(segment.bisectingPlane()).eql(segment.midpoint()) )
    assert(
      Line.Segment.create([0,4,4], [0,8,4]).intersectionWith(
        Line.Segment.create([0,6,2], [0,6,6])
      ).eql([0,6,4])
    )
    assertNull(
      Line.Segment.create([0,4,4], [0,8,4]).intersectionWith(
        Line.Segment.create([2,6,2], [0,6,6])
      )
    )
    assert( segment.intersects(Line.Segment.create([6,7,7], [9,7,7])) )
    assert( ! segment.intersects(segment2) )
  }})
  
  test("pointClosestTo", function() { with(this) {
    assertNull( segment2.pointClosestTo(Line.Y) )
    assert( segment2.pointClosestTo(Line.X).eql([1,1,0]) )
    assert( segment2.pointClosestTo(Line.X.translate([0,10])).eql([1,2,0]) )
    assert( segment2.pointClosestTo($L([0,1.5,0], [0,0,1])).eql([1,1.5,0]) )
    assert( segment2.pointClosestTo(Sylvester.Plane.XZ).eql([1,1,0]) )
    assertNull( segment2.pointClosestTo(Sylvester.Plane.YZ) )
  }})
}})

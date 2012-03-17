JS.ENV.VectorSpec = JS.Test.describe("Vector", function() { with(this) {
  before(function() { with(this) {
    this.Vector = Sylvester.Vector
    this.$V = Vector.create
  }})
  
  it("create", function() { with(this) {
    assertEqual( '[0, 1, 7, 5]', $V([0, 1, 7, 5]).inspect() )
    assertEqual( '[0, 1.4, 7.034, 5.28638]', $V([0, 1.4, 7.034, 5.28638]).inspect() )
  }})
}})

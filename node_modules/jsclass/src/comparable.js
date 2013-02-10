JS.Comparable = new JS.Module('Comparable', {
  extend: {
    ClassMethods: new JS.Module({
      compare: function(one, another) {
        return one.compareTo(another);
      }
    }),
    
    included: function(base) {
      base.extend(this.ClassMethods);
    }
  },
  
  lt: function(other) {
    return this.compareTo(other) < 0;
  },
  
  lte: function(other) {
    return this.compareTo(other) < 1;
  },
  
  gt: function(other) {
    return this.compareTo(other) > 0;
  },
  
  gte: function(other) {
    return this.compareTo(other) > -1;
  },
  
  eq: function(other) {
    return this.compareTo(other) === 0;
  },
  
  between: function(a, b) {
    return this.gte(a) && this.lte(b);
  }
});

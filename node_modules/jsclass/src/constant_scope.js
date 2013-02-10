JS.ConstantScope = new JS.Module('ConstantScope', {
  extend: {
    included: function(base) {
      base.__consts__ = new JS.Module();
      base.extend(this.ClassMethods);
      base.__eigen__().extend(this.ClassMethods);
      
      base.include(base.__consts__);
      base.extend(base.__consts__);
      
      base.include(this.extract(base.__fns__));
      base.extend(this.extract(base.__eigen__().__fns__));
    },
    
    ClassMethods: new JS.Module({
      define: function(name, callable) {
        var constants = this.__consts__ || this.__tgt__.__consts__;
        
        if (/^[A-Z]/.test(name))
          constants.define(name, callable);
        else
          this.callSuper();
        
        if (JS.isType(callable, JS.Module)) {
          callable.include(JS.ConstantScope);
          callable.__consts__.include(constants);
        }
      }
    }),
    
    extract: function(methods, base) {
      var constants = {}, key, object;
      for (key in methods) {
        if (!/^[A-Z]/.test(key)) continue;
        
        object = methods[key];
        constants[key] = object;
        delete methods[key];
      }
      return constants;
    }
  }
});


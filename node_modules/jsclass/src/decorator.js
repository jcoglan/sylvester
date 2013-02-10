JS.Decorator = new JS.Class('Decorator', {
  initialize: function(decoree, methods) {
    var decorator  = new JS.Class(),
        delegators = {},
        method, func;
    
    for (method in decoree.prototype) {
      func = decoree.prototype[method];
      if (typeof func === 'function' && func !== decoree) func = this.klass.delegate(method);
      delegators[method] = func;
    }
    
    decorator.include(new JS.Module(delegators), {_resolve: false});
    decorator.include(this.klass.InstanceMethods, {_resolve: false});
    decorator.include(methods);
    return decorator;
  },
  
  extend: {
    delegate: function(name) {
      return function() {
        return this.component[name].apply(this.component, arguments);
      };
    },
    
    InstanceMethods: new JS.Module({
      initialize: function(component) {
        this.component = component;
        this.klass = this.constructor = component.klass;
        var method, func;
        for (method in component) {
          if (this[method]) continue;
          func = component[method];
          if (typeof func === 'function') func = JS.Decorator.delegate(method);
          this[method] = func;
        }
      },
      
      extend: function(source) {
        this.component.extend(source);
        var method, func;
        for (method in source) {
          func = source[method];
          if (typeof func === 'function') func = JS.Decorator.delegate(method);
          this[method] = func;
        }
      }
    })
  }
});

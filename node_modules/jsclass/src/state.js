JS.State = new JS.Module('State', {
  __getState__: function(state) {
    if (typeof state === 'object') return state;
    if (typeof state === 'string') return (this.states || {})[state];
    return {};
  },
  
  setState: function(state) {
    this.__state__ = this.__getState__(state);
    JS.State.addMethods(this.__state__, this.klass);
  },
  
  inState: function() {
    var i = arguments.length;
    while (i--) {
      if (this.__state__ === this.__getState__(arguments[i])) return true;
    }
    return false;
  },
  
  extend: {
    ClassMethods: new JS.Module({
      states: function(block) {
        this.define('states', JS.State.buildCollection(this, block));
      }
    }),
    
    included: function(klass) {
      klass.extend(this.ClassMethods);
    },
    
    stub: function() { return this; },
    
    buildStubs: function(stubs, collection, states) {
      var state, method;
      for (state in states) {
        collection[state] = {};
        for (method in states[state]) stubs[method] = this.stub;
      }
    },
    
    findStates: function(collections, name) {
      var i = collections.length, results = [];
      while (i--) {
        if (collections[i].hasOwnProperty(name))
          results.push(collections[i][name]);
      }
      return results;
    },
    
    buildCollection: function(module, states) {
      var stubs       = {},
          collection  = {},
          superstates = module.lookup('states'),
          state, klass, methods, name, mixins, i, n;
      
      this.buildStubs(stubs, collection, states);
      
      for (i = 0, n = superstates.length; i < n;  i++)
        this.buildStubs(stubs, collection, superstates[i]);
      
      for (state in collection) {
        klass  = new JS.Class(states[state]);
        mixins = this.findStates(superstates, state);
        
        i = mixins.length;
        while (i--) {
          if (mixins[i]) klass.include(mixins[i].klass);
        }
        
        methods = {};
        for (name in stubs) {
          if (!klass.prototype[name]) methods[name] = stubs[name];
        }
        klass.include(methods);
        collection[state] = new klass;
      }
      if (module.__tgt__) this.addMethods(stubs, module.__tgt__.klass);
      return collection;
    },
    
    addMethods: function(state, klass) {
      if (!klass) return;
      
      var methods = {},
          proto   = klass.prototype,
          method;
      
      for (method in state) {
        if (proto[method]) continue;
        klass.define(method, this.wrapped(method));
      }
    },
    
    wrapped: function(method) {
      return function() {
        var func = (this.__state__ || {})[method];
        return func ? func.apply(this, arguments) : this;
      };
    }
  }
});


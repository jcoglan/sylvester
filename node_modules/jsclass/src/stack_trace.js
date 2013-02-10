JS.StackTrace = new JS.Module('StackTrace', {
  extend: {
    logger: new JS.Singleton({
      include: JS.Console,
      active: false,
      
      update: function(event, data) {
        if (!this.active) return;
        switch (event) {
          case 'call':    return this.logEnter(data);
          case 'return':  return this.logExit(data);
          case 'error':   return this.logError(data);
        }
      },
      
      indent: function() {
        var indent = ' ';
        JS.StackTrace.forEach(function() { indent += '|  ' });
        return indent;
      },
      
      fullName: function(frame) {
        var C        = JS.Console,
            method   = frame.method,
            env      = frame.env,
            name     = method.name,
            module   = method.module;
            
        return C.nameOf(env) +
                (module === env ? '' : '(' + C.nameOf(module) + ')') +
                '#' + name;
      },
      
      logEnter: function(frame) {
        var fullName = this.fullName(frame),
            args = JS.Console.convert(frame.args).replace(/^\[/, '(').replace(/\]$/, ')');
        
        if (this._open) this.puts();
        
        this.reset();
        this.print(' ');
        this.consoleFormat('bgblack', 'white');
        this.print('TRACE');
        this.reset();
        this.print(this.indent());
        this.blue();
        this.print(fullName);
        this.red();
        this.print(args);
        this.reset();
        
        this._open = true;
      },
      
      logExit: function(frame) {
        var fullName = this.fullName(frame);
        
        if (frame.leaf) {
          this.consoleFormat('red');
          this.print(' --> ');
        } else {
          this.reset();
          this.print(' ');
          this.consoleFormat('bgblack', 'white');
          this.print('TRACE');
          this.reset();
          this.print(this.indent());
          this.blue();
          this.print(fullName);
          this.red();
          this.print(' --> ');
        }
        this.consoleFormat('yellow');
        this.puts(JS.Console.convert(frame.result));
        this.reset();
        this.print('');
        this._open = false;
      },
      
      logError: function(e) {
        this.puts();
        this.reset();
        this.print(' ');
        this.consoleFormat('bgred', 'white');
        this.print('ERROR');
        this.consoleFormat('bold', 'red');
        this.print(' ' + JS.Console.convert(e));
        this.reset();
        this.print(' thrown by ');
        this.bold();
        this.print(JS.StackTrace.top().name);
        this.reset();
        this.puts('. Backtrace:');
        this.backtrace();
      },
      
      backtrace: function() {
        JS.StackTrace.reverseForEach(function(frame) {
          var args = JS.Console.convert(frame.args).replace(/^\[/, '(').replace(/\]$/, ')');
          this.print('      | ');
          this.consoleFormat('blue');
          this.print(frame.name);
          this.red();
          this.print(args);
          this.reset();
          this.puts(' in ');
          this.print('      |  ');
          this.bold();
          this.puts(JS.Console.convert(frame.object));
        }, this);
        this.reset();
        this.puts();
      }
    }),
    
    include: [JS.Observable, JS.Enumerable],
    
    wrap: function(func, method, env) {
      var self = JS.StackTrace;
      var wrapper = function() {
        var result;
        self.push(this, method, env, Array.prototype.slice.call(arguments));
        
        try { result = func.apply(this, arguments) }
        catch (e) { self.error(e) }
        
        self.pop(result);
        return result;
      };
      wrapper.toString = function() { return func.toString() };
      wrapper.__traced__ = true;
      return wrapper;
    },
    
    stack: [],
    
    forEach: function(block, context) {
      JS.Enumerable.forEach.call(this.stack, block, context);
    },
    
    top: function() {
      return this.stack[this.stack.length - 1] || {};
    },
    
    push: function(object, method, env, args) {
      var stack = this.stack;
      if (stack.length > 0) stack[stack.length - 1].leaf = false;
      
      var frame = {
        object: object,
        method: method,
        env:    env,
        args:   args,
        leaf:   true
      };
      frame.name = this.logger.fullName(frame);
      this.notifyObservers('call', frame);
      stack.push(frame);
    },
    
    pop: function(result) {
      var frame = this.stack.pop();
      frame.result = result;
      this.notifyObservers('return', frame);
    },
    
    error: function(e) {
      if (e.logged) throw e;
      e.logged = true;
      this.notifyObservers('error', e);
      this.stack = [];
      throw e;
    }
  }
});

JS.StackTrace.addObserver(JS.StackTrace.logger);

JS.Deferrable = new JS.Module('Deferrable', {
  extend: {
    Timeout: new JS.Class(Error)
  },
  
  callback: function(block, context) {
    if (this.__deferredStatus__ === 'success')
      return block.apply(context || null, this.__deferredValue__);
    
    if (this.__deferredStatus__ === 'failure')
      return;
    
    this.__callbacks__ = this.__callbacks__ || [];
    this.__callbacks__.push([block, context || null]);
  },
  
  errback: function(block, context) {
    if (this.__deferredStatus__ === 'failure')
      return block.apply(context || null, this.__deferredValue__);
    
    if (this.__deferredStatus__ === 'success')
      return;
    
    this.__errbacks__ = this.__errbacks__ || [];
    this.__errbacks__.push([block, context || null]);
  },
  
  timeout: function(milliseconds) {
    this.cancelTimeout();
    var self = this, error = new JS.Deferrable.Timeout();
    this.__timeout__ = JS.ENV.setTimeout(function() { self.fail(error) }, milliseconds);
  },
  
  cancelTimeout: function() {
    if (!this.__timeout__) return;
    JS.ENV.clearTimeout(this.__timeout__);
    delete this.__timeout__;
  },
  
  setDeferredStatus: function(status, args) {
    this.__deferredStatus__ = status;
    this.__deferredValue__  = args;
    
    this.cancelTimeout();
    
    switch (status) {
      case 'success':
        if (!this.__callbacks__) return;
        var callback;
        while (callback = this.__callbacks__.pop())
          callback[0].apply(callback[1], args);
        break;
      
      case 'failure':
        if (!this.__errbacks__) return;
        var errback;
        while (errback = this.__errbacks__.pop())
          errback[0].apply(errback[1], args);
        break;
    }
  },
  
  succeed: function() {
    return this.setDeferredStatus('success', arguments);
  },
  
  fail: function() {
    return this.setDeferredStatus('failure', arguments);
  }
});

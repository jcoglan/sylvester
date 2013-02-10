JS.TSort = new JS.Module('TSort', {
  extend: {
    Cyclic: new JS.Class(Error)
  },
  
  tsort: function() {
    var result = [];
    this.tsortEach(result.push, result);
    return result;
  },
  
  tsortEach: function(block, context) {
    this.eachStronglyConnectedComponent(function(component) {
      if (component.length === 1)
        block.call(context || null, component[0]);
      else
        throw new JS.TSort.Cyclic('topological sort failed: ' + component.toString());
    });
  },
  
  stronglyConnectedComponents: function() {
    var result = [];
    this.eachStronglyConnectedComponent(result.push, result);
    return result;
  },
  
  eachStronglyConnectedComponent: function(block, context) {
    var idMap = new JS.Hash(),
        stack = [];
    
    this.tsortEachNode(function(node) {
      if (idMap.hasKey(node)) return;
      this.eachStronglyConnectedComponentFrom(node, idMap, stack, function(child) {
        block.call(context || null, child);
      });
    }, this);
  },
  
  eachStronglyConnectedComponentFrom: function(node, idMap, stack, block, context) {
    var nodeId      = idMap.size,
        stackLength = stack.length,
        minimumId   = nodeId,
        component, i;
    
    idMap.store(node, nodeId);
    stack.push(node);
    
    this.tsortEachChild(node, function(child) {
      if (idMap.hasKey(child)) {
        var childId = idMap.get(child);
        if (child !== undefined && childId < minimumId) minimumId = childId;
      } else {
        var subMinimumId = this.eachStronglyConnectedComponentFrom(child, idMap, stack, block, context);
        if (subMinimumId < minimumId) minimumId = subMinimumId;
      }
    }, this);
    
    if (nodeId === minimumId) {
      component = stack.splice(stackLength, stack.length - stackLength);
      i = component.length;
      while (i--) idMap.store(component[i], undefined);
      block.call(context || null, component);
    }
    
    return minimumId;
  },
  
  tsortEachNode: function() {
    throw new JS.NotImplementedError('tsortEachNode');
  },
  
  tsortEachChild: function() {
    throw new JS.NotImplementedError('tsortEachChild');
  }
});


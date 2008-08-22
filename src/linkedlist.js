// LinkedList class - required for Polygon class.

function LinkedList() {}
LinkedList.prototype = {
  length: 0,
  first: null,
  last: null,

  each: function(fn) {
    var node = this.first, n = this.length;
    for (var i = 0; i < n; i++) {
      fn(node, i);
      node = node.next;
    }
  },

  at: function(i) {
    if (!(i >= 0 && i < this.length)) { return null; }
    var node = this.first;
    while (i--) { node = node.next; }
    return node;
  },

  randomNode: function() {
    var n = Math.floor(Math.random() * this.length);
    return this.at(n);
  },

  toArray: function() {
    var arr = [], node = this.first, n = this.length;
    while (n--) {
      arr.push(node.data || node);
      node = node.next;
    }
    return arr;
  }
};

LinkedList.Node = function(data) {
  this.prev = null; this.next = null;
  this.data = data;
};

LinkedList.Circular = function() {};
LinkedList.Circular.Methods = {
  append: function(node) {
    if (this.first === null) {
      node.prev = node;
      node.next = node;
      this.first = node;
      this.last = node;
    } else {
      node.prev = this.last;
      node.next = this.first;
      this.first.prev = node;
      this.last.next = node;
      this.last = node;
    }
    this.length++;
  },

  prepend: function(node) {
    if (this.first === null) {
      this.append(node);
      return;
    } else {
      node.prev = this.last;
      node.next = this.first;
      this.first.prev = node;
      this.last.next = node;
      this.first = node;
    }
    this.length++;
  },

  insertAfter: function(node, newNode) {
    newNode.prev = node;
    newNode.next = node.next;
    node.next.prev = newNode;
    node.next = newNode;
    if (newNode.prev == this.last) { this.last = newNode; }
    this.length++;
  },

  insertBefore: function(node, newNode) {
    newNode.prev = node.prev;
    newNode.next = node;
    node.prev.next = newNode;
    node.prev = newNode;
    if (newNode.next == this.first) { this.first = newNode; }
    this.length++;
  },

  remove: function(node) {
    if (this.length > 1) {
      node.prev.next = node.next;
      node.next.prev = node.prev;
      if (node == this.first) { this.first = node.next; }
      if (node == this.last) { this.last = node.prev; }
    } else {
      this.first = null;
      this.last = null;
    }
    node.prev = null;
    node.next = null;
    this.length--;
  },

  withData: function(data) {
    var nodeFromStart = this.first, nodeFromEnd = this.last, n = Math.ceil(this.length / 2);
    while (n--) {
      if (nodeFromStart.data == data) { return nodeFromStart; }
      if (nodeFromEnd.data == data) { return nodeFromEnd; }
      nodeFromStart = nodeFromStart.next;
      nodeFromEnd = nodeFromEnd.prev;
    }
    return null;
  }
};

LinkedList.Circular.prototype = new LinkedList;
for (var method in LinkedList.Circular.Methods) {
  LinkedList.Circular.prototype[method] = LinkedList.Circular.Methods[method];
}

LinkedList.Circular.fromArray = function(list, useNodes) {
  var linked = new LinkedList.Circular();
  var n = list.length;
  while (n--) { linked.prepend(useNodes ? new LinkedList.Node(list[n]) : list[n]); }
  return linked;
};

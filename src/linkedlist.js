// LinkedList class - required for Polygon class.

function LinkedList() {}
LinkedList.prototype = {
  length: 0,
  first: null,
  last: null,

  each: function(fn) {
    var node = this.first;
    for (var i = 0; i < this.length; i++) {
      fn(node, i);
      node = node.next;
    }
  },

  at: function(i) {
    if (!(i >= 0 && i < this.length)) { return null; }
    var node = this.first;
    for (var j = 0; j < i; j++) { node = node.next; }
    return node;
  },

  randomNode: function() {
    var n = Math.floor(Math.random() * this.length);
    return this.at(n);
  },

  toArray: function() {
    var arr = [], node = this.first;
    if (node === null) { return arr; }
    for (var i = 0; i < this.length; i++) {
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

  fromArray: function(list) {
    var linked = new LinkedList.Circular();
    for (var i = 0; i < list.length; i++) {
      linked.append(list[i]);
    }
    return linked;
  },

  withData: function(data) {
    var nodeFromStart = this.first, nodeFromEnd = this.last, n = Math.ceil(this.length / 2);
    do {
      if (nodeFromStart.data == data) { return nodeFromStart; }
      if (nodeFromEnd.data == data) { return nodeFromEnd; }
      nodeFromStart = nodeFromStart.next;
      nodeFromEnd = nodeFromEnd.prev;
    } while (--n);
    return null;
  }
};

LinkedList.Circular.prototype = new LinkedList;
for (var method in LinkedList.Circular.Methods) {
  LinkedList.Circular.prototype[method] = LinkedList.Circular.Methods[method];
}

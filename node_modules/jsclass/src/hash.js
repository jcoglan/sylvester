JS.Hash = new JS.Class('Hash', {
  include: JS.Enumerable || {},
  
  extend: {
    Pair: new JS.Class({
      include: JS.Comparable || {},
      length: 2,
      
      setKey: function(key) {
        this[0] = this.key = key;
      },
      
      hasKey: function(key) {
        return JS.Enumerable.areEqual(this.key, key);
      },
      
      setValue: function(value) {
        this[1] = this.value = value;
      },
      
      hasValue: function(value) {
        return JS.Enumerable.areEqual(this.value, value);
      },
      
      compareTo: function(other) {
        return this.key.compareTo
            ? this.key.compareTo(other.key)
            : (this.key < other.key ? -1 : (this.key > other.key ? 1 : 0));
      },
      
      hash: function() {
        var key   = JS.Hash.codeFor(this.key),
            value = JS.Hash.codeFor(this.value);
        
        return [key, value].sort().join('/');
      }
    }),
    
    codeFor: function(object) {
      if (typeof object !== 'object') return String(object);
      return (typeof object.hash === 'function')
          ? object.hash()
          : object.toString();
    }
  },
  
  initialize: function(object) {
    this.clear();
    if (!JS.isType(object, Array)) return this.setDefault(object);
    for (var i = 0, n = object.length; i < n; i += 2)
      this.store(object[i], object[i+1]);
  },
  
  forEach: function(block, context) {
    if (!block) return this.enumFor('forEach');
    block = JS.Enumerable.toFn(block);
    
    var hash, bucket, i;
    
    for (hash in this._buckets) {
      if (!this._buckets.hasOwnProperty(hash)) continue;
      bucket = this._buckets[hash];
      i = bucket.length;
      while (i--) block.call(context || null, bucket[i]);
    }
    return this;
  },
  
  _bucketForKey: function(key, createIfAbsent) {
    var hash   = this.klass.codeFor(key),
        bucket = this._buckets[hash];
    
    if (!bucket && createIfAbsent)
      bucket = this._buckets[hash] = [];
    
    return bucket;
  },
  
  _indexInBucket: function(bucket, key) {
    var i     = bucket.length,
        ident = !!this._compareByIdentity;
        
    while (i--) {
      if (ident ? (bucket[i].key === key) : bucket[i].hasKey(key))
        return i;
    }
    return -1;
  },
  
  assoc: function(key, createIfAbsent) {
    var bucket, index, pair;
    
    bucket = this._bucketForKey(key, createIfAbsent);
    if (!bucket) return null;
    
    index = this._indexInBucket(bucket, key);
    if (index > -1) return bucket[index];
    if (!createIfAbsent) return null;
    
    this.size += 1; this.length += 1;
    pair = new this.klass.Pair;
    pair.setKey(key);
    bucket.push(pair);
    return pair;
  },
  
  rassoc: function(value) {
    var key = this.key(value);
    return key ? this.assoc(key) : null;
  },
  
  clear: function() {
    this._buckets = {};
    this.length = this.size = 0;
  },
  
  compareByIdentity: function() {
    this._compareByIdentity = true;
    return this;
  },
  
  comparesByIdentity: function() {
    return !!this._compareByIdentity;
  },
  
  setDefault: function(value) {
    this._default = value;
    return this;
  },
  
  getDefault: function(key) {
    return (typeof this._default === 'function')
        ? this._default(this, key)
        : (this._default || null);
  },
  
  equals: function(other) {
    if (!JS.isType(other, JS.Hash) || this.length !== other.length)
      return false;
    var result = true;
    this.forEach(function(pair) {
      if (!result) return;
      var otherPair = other.assoc(pair.key);
      if (otherPair === null || !otherPair.hasValue(pair.value)) result = false;
    });
    return result;
  },
  
  hash: function() {
    var hashes = [];
    this.forEach(function(pair) { hashes.push(pair.hash()) });
    return hashes.sort().join('');
  },
  
  fetch: function(key, defaultValue, context) {
    var pair = this.assoc(key);
    if (pair) return pair.value;
    
    if (defaultValue === undefined) throw new Error('key not found');
    if (typeof defaultValue === 'function') return defaultValue.call(context || null, key);
    return defaultValue;
  },
  
  forEachKey: function(block, context) {
    if (!block) return this.enumFor('forEachKey');
    block = JS.Enumerable.toFn(block);
    
    this.forEach(function(pair) {
      block.call(context || null, pair.key);
    });
    return this;
  },
  
  forEachPair: function(block, context) {
    if (!block) return this.enumFor('forEachPair');
    block = JS.Enumerable.toFn(block);
    
    this.forEach(function(pair) {
      block.call(context || null, pair.key, pair.value);
    });
    return this;
  },
  
  forEachValue: function(block, context) {
    if (!block) return this.enumFor('forEachValue');
    block = JS.Enumerable.toFn(block);
    
    this.forEach(function(pair) {
      block.call(context || null, pair.value);
    });
    return this;
  },
  
  get: function(key) {
    var pair = this.assoc(key);
    return pair ? pair.value : this.getDefault(key);
  },
  
  hasKey: function(key) {
    return !!this.assoc(key);
  },
  
  hasValue: function(value) {
    var has = false, ident = !!this._compareByIdentity;
    this.forEach(function(pair) {
      if (has) return;
      if (ident ? value === pair.value : JS.Enumerable.areEqual(value, pair.value))
        has = true;
    });
    return has;
  },
  
  invert: function() {
    var hash = new this.klass;
    this.forEach(function(pair) {
      hash.store(pair.value, pair.key);
    });
    return hash;
  },
  
  isEmpty: function() {
    for (var hash in this._buckets) {
      if (this._buckets.hasOwnProperty(hash) && this._buckets[hash].length > 0)
        return false;
    }
    return true;
  },
  
  key: function(value) {
    var result = null;
    this.forEach(function(pair) {
      if (!result && JS.Enumerable.areEqual(value, pair.value))
        result = pair.key;
    });
    return result;
  },
  
  keys: function() {
    var keys = [];
    this.forEach(function(pair) { keys.push(pair.key) });
    return keys;
  },
  
  merge: function(hash, block, context) {
    var newHash = new this.klass;
    newHash.update(this);
    newHash.update(hash, block, context);
    return newHash;
  },
  
  rehash: function() {
    var temp = new this.klass;
    temp._buckets = this._buckets;
    this.clear();
    this.update(temp);
  },
  
  remove: function(key, block) {
    if (block === undefined) block = null;
    var bucket, index, result;
    
    bucket = this._bucketForKey(key);
    if (!bucket) return (typeof block === 'function')
                      ? this.fetch(key, block)
                      : this.getDefault(key);
    
    index = this._indexInBucket(bucket, key);
    if (index < 0) return (typeof block === 'function')
                        ? this.fetch(key, block)
                        : this.getDefault(key);
    
    result = bucket[index].value;
    this._delete(bucket, index);
    this.size -= 1;
    this.length -= 1;
    
    if (bucket.length === 0)
      delete this._buckets[this.klass.codeFor(key)];
    
    return result;
  },
  
  _delete: function(bucket, index) {
    bucket.splice(index, 1);
  },
  
  removeIf: function(block, context) {
    if (!block) return this.enumFor('removeIf');
    block = JS.Enumerable.toFn(block);
    
    var toRemove = [];
    
    this.forEach(function(pair) {
      if (block.call(context || null, pair))
        toRemove.push(pair.key);
    }, this);
    
    var i = toRemove.length;
    while (i--) this.remove(toRemove[i]);
    
    return this;
  },
  
  replace: function(hash) {
    this.clear();
    this.update(hash);
  },
  
  shift: function() {
    var keys = this.keys();
    if (keys.length === 0) return this.getDefault();
    var pair = this.assoc(keys[0]);
    this.remove(pair.key);
    return pair;
  },
  
  store: function(key, value) {
    this.assoc(key, true).setValue(value);
    return value;
  },
  
  toString: function() {
    return 'Hash:{' + this.map(function(pair) {
      return pair.key.toString() + '=>' + pair.value.toString();
    }).join(',') + '}';
  },
  
  update: function(hash, block, context) {
    var givenBlock = (typeof block === 'function');
    hash.forEach(function(pair) {
      var key = pair.key, value = pair.value;
      if (givenBlock && this.hasKey(key))
        value = block.call(context || null, key, this.get(key), value);
      this.store(key, value);
    }, this);
  },
  
  values: function() {
    var values = [];
    this.forEach(function(pair) { values.push(pair.value) });
    return values;
  },
  
  valuesAt: function() {
    var i = arguments.length, results = [];
    while (i--) results.push(this.get(arguments[i]));
    return results;
  }
});

JS.Hash.alias({
  includes: 'hasKey',
  index:    'key',
  put:      'store'
});

JS.OrderedHash = new JS.Class('OrderedHash', JS.Hash, {
  assoc: function(key, createIfAbsent) {
    var _super = JS.Hash.prototype.assoc;
    
    var existing = _super.call(this, key, false);
    if (existing || !createIfAbsent) return existing;
    
    var pair = _super.call(this, key, true);
    
    if (!this._first) {
      this._first = this._last = pair;
    } else {
      this._last._next = pair;
      pair._prev = this._last;
      this._last = pair;
    }
    return pair;
  },
  
  clear: function() {
    this.callSuper();
    this._first = this._last = null;
  },
  
  _delete: function(bucket, index) {
    var pair = bucket[index];
    
    if (pair._prev) pair._prev._next = pair._next;
    if (pair._next) pair._next._prev = pair._prev;
    
    if (pair === this._first) this._first = pair._next;
    if (pair === this._last) this._last = pair._prev;
    
    return this.callSuper();
  },
  
  forEach: function(block, context) {
    if (!block) return this.enumFor('forEach');
    block = JS.Enumerable.toFn(block);
    
    var pair = this._first;
    while (pair) {
      block.call(context || null, pair);
      pair = pair._next;
    }
  },
  
  rehash: function() {
    var pair = this._first;
    this.clear();
    while (pair) {
      this.store(pair.key, pair.value);
      pair = pair._next;
    }
  }
});

/**
 * JS.Class: Ruby-style JavaScript
 * http://jsclass.jcoglan.com
 * Copyright (c) 2007-2012 James Coglan and contributors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * Parts of the Software build on techniques from the following open-source
 * projects:
 * 
 * * The Prototype framework, (c) 2005-2010 Sam Stephenson (MIT license)
 * * Alex Arnell's Inheritance library, (c) 2006 Alex Arnell (MIT license)
 * * Base, (c) 2006-2010 Dean Edwards (MIT license)
 * 
 * The Software contains direct translations to JavaScript of these open-source
 * Ruby libraries:
 * 
 * * Ruby standard library modules, (c) Yukihiro Matsumoto and contributors (Ruby license)
 * * Test::Unit, (c) 2000-2003 Nathaniel Talbott (Ruby license)
 * * Context, (c) 2008 Jeremy McAnally (MIT license)
 * * EventMachine::Deferrable, (c) 2006-07 Francis Cianfrocca (Ruby license)
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function() {
  var $ = (typeof this.global === 'object') ? this.global : this;
  $.JS = $.JS || {};
  JS.ENV = $;
})();

JS.Package = function(loader) {
  var Set = JS.Package.OrderedSet;
  JS.Package._index(this);
  
  this._loader    = loader;
  this._names     = new Set();
  this._deps      = new Set();
  this._uses      = new Set();
  this._styles    = new Set();
  this._observers = {};
  this._events    = {};
};

(function(klass) {
  klass.displayName = 'Package';
  klass.toString = function() { return klass.displayName };
  
  klass.log = function(message) {
    if (typeof window === 'undefined') return;
    if (typeof window.runtime === 'object') window.runtime.trace(message);
    if (window.console && console.info) console.info(message);
  };
  
  //================================================================
  // Ordered list of unique elements, for storing dependencies
  
  var Set = klass.OrderedSet = function(list) {
    this._members = this.list = [];
    this._index = {};
    if (!list) return;
    
    for (var i = 0, n = list.length; i < n; i++)
      this.push(list[i]);
  };

  Set.prototype.push = function(item) {
    var key   = (item.id !== undefined) ? item.id : item,
        index = this._index;
    
    if (index.hasOwnProperty(key)) return;
    index[key] = this._members.length;
    this._members.push(item);
  };
  
  //================================================================
  // Wrapper for deferred values
  
  var Deferred = klass.Deferred = function() {
    this._status    = 'deferred';
    this._value     = null;
    this._callbacks = [];
  };
  
  Deferred.prototype.callback = function(callback, context) {
    if (this._status === 'succeeded') callback.call(context, this._value);
    else this._callbacks.push([callback, context]);
  };
  
  Deferred.prototype.succeed = function(value) {
    this._status = 'succeeded';
    this._value  = value;
    var callback;
    while (callback = this._callbacks.shift())
      callback[0].call(callback[1], value);
  };
  
  //================================================================
  // Environment settings
  
  klass.ENV = JS.ENV;
  
  klass.onerror = function(e) { throw e };
  
  klass._throw = function(message) {
    klass.onerror(new Error(message));
  };
  
  
  //================================================================
  // Configuration methods, called by the DSL
  
  var instance = klass.prototype,
      
      methods = [['requires', '_deps'],
                 ['uses',     '_uses'],
                 ['styling',  '_styles']],
      
      i = methods.length;
  
  while (i--)
    (function(pair) {
      var method = pair[0], list = pair[1];
      instance[method] = function() {
        var n = arguments.length, i;
        for (i = 0; i < n; i++) this[list].push(arguments[i]);
        return this;
      };
    })(methods[i]);
  
  instance.provides = function() {
    var n = arguments.length, i;
    for (i = 0; i < n; i++) {
      this._names.push(arguments[i]);
      klass._getFromCache(arguments[i]).pkg = this;
    }
    return this;
  };
  
  instance.setup = function(block) {
    this._onload = block;
    return this;
  };
  
  //================================================================
  // Event dispatchers, for communication between packages
  
  instance._on = function(eventType, block, context) {
    if (this._events[eventType]) return block.call(context);
    var list = this._observers[eventType] = this._observers[eventType] || [];
    list.push([block, context]);
    this._load();
  };
  
  instance._fire = function(eventType) {
    if (this._events[eventType]) return false;
    this._events[eventType] = true;
    
    var list = this._observers[eventType];
    if (!list) return true;
    delete this._observers[eventType];
    
    for (var i = 0, n = list.length; i < n; i++)
      list[i][0].call(list[i][1]);
    
    return true;
  };
  
  //================================================================
  // Loading frontend and other miscellany
  
  instance._isLoaded = function(withExceptions) {
    if (!withExceptions && this.__isLoaded !== undefined) return this.__isLoaded;
    
    var names = this._names.list,
        i     = names.length,
        name, object;
    
    while (i--) { name = names[i];
      object = klass._getObject(name, this._exports);
      if (object !== undefined) continue;
      if (withExceptions)
        return klass._throw('Expected package at ' + this._loader + ' to define ' + name);
      else
        return this.__isLoaded = false;
    }
    return this.__isLoaded = true;
  };
  
  instance._load = function() {
    if (!this._fire('request')) return;
    this._prefetch();
    
    var allDeps = this._deps.list.concat(this._uses.list),
        source  = this._source || [],
        n       = (this._loader || {}).length,
        self    = this;
    
    klass.when({load: allDeps});
    
    klass.when({complete: this._deps.list}, function() {
      klass.when({complete: allDeps, load: [this]}, function() {
        this._fire('complete');
      }, this);
      
      var loadNext = function(exports) {
        if (n === 0) return fireOnLoad(exports);
        n -= 1;
        var index = self._loader.length - n - 1;
        klass.Loader.loadFile(self._loader[index], loadNext, source[index]);
      };
      
      var fireOnLoad = function(exports) {
        self._exports = exports;
        if (self._onload) self._onload();
        self._isLoaded(true);
        self._fire('load');
      };
      
      if (this._isLoaded()) {
        this._fire('download');
        return this._fire('load');
      }
      
      if (this._loader === undefined)
        return klass._throw('No load path found for ' + this._names.list[0]);
      
      if (typeof this._loader === 'function')
        this._loader(fireOnLoad);
      else
        loadNext();
      
      if (!klass.Loader.loadStyle) return;
      
      var styles = this._styles.list,
          i      = styles.length;
      
      while (i--) klass.Loader.loadStyle(styles[i]);
      
      this._fire('download');
    }, this);
  };
  
  instance._prefetch = function() {
    if (this._source || !(this._loader instanceof Array) || !klass.Loader.fetch)
      return;
    
    this._source = [];
    
    for (var i = 0, n = this._loader.length; i < n; i++)
      this._source[i] = klass.Loader.fetch(this._loader[i]);
  };
  
  instance.toString = function() {
    return 'Package:' + this._names.list.join(',');
  };
  
  //================================================================
  // Class-level event API, handles group listeners
  
  klass.when = function(eventTable, block, context) {
    var eventList = [], objects = {}, event, packages, i;
    for (event in eventTable) {
      if (!eventTable.hasOwnProperty(event)) continue;
      objects[event] = [];
      packages = new klass.OrderedSet(eventTable[event]);
      i = packages.list.length;
      while (i--) eventList.push([event, packages.list[i], i]);
    }
    
    var waiting = i = eventList.length;
    if (waiting === 0) return block && block.call(context, objects);
    
    while (i--)
      (function(event) {
        var pkg = klass._getByName(event[1]);
        pkg._on(event[0], function() {
          objects[event[0]][event[2]] = klass._getObject(event[1], pkg._exports);
          waiting -= 1;
          if (waiting === 0 && block) block.call(context, objects);
        });
      })(eventList[i]);
  };
  
  //================================================================
  // Indexes for fast lookup by path and name, and assigning IDs
  
  klass._autoIncrement = 1;
  klass._indexByPath = {};
  klass._indexByName = {};
  klass._autoloaders = [];
  
  klass._index = function(pkg) {
    pkg.id = this._autoIncrement;
    this._autoIncrement += 1;
  };
  
  klass._getByPath = function(loader) {
    var path = loader.toString(),
        pkg  = this._indexByPath[path];
    
    if (pkg) return pkg;
    
    if (typeof loader === 'string')
      loader = [].slice.call(arguments);
    
    pkg = this._indexByPath[path] = new this(loader);
    return pkg;
  };
  
  klass._getByName = function(name) {
    if (typeof name !== 'string') return name;
    var cached = this._getFromCache(name);
    if (cached.pkg) return cached.pkg;
    
    var autoloaded = this._manufacture(name);
    if (autoloaded) return autoloaded;
    
    var placeholder = new this();
    placeholder.provides(name);
    return placeholder;
  };
  
  klass.remove = function(name) {
    var pkg = this._getByName(name);
    delete this._indexByName[name];
    delete this._indexByPath[pkg._loader];
  };
  
  //================================================================
  // Auotloading API, generates packages from naming patterns
  
  klass._autoload = function(pattern, options) {
    this._autoloaders.push([pattern, options]);
  };
  
  klass._manufacture = function(name) {
    var autoloaders = this._autoloaders,
        n = autoloaders.length,
        i, autoloader, path;
    
    for (i = 0; i < n; i++) {
      autoloader = autoloaders[i];
      if (!autoloader[0].test(name)) continue;
      
      path = autoloader[1].from + '/' +
             name.replace(/([a-z])([A-Z])/g, function(m,a,b) { return a + '_' + b })
                 .replace(/\./g, '/')
                 .toLowerCase() + '.js';
      
      var pkg = new this([path]);
      pkg.provides(name);
      
      if (path = autoloader[1].require)
        pkg.requires(name.replace(autoloader[0], path));
      
      return pkg;
    }
    return null;
  };
  
  //================================================================
  // Cache for named packages and runtime objects
  
  klass._getFromCache = function(name) {
    return this._indexByName[name] = this._indexByName[name] || {};
  };
  
  klass._getObject = function(name, rootObject) {
    if (typeof name !== 'string') return undefined;
    
    var cached = rootObject ? {} : this._getFromCache(name);
    if (cached.obj !== undefined) return cached.obj;
    
    var object = rootObject || this.ENV,
        parts  = name.split('.'), part;
    
    while (part = parts.shift()) object = object && object[part];
    
    if (rootObject && object === undefined)
      return this._getObject(name);
    
    return cached.obj = object;
  };
  
})(JS.Package);


JS.Package.CommonJSLoader = {
  usable: function() {
    return typeof require === 'function' &&
           typeof exports === 'object';
  },
  
  __FILE__: function() {
    return this._currentPath;
  },
  
  loadFile: function(path, fireCallbacks) {
    var cwd    = process.cwd(),
        module = path.replace(/\.[^\.]+$/g, ''),
        path   = require('path'),
        file   = path.resolve(module);
    
    this._currentPath = file + '.js';
    fireCallbacks(require(file));
  }
};

JS.Package.DomLoader = {
  HOST_REGEX: /^https?\:\/\/[^\/]+/i,
  
  usable: function() {
    return !!JS.Package._getObject('window.document.getElementsByTagName');
  },
  
  __FILE__: function() {
    var scripts = document.getElementsByTagName('script');
        src     = scripts[scripts.length - 1].src,
        url     = window.location.href;
    
    if (/^\w+\:\/+/.test(src)) return src;
    if (/^\//.test(src)) return window.location.origin + src;
    return url.replace(/[^\/]*$/g, '') + src;
  },
  
  cacheBust: function(path) {
    var token = new Date().getTime();
    return path + (/\?/.test(path) ? '&' : '?') + token;
  },
  
  fetch: function(path) {
    var originalPath = path;
    if (JS.cacheBust) path = this.cacheBust(path);
    
    this.HOST = this.HOST || this.HOST_REGEX.exec(window.location.href);
    var host = this.HOST_REGEX.exec(path);
    
    if (!this.HOST || (host && host[0] !== this.HOST[0])) return null;
    JS.Package.log('Loading ' + path);
    
    var source = new JS.Package.Deferred(),
        self   = this,
        xhr    = window.ActiveXObject
               ? new ActiveXObject('Microsoft.XMLHTTP')
               : new XMLHttpRequest();
    
    xhr.open('GET', path, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;
      xhr.onreadystatechange = self._K;
      source.succeed(xhr.responseText + '\n//@ sourceURL=' + originalPath);
      xhr = null;
    };
    xhr.send(null);
    return source;
  },
  
  loadFile: function(path, fireCallbacks, source) {
    if (JS.cacheBust && !source) path = this.cacheBust(path);
    
    var self   = this,
        head   = document.getElementsByTagName('head')[0],
        script = document.createElement('script');
    
    script.type = 'text/javascript';
    
    if (source)
      return source.callback(function(code) {
        JS.Package.log('Executing ' + path);
        eval(code);
        fireCallbacks();
      });
    
    JS.Package.log('Loading and executing ' + path);
    script.src = path;
    
    script.onload = script.onreadystatechange = function() {
      var state = script.readyState, status = script.status;
      if ( !state || state === 'loaded' || state === 'complete' ||
           (state === 4 && status === 200) ) {
        fireCallbacks();
        script.onload = script.onreadystatechange = self._K;
        head   = null;
        script = null;
      }
    };
    head.appendChild(script);
  },
  
  loadStyle: function(path) {
    var link  = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = path;
    
    document.getElementsByTagName('head')[0].appendChild(link);
  },
  
  _K: function() {}
};

JS.Package.RhinoLoader = {
  usable: function() {
    return typeof java === 'object' &&
           typeof require === 'function';
  },
  
  __FILE__: function() {
    return this._currentPath;
  },
  
  loadFile: function(path, fireCallbacks) {
    var cwd    = java.lang.System.getProperty('user.dir'),
        module = path.replace(/\.[^\.]+$/g, '');
    
    var requirePath = new java.io.File(cwd, module).toString();
    this._currentPath = requirePath + '.js';
    fireCallbacks(require(requirePath));
  }
};

JS.Package.ServerLoader = {
  usable: function() {
    return typeof JS.Package._getObject('load') === 'function' &&
           typeof JS.Package._getObject('version') === 'function';
  },
  
  __FILE__: function() {
    return this._currentPath;
  },
  
  loadFile: function(path, fireCallbacks) {
    this._currentPath = path;
    load(path);
    fireCallbacks();
  }
};

JS.Package.WshLoader = {
  usable: function() {
    return !!JS.Package._getObject('ActiveXObject') &&
           !!JS.Package._getObject('WScript');
  },
  
  __FILE__: function() {
    return this._currentPath;
  },
  
  loadFile: function(path, fireCallbacks) {
    this._currentPath = path;
    var fso = new ActiveXObject('Scripting.FileSystemObject'), file, runner;
    try {
      file   = fso.OpenTextFile(path);
      runner = function() { eval(file.ReadAll()) };
      runner();
      fireCallbacks();
    } finally {
      try { if (file) file.Close() } catch (e) {}
    }
  }
};

JS.Package.XULRunnerLoader = {
  jsloader:   '@mozilla.org/moz/jssubscript-loader;1',
  cssservice: '@mozilla.org/content/style-sheet-service;1',
  ioservice:  '@mozilla.org/network/io-service;1',
  
  usable: function() {
    try {
      var CC = (Components || {}).classes;
      return !!(CC && CC[this.jsloader] && CC[this.jsloader].getService);
    } catch(e) {
      return false;
    }
  },

  setup: function() {
    var Cc = Components.classes, Ci = Components.interfaces;
    this.ssl = Cc[this.jsloader].getService(Ci.mozIJSSubScriptLoader);
    this.sss = Cc[this.cssservice].getService(Ci.nsIStyleSheetService);
    this.ios = Cc[this.ioservice].getService(Ci.nsIIOService);
  },

  loadFile: function(path, fireCallbacks) {
    if (window.console && console.info)
      console.info('Loading ' + path);
    
    this.ssl.loadSubScript(path);
    fireCallbacks();
  },
  
  loadStyle: function(path) {
    var uri = this.ios.newURI(path, null, null);
    this.sss.loadAndRegisterSheet(uri, this.sss.USER_SHEET);
  }
};

(function() {
  var candidates = [  JS.Package.XULRunnerLoader,
                      JS.Package.DomLoader,
                      JS.Package.RhinoLoader,
                      JS.Package.CommonJSLoader,
                      JS.Package.ServerLoader,
                      JS.Package.WshLoader ],
      
      n = candidates.length,
      i, candidate;
  
  for (i = 0; i < n; i++) {
    candidate = candidates[i];
    if (candidate.usable()) {
      JS.Package.Loader = candidate;
      if (candidate.setup) candidate.setup();
      break;
    }
  }
})();


JS.Package.DSL = {
  __FILE__: function() {
    return JS.Package.Loader.__FILE__();
  },
  
  pkg: function(name, path) {
    var pkg = path
        ? JS.Package._getByPath(path)
        : JS.Package._getByName(name);
    pkg.provides(name);
    return pkg;
  },
  
  file: function() {
    return JS.Package._getByPath.apply(JS.Package, arguments);
  },
  
  load: function(path, fireCallbacks) {
    JS.Package.Loader.loadFile(path, fireCallbacks);
  },
  
  autoload: function(pattern, options) {
    JS.Package._autoload(pattern, options);
  }
};

JS.Package.DSL.files  = JS.Package.DSL.file;
JS.Package.DSL.loader = JS.Package.DSL.file;

JS.Packages = function(declaration) {
  declaration.call(JS.Package.DSL);
};

JS.cacheBust = false;

JS.load = function(url, callback) {
  JS.Package.Loader.loadFile(url, function() {
    if (typeof callback === 'function') callback();
  });
  return this;
};
 
JS.require = function() {
  var requirements = [], i = 0;
  
  while (typeof arguments[i] === 'string'){
    requirements.push(arguments[i]);
    i += 1;
  }
  var callback = arguments[i], context = arguments[i+1];
  
  JS.Package.when({complete: requirements}, function(objects) {
    if (!callback) return;
    callback.apply(context || null, objects && objects.complete);
  });
  
  return this;
};


JS.Packages(function() { with(this) {
    
    // Debugging
    // JSCLASS_PATH = 'build/min/';
    
    JS.Package.ENV.JSCLASS_PATH = JS.Package.ENV.JSCLASS_PATH ||
                                  __FILE__().replace(/[^\/]*$/g, '');
    
    var PATH = JS.Package.ENV.JSCLASS_PATH;
    if (!/\/$/.test(PATH)) PATH = PATH + '/';
    
    var module = function(name) { return file(PATH + name + '.js') };
    
    module('core')          .provides('JS.Module',
                                      'JS.Class',
                                      'JS.Method',
                                      'JS.Kernel',
                                      'JS.Singleton',
                                      'JS.Interface');
    
    var test = 'JS.Test.Unit';
    module('test')          .provides('JS.Test',
                                      'JS.Test.Context',
                                      'JS.Test.Mocking',
                                      'JS.Test.FakeClock',
                                      'JS.Test.AsyncSteps',
                                      'JS.Test.Helpers',
                                      test,
                                      test + '.Assertions',
                                      test + '.TestCase',
                                      test + '.TestSuite',
                                      test + '.TestResult')
                            .requires('JS.Module',
                                      'JS.Class',
                                      'JS.Console',
                                      'JS.DOM',
                                      'JS.Enumerable',
                                      'JS.SortedSet',
                                      'JS.Comparable',
                                      'JS.StackTrace')
                            .styling(PATH + 'assets/testui.css');
    
    module('dom')           .provides('JS.DOM',
                                      'JS.DOM.Builder')
                            .requires('JS.Class');
    

    module('console')       .provides('JS.Console')
                            .requires('JS.Module',
                                      'JS.Enumerable');

    module('benchmark')     .provides('JS.Benchmark')
                            .requires('JS.Module')
                            .requires('JS.Console');
    
    module('comparable')    .provides('JS.Comparable')
                            .requires('JS.Module');
    
    module('constant_scope').provides('JS.ConstantScope')
                            .requires('JS.Module');
    
    module('forwardable')   .provides('JS.Forwardable')
                            .requires('JS.Module');
    
    module('enumerable')    .provides('JS.Enumerable')
                            .requires('JS.Module',
                                      'JS.Class');
    
    module('deferrable')    .provides('JS.Deferrable')
                            .requires('JS.Module');
    
    module('observable')    .provides('JS.Observable')
                            .requires('JS.Module');
    
    module('hash')          .provides('JS.Hash',
                                      'JS.OrderedHash')
                            .requires('JS.Class',
                                      'JS.Enumerable',
                                      'JS.Comparable');
    
    module('range')         .provides('JS.Range')
                            .requires('JS.Class',
                                      'JS.Enumerable');
    
    module('set')           .provides('JS.Set',
                                      'JS.HashSet',
                                      'JS.OrderedSet',
                                      'JS.SortedSet')
                            .requires('JS.Class',
                                      'JS.Enumerable')
                            .uses(    'JS.Hash');
    
    module('linked_list')   .provides('JS.LinkedList',
                                      'JS.LinkedList.Doubly',
                                      'JS.LinkedList.Doubly.Circular')
                            .requires('JS.Class',
                                      'JS.Enumerable');
    
    module('command')       .provides('JS.Command',
                                      'JS.Command.Stack')
                            .requires('JS.Class',
                                      'JS.Enumerable',
                                      'JS.Observable');
    
    module('decorator')     .provides('JS.Decorator')
                            .requires('JS.Module',
                                      'JS.Class');
    
    module('method_chain')  .provides('JS.MethodChain')
                            .requires('JS.Module',
                                      'JS.Kernel');
    
    module('proxy')         .provides('JS.Proxy',
                                      'JS.Proxy.Virtual')
                            .requires('JS.Module',
                                      'JS.Class');
    
    module('stack_trace')   .provides('JS.StackTrace')
                            .requires('JS.Module',
                                      'JS.Singleton',
                                      'JS.Observable',
                                      'JS.Enumerable',
                                      'JS.Console');
    
    module('state')         .provides('JS.State')
                            .requires('JS.Module',
                                      'JS.Class');
    
    module('tsort')         .provides('JS.TSort')
                            .requires('JS.Module')
                            .requires('JS.Class')
                            .requires('JS.Hash');
}});


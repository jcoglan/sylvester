JS.Console = new JS.Module('Console', {
  extend: {
    nameOf: function(object, root) {
      var results = [], i, n, field, l;
      
      if (JS.isType(object, Array)) {
        for (i = 0, n = object.length; i < n; i++)
          results.push(this.nameOf(object[i]));
        return results;
      }
      
      if (object.displayName) return object.displayName;
      
      field = [{name: null, o: root || JS.ENV}];
      l = 0;
      while (typeof field === 'object' && l < this.MAX_DEPTH) {
        l += 1;
        field = this.descend(field, object);
      }
      if (typeof field == 'string') {
        field = field.replace(/\.prototype\./g, '#');
        object.displayName = field;
        if (object.__meta__) object.__meta__.displayName = field + '.__meta__';
      }
      return object.displayName;
    },
    
    descend: function(list, needle) {
      var results = [],
          n       = list.length,
          i       = n,
          key, item, name;
      
      while (i--) {
        item = list[i];
        if (JS.isType(item.o, Array)) continue;
        name = item.name ? item.name + '.' : '';
        for (key in item.o) {
          if (needle && item.o[key] === needle) return name + key;
          results.push({name: name + key, o: item.o[key]});
        }
      }
      return results;
    },
    
    MAX_DEPTH: 4,
    
    convert: function(object, stack) {
      if (object === null || object === undefined) return String(object);
      var E = JS.Enumerable, stack = stack || [], items;
      
      if (JS.indexOf(stack, object) >= 0) return '#circular';
      
      if (object instanceof Error) {
        return (typeof object.message === 'string' && !object.message)
             ? object.name
             : object.name + (object.message ? ': ' + object.message : '');
      }
      
      if (object instanceof Array) {
        stack.push(object);
        items = new E.Collection(object).map(function(item) {
            return this.convert(item, stack);
          }, this).join(', ');
        stack.pop();
        return items ? '[ ' + items + ' ]' : '[]';
      }
      
      if (object instanceof String || typeof object === 'string')
        return '"' + object + '"';
      
      if (object instanceof Function)
        return object.displayName ||
               object.name ||
              (object.toString().match(/^\s*function ([^\(]+)\(/) || [])[1] ||
               '#function';
      
      if (object instanceof Date)
        return object.toGMTString();
      
      if (object.toString &&
          object.toString !== Object.prototype.toString &&
          !object.toString.__traced__)
        return object.toString();
      
      if (object.nodeType !== undefined) return object.toString();
      
      stack.push(object);
      items = new E.Collection(E.objectKeys(object, false).sort()).map(function(key) {
          return this.convert(key, stack) + ': ' + this.convert(object[key], stack);
        }, this).join(', ');
      stack.pop();
      return items ? '{ ' + items + ' }' : '{}';
    },
    
    filterBacktrace: function(stack) {
      if (this.BROWSER) {
        var cwd = new RegExp(window.location.href.replace(/(\/[^\/]+)/g, '($1)?') + '/?', 'g');
        return stack.replace(cwd, '');
      }
      else if (this.RHINO) {
        var cwd = java.lang.System.getProperty('user.dir') + '/';
        return stack.replace(new RegExp(cwd, 'g'), '');
      }
      else if (this.NODE) {
        var cwd = process.cwd() + '/';
        return stack.replace(new RegExp(cwd, 'g'), '');
      }
      else if (typeof version === 'function' && version() > 100) {
        return '';
      }
      else {
        return stack;
      }
    },
    
    ANSI_CSI: String.fromCharCode(0x1B) + '[',
    MAX_BUFFER_LENGTH: 78,
    
    BROWSER: (typeof window !== 'undefined'),
    NODE:    (typeof process === 'object'),
    RHINO:   (typeof java !== 'undefined' && typeof java.lang !== 'undefined'),
    WINDOZE: (typeof window !== 'undefined' || typeof WScript !== 'undefined'),
    WSH:     (typeof WScript !== 'undefined'),
    
    coloring: function() {
      return !(this.BROWSER && !window.runtime) && !this.WINDOZE;
    },
    
    __buffer__: '',
    __format__: '',
    
    ESCAPE_CODES: {
      reset:      0,
      bold:       1,    normal:       22,
      underline:  4,    noline:       24,
      blink:      5,    noblink:      25,
      
      black:      30,   bgblack:      40,
      red:        31,   bgred:        41,
      green:      32,   bggreen:      42,
      yellow:     33,   bgyellow:     43,
      blue:       34,   bgblue:       44,
      magenta:    35,   bgmagenta:    45,
      cyan:       36,   bgcyan:       46,
      white:      37,   bgwhite:      47,
      nocolor:    39,   bgnocolor:    49
    },
    
    escape: function(string) {
      return this.ANSI_CSI + string;
    },
    
    repeat: function(string, n) {
      var result = '';
      while (n--) result += string;
      return result;
    },
    
    pad: function(string, width) {
      string = (string === undefined ? '' : string).toString();
      return string + this.repeat(' ', width - string.length);
    },
    
    flushFormat: function() {
      var format = this.__format__;
      this.__format__ = '';
      return format;
    },
    
    output: function(string, followon) {
      while (string.length > 0) {
        var length  = this.__buffer__.length,
            max     = this.BROWSER ? 1000 : this.MAX_BUFFER_LENGTH,
            movable = (length > 0 && this.coloring()),
            escape  = movable ? this.escape('1F') + this.escape((length + 1) + 'G') : '',
            line    = string.substr(0, max - length);
        
        this.__buffer__ += line;
        
        if (this.coloring())
          this.writeToStdout(escape + this.flushFormat() + line);
        else if (this.__buffer__.length === max)
          this.writeToStdout(this.__buffer__);
        
        if (this.__buffer__.length === max)
          this.__buffer__ = '';
        
        string = string.substr(max - length);
      }
      if (!followon) {
        if (string === '' && !this.__buffer__)
          this.writeToStdout(this.flushFormat() + '');
        
        if (!this.coloring() && this.__buffer__)
          this.writeToStdout(this.__buffer__);
        
        this.__buffer__ = '';
      }
    },
    
    writeToStdout: function(string) {
      if (this.BROWSER && window.runtime) return window.runtime.trace(string);
      if (this.NODE)                      return console.warn(string);
      if (this.RHINO)                     return java.lang.System.out.println(string);
      if (this.WSH)                       return WScript.Echo(string);
      if (typeof console !== 'undefined') return console.log(string);
      if (typeof alert === 'function')    return alert(string);
      if (typeof print === 'function')    return print(string);
    }
  },
  
  consoleFormat: function() {
    if (!JS.Console.coloring()) return;
    this.reset();
    var i = arguments.length;
    while (i--) this[arguments[i]]();
  },
  
  puts: function(string) {
    string = (string === undefined ? '' : string).toString();
    var C = JS.Console;
    if (C.NODE || C.RHINO) {
      C.writeToStdout(C.flushFormat() + string);
      C.__print__ = false;
    }
    else {
      C.output(string, false);
    }
  },
  
  print: function(string) {
    string = (string === undefined ? '' : string).toString();
    var C = JS.Console, sys;
    
    if (C.NODE) {
      try { sys = require('util') }
      catch (e) { sys = require('sys') }
      sys.print(C.flushFormat() + string);
      C.__print__ = true;
    }
    else if (C.RHINO) {
      java.lang.System.out.print(C.flushFormat() + string);
      C.__print__ = true;
    }
    else {
      C.output(string, true);
    }
  },
  
  printTable: function(table, formatter) {
    var widths = [],
        table  = [['Method', 'Calls']].concat(table),
        C = JS.Console,
        i = table.length,
        j, string;
    
    while (i--) {
      j = table[i].length;
      while (j--) {
        widths[j] = widths[j] || 0;
        string = (table[i][j] === undefined ? '' : table[i][j]).toString();
        widths[j] = Math.max(string.length, widths[j]);
      }
    }
    
    var divider = '+', j = widths.length;
    while (j--) divider = '+' + C.repeat('-', widths[j] + 2) + divider;
    divider = '  ' + divider;
    this.reset();
    this.puts();
    this.puts(divider);
    
    var printRow = function(row, format) {
      var data = table[row];
      this.reset();
      this.print('  ');
      for (var i = 0, n = data.length; i < n; i++) {
        this.reset();
        this.print('|');
        this.consoleFormat.apply(this, format);
        this.print(' ' + C.pad(data[i], widths[i]) + ' ');
      }
      this.reset();
      this.puts('|');
    };
    printRow.call(this, 0, ['bold']);
    this.reset();
    this.puts(divider);
    
    for (var i = 1, n = table.length; i < n; i++) {
      var format = formatter ? formatter(table[i], i) : [];
      printRow.call(this, i, format);
    }
    this.reset();
    this.puts(divider);
  }
});

(function() {
  var C = JS.Console;
  
  for (var key in C.ESCAPE_CODES) (function(key) {
    C.define(key, function() {
      if (!JS.Console.coloring()) return;
      var escape = C.ESCAPE_CODES[key];
      C.__format__ += C.escape(escape + 'm');
    });
  })(key);
  
  C.extend(C);
})();

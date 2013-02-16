

/**
 * hasOwnProperty.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (has.call(require.modules, path)) return path;
  }

  if (has.call(require.aliases, index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!has.call(require.modules, from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    if ('.' != path.charAt(0)) {
      var segs = parent.split('/');
      var i = lastIndexOf(segs, 'deps') + 1;
      if (!i) i = 0;
      path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
      return path;
    }
    return require.normalize(p, path);
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return has.call(require.modules, localRequire.resolve(path));
  };

  return localRequire;
};
require.register("threepointone-twain/lib/twain.js", function(exports, require, module){
(function(name, context, definition) {

    if(typeof module != 'undefined' && module.exports) module.exports = definition();
    else if(typeof define == 'function' && define.amd) define(definition);
    else context[name] = definition();

})('Twain', this, function() {
    // some helper functions
    var nativeForEach = [].forEach,
        slice = [].slice,
        has = {}.hasOwnProperty;

    function each(obj, iterator, context) {
        if(obj == null) return;
        if(nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if(obj.length === +obj.length) {
            for(var i = 0, l = obj.length; i < l; i++) {
                if(iterator.call(context, obj[i], i, obj) === {}) return;
            }
        } else {
            for(var key in obj) {
                if(has.call(obj, key)) {
                    if(iterator.call(context, obj[key], key, obj) === {}) return;
                }
            }
        }
    }

    function collect(obj, fn) {
        var o = {};
        each(obj, function(el, index) {
            o[index] = (typeof fn === 'string') ? el[fn] : fn(el, index);
        });
        return o;
    }

    function extend(obj) {
        each(slice.call(arguments, 1), function(source) {
            for(var prop in source) {
                if(has.call(source, prop)) {
                    obj[prop] = source[prop];
                }
            }
        });
        return obj;
    }

    function isValue(v) {
        return v != null; // matches undefined and null
    }

    function abs(n) {
        return n < 0 ? -n : n;
    }

    function identity(x) {
        return x;
    }

    // defaults for a single tweener. pass these params into constructor to change the nature of the animation
    var defaults = {
        // used for snapping, since the algorithm doesn't ever reach the 'end'
        threshold: 0.2,
        // fraction to moveby per frame * fps. this determines "speed"
        // defaults to ~ 15% * (1000/60)
        multiplier: 0.01,
        // timer function, so you can do a custom f(t)
        now: function() {
            return new Date().getTime();
        }
    };


    // meat and potatoes

    function Tween(config) {
        if(!(this instanceof Tween)) return new Tween(config);

        this.config = config = extend({}, config);

        // merge the defaults with self
        each(defaults, function(val, key) {
            this[key] = isValue(config[key]) ? config[key] : val;
        }, this);
    }

    extend(Tween.prototype, {
        // Number: defines 'origin', ie - the number to start from
        from: function(from) {
            this._from = this.value = from;
            isValue(this._to) || this.to(from);
            return this;
        },
        // Number: defines 'destinations', ie - the number to go to
        to: function(to) {
            isValue(this._from) || this.from(to);
            this._to = to;
            return this;
        },
        // run one step of the tween. updates internal variables, and return spec object for this 'instant'
        step: function() {

            isValue(this.time) || (this.time = this.now());

            // this is the heart of the whole thing, really. 
            // an implementation of an exponential smoothing function
            // http://en.wikipedia.org/wiki/Exponential_smoothing
            var now = this.now(),
                period = now - this.time,
                fraction = Math.min(this.multiplier * period, 1),
                delta = fraction * (this._to - this.value),
                value = this.value + delta;

            // snap if we're close enough to the target (defined by `this.threshold`)
            if(abs(this._to - value) < this.threshold) {
                delta = this._to - this.value;
                this.value = value = this._to;
                fraction = 1;

            } else {
                this.value = value;
            }

            this.time = now;

            this._update({
                time: this.time,
                period: period,
                fraction: fraction,
                delta: delta,
                value: value
            });

            return this;

        },
        // default handler for every step. change this by using this.update(fn)
        _update: function() {
            // blank
        },
        // if function is passed, it registers that as the step handler. else, it executes a step and returns the spec object
        update: function(fn) {
            if(!fn) return this.step();
            this._update = fn;
            return this;

        },
        // resets time var so that next time it starts with a fresh value
        stop: function() {
            this.time = null;
            return this;
        },
        multiply: function(n){
            this.multiplier = typeof n === 'function'? n.apply(this) : n;            
        }

    });


    // Twain.
    // this basically holds a collection of tweeners for easy usage. 
    // check out examples on how to use.

    function Twain(obj) {
        if(!(this instanceof Twain)) return new Twain(obj);

        extend(this, {
            config: obj || {},
            tweens: {}
        });

        this.encode = this.config.encode || identity;
        this.decode = this.config.decode || identity;

        // reset the config encode/decode functions. we don't want it to propogate through
        // ... or do we?        
        this.config.encode = this.config.decode = identity;

    }

    extend(Twain.prototype, {
        // convenience to get a tween for a prop, and generate if required.
        // send T == true to generate a nested twain instead
        $t: function(prop, T) {
            return(this.tweens[prop] || (this.tweens[prop] = (T ? Twain : Tween)(this.config)));
        },

        from: function(_from) {
            var from = this.encode(_from);
            each(from, function(val, prop) {
                this.$t(prop, typeof val === 'object').from(val);
            }, this);
            return this;
        },

        to: function(_to) {
            var to = this.encode(_to);
            each(to, function(val, prop) {
                this.$t(prop, typeof val === 'object').to(val);
            }, this);
            return this;
        },

        step: function() {
            var val = this.value = collect(this.tweens, function(tween) {
                return tween.step().value;
            });
            this._update(val);
            return this;
        },
        decoded: function(){
            return this.decode(this.value);
        },

        multiply: function(n){
            each(this.tweens, function(t){
                t.multiply(n);
            });
        },

        _update: function() {
            // blank
        },

        update: function(fn) {
            if(!fn) return this.step();
            this._update = fn;
            return this;
        },
        stop: function() {
            each(this.tweens, function(tween) {
                tween.stop();
            });
            return this;
        }
    });

    // export some pieces 
    Twain.Tween = Tween;

    Twain.util = {
        isValue: isValue,
        extend: extend,
        each: each,
        collect: collect
    };

    return Twain;

});
});
require.register("grain/index.js", function(exports, require, module){
// Let's start with the basics - 
(function(name, context, definition) {

    if(typeof module != 'undefined' && module.exports) module.exports = definition();
    else if(typeof define == 'function' && define.amd) define(definition);
    else context[name] = definition();

})('grain', this, function() {

    // first get your modules
    var req = typeof require === 'function';
    var Twain = req ? require('twain') : Twain,
        // import some useful functions
        extend = Twain.util.extend,
        each = Twain.util.each;


    // taking this pattern from twain's unit tests

    function ticker() {
        var time = 0;
        function f() {
            return time;
        }

        f.tick = function() {
            time++;
        };

        return f;
    }


    function grain(arr, options) {

        options || (options = {});

        var period = options.period || 100,
            timer = ticker(),
            result = [];

        var t = Twain.Tween(extend({}, {
            now: timer
        }, options));

        t.update(function() {
            timer.tick();
            result.push(t.value);
        }).from(arr[0]);




        each(arr, function(target, index) {            
            if(index===0) return;
            for(var i = 0; i < period; i++) {
                t.update();
                t.to(arr[index-1] + (i*(target - arr[index-1])/period));
            }
        });
        return result;
    }

    // exports
    grain.Twain = Twain;
    return grain;

});
});
require.alias("threepointone-twain/lib/twain.js", "grain/deps/twain/lib/twain.js");
require.alias("threepointone-twain/lib/twain.js", "grain/deps/twain/index.js");


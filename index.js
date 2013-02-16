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
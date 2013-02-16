
# grain

  smoothing time series with twain

  ![graph](http://i.imgur.com/Y0yvkoN.png)

## Installation

    $ component install threepointone/grain

## API

```js 
// speculative, work in progress

var smooth = require('grain')(arr, {
    period: 100,
    multiplier: 0.01
});

// should return (arr.length-1)*100 points


```

## License

  MIT

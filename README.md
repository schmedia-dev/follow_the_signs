# Follow the signs
My 1st Zenbot Strategy - Trying to develop a good daytrading strategy for volatile currencies with small investments

The idea is very simple:
 * 2 green candle -> red candle => buy
* 2 red candle -> green candle => sell

To get a better idea I have captured the whole thing here in pseudo code:

```
// start
if trend is unknown set trend to flat

// rising means two or more green candles
if trend is rising
    if rsi > last.rsi trend still rising
    else if rsi < last.rsi
        // trend changed, time to sell
        set trend to down
        sell
    else set trend to flat

// up means the first green candle
if trend is up
    if rsi > last.rsi set trend to rising
    else if rsi < last.rsi set trend to down
    else set trend = flat

// flat means nearly the same candle as last
if trend is flat
    if rsi > last.rsi set trend to up
    else if rsi < last.rsi set trend to down
    else set trend to flat

// down means the first red candle
if trend is down
    if rsi > last.rsi set trend to up
    else if rsi < last.rsi set trend to falling
    else set trend to flat

// falling means two or more red candles
if trend is falling
    if rsi > last.rsi
        // trend changed, time to buy
        set trend to up
        buy!
    else if rsi < last.rsi trend still falling
    else set trend to flat
```    

var z = require('zero-fill')
  , n = require('numbro')
  , rsi = require('../../../lib/rsi')
  , Phenotypes = require('../../../lib/phenotype')
  , Asset_currency = require('../../../lib/engine')

module.exports = {
  name: 'retrend_rsi',
  description: 'Attempts to buy low and sell high by tracking RSI high-water readings.',

  getOptions: function () {
    this.option('period', 'period length, same as --period_length', String, '1m')
    this.option('period_length', 'period length, same as --period', String, '1m')
    this.option('min_periods', 'min. number of history periods', Number, 52)
    this.option('rsi_periods', 'number of RSI periods', Number, 5)
    this.option('max_buy_rsi', 'only buy when RSI is below this value', Number, 30)
    this.option('min_sell_rsi', 'will not sell when RSI is under this value', Number, 70)
    this.option('rsi_recover', 'allow RSI to recover this many points before buying', Number, 1)
    this.option('rsi_drop', 'allow RSI to fall this many points before selling', Number, 1)
    this.option('rsi_divisor', 'sell when RSI reaches high-water reading divided by this value', Number, 2)
	  this.option('flat_tolerance', 'Difference from when the price is considered to be rising or falling', Number, 1)
    this.option('flash_sale', 'if RSI is under this value, buy!', Number, 10)
    this.option('super_offer', 'if RSI is over this value, sell!', Number, 90)
  },

  calculate: function (s) {
    rsi(s, 'rsi', s.options.rsi_periods)
    
    if (s.period.rsi < s.options.flash_sale) {
      s.signal = 'buy'
      s.last_signal = 'buy'
      s.last_price = s.period.close
    } else if (s.period.rsi > s.options.super_offer) {
      s.signal = 'sell'
      s.last_signal = 'sell'
      s.last_price = s.period.close
    }
  },

  onPeriod: function (s, cb) {
    if (!s.in_preroll) {
      // calculate trend
      if (typeof s.period.rsi === 'number') {
   
        switch (s.trend) {
          case 'rising':
            if (s.period.rsi > s.lookback[0].rsi + s.options.flat_tolerance) {
              //maybe lookback[1] for rising/falling ?
              //still rising
              //keep calm! There is more!
            }
            if (s.period.rsi < s.lookback[0].rsi - s.options.flat_tolerance) {
              //from rising to down
              //time to sell
              if (s.lookback[0].rsi > s.options.min_sell_rsi) {
                // but only sell if RSI > min_sell_rsi
                if ((s.last_signal === 'sell' && s.last_price < s.period.close) || 
                     s.last_signal !== 'sell' ) {
                  // if last signal was sell, only sell at higher price
                  if (s.period.close - s.last_price)
                  s.signal = 'sell'
                  s.last_signal = 'sell'
                  s.last_price = s.period.close
                }
              }
              s.trend = 'down'
            }
            break
          case 'up':
            if (s.period.rsi > s.lookback[0].rsi + s.options.flat_tolerance) {
              //from up to rising
              s.trend = 'rising'
            } else if (s.period.rsi < s.lookback[0].rsi - s.options.flat_tolerance) {
              //from up to down
              s.trend = 'down'
            }
            break
          case 'down':
            if (s.period.rsi > s.lookback[0].rsi + s.options.flat_tolerance) {
              //from down to up
              s.trend = 'up'
            } else if (s.period.rsi < s.lookback[0].rsi - s.options.flat_tolerance) {
              //from down to falling
              s.trend = 'falling'
            }
            break
          case 'falling':
            if (s.period.rsi > s.lookback[0].rsi + s.options.flat_tolerance) {
              //from falling to up
              //time to buy
              if (s.lookback[0].rsi < s.options.max_buy_rsi) {
                // only buy if RSI < max_buy_rsi
                if ((s.last_signal === 'buy' && s.last_price > s.period.close) || 
                     s.last_signal !== 'buy' ) {
                  // if last signal was buy, only buy if cheaper
                  s.signal = 'buy'
                  s.last_signal = 'buy'
                  s.last_price = s.period.close
                }
              }
              s.trend = 'up'
            }
            if (s.period.rsi < s.lookback[0].rsi - s.options.flat_tolerance) {
              //still falling
              //keep calm!
            }
            break
          case 'flat':
          default:
            if (s.last_price === 'undefined')
              s.last_price = s.period.close
            if (s.last_signal === 'undefined')
              s.last_signal = 'sell'
            if (s.period.rsi > s.lookback[0].rsi + s.options.flat_tolerance) {
              s.trend = 'up'
            }
            if (s.period.rsi < s.lookback[0].rsi - s.options.flat_tolerance) {
              s.trend = 'down'
            }
            break
        }
      }
    }
    cb()
  },

  onReport: function (s) {
    var cols = []
    if (typeof s.period.rsi === 'number') {
      var color = 'grey'
      if (s.trend === 'falling' && s.period.rsi < s.options.max_buy_rsi ) {
        color = 'green'
      }
      if (s.trend === 'rising' && s.period.rsi > s.options.min_sell_rsi ) {
        color = 'red'
      }
      cols.push(z(4, n(s.period.rsi).format('0'), ' ')[color])
    }
    return cols
  },

  phenotypes: {
    // -- common
    period_length: Phenotypes.RangePeriod(1, 120, 'm'),
    min_periods: Phenotypes.Range(1, 200),
    markdown_buy_pct: Phenotypes.RangeFloat(-1, 5),
    markup_sell_pct: Phenotypes.RangeFloat(-1, 5),
    order_type: Phenotypes.ListOption(['maker', 'taker']),
    sell_stop_pct: Phenotypes.Range0(1, 50),
    buy_stop_pct: Phenotypes.Range0(1, 50),
    profit_stop_enable_pct: Phenotypes.Range0(1, 20),
    profit_stop_pct: Phenotypes.Range(1,20),

    // -- strategy
    rsi_periods: Phenotypes.Range(1, 200),
    oversold_rsi: Phenotypes.Range(1, 100),
    overbought_rsi: Phenotypes.Range(1, 100),
    rsi_recover: Phenotypes.Range(1, 100),
    rsi_drop: Phenotypes.Range(0, 100),
    rsi_divisor: Phenotypes.Range(1, 10)
  }
}

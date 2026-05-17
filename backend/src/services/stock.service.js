const YahooFinance = require('yahoo-finance2').default
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] })

async function getStockData(symbols) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const today = new Date()

  const results = await Promise.all(symbols.map(async (symbol) => {
    const [quote, summary, history] = await Promise.allSettled([
      yahooFinance.quote(symbol),
      yahooFinance.quoteSummary(symbol, { modules: ['assetProfile'] }),
      yahooFinance.historical(symbol, { period1: thirtyDaysAgo, period2: today, interval: '1d' }),
    ])

    const q = quote.status === 'fulfilled' ? quote.value : {}
    const profile = summary.status === 'fulfilled' ? summary.value?.assetProfile : {}
    const hist = history.status === 'fulfilled' ? history.value : []

    return {
      symbol: symbol.toUpperCase(),
      companyName: q.longName ?? q.shortName ?? symbol,
      sector: profile?.sector ?? null,
      industry: profile?.industry ?? null,
      description: profile?.longBusinessSummary ?? null,
      website: profile?.website ?? null,
      exchange: q.fullExchangeName ?? q.exchange ?? null,
      range52Week: q.fiftyTwoWeekLow && q.fiftyTwoWeekHigh
        ? `${q.fiftyTwoWeekLow} - ${q.fiftyTwoWeekHigh}`
        : null,
      price: q.regularMarketPrice ?? null,
      change: q.regularMarketChange ?? null,
      changePercent: q.regularMarketChangePercent ?? null,
      volume: q.regularMarketVolume ?? null,
      marketCap: q.marketCap ?? null,
      peRatio: q.trailingPE ?? null,
      eps: q.epsTrailingTwelveMonths ?? null,
      historicalPrices: hist.map((d) => ({
        date: d.date.toISOString().split('T')[0],
        price: d.close,
      })),
      source: 'Yahoo Finance',
    }
  }))

  return results
}

module.exports = { getStockData }

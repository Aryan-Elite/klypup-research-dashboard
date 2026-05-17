const YahooFinance = require('yahoo-finance2').default
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

const POSITIVE_WORDS = [
  'beat', 'beats', 'surge', 'surges', 'record', 'growth', 'profit', 'profits',
  'upgrade', 'upgraded', 'bullish', 'strong', 'gains', 'gain', 'rally', 'rallies',
  'outperform', 'exceeds', 'exceed', 'rises', 'rise', 'up', 'high', 'highest',
  'buy', 'positive', 'optimistic', 'boosts', 'boost', 'soars', 'soar', 'wins',
]

const NEGATIVE_WORDS = [
  'miss', 'misses', 'drop', 'drops', 'loss', 'losses', 'decline', 'declines',
  'downgrade', 'downgraded', 'bearish', 'weak', 'layoff', 'layoffs', 'lawsuit',
  'falls', 'fall', 'down', 'low', 'lowest', 'sell', 'negative', 'pessimistic',
  'cuts', 'cut', 'warns', 'warning', 'risk', 'concern', 'tumbles', 'tumble',
  'slump', 'slumps', 'disappoints', 'disappointing',
]

function classifySentiment(title) {
  const lower = title.toLowerCase()
  const words = lower.split(/\W+/)
  const pos = words.filter((w) => POSITIVE_WORDS.includes(w)).length
  const neg = words.filter((w) => NEGATIVE_WORDS.includes(w)).length
  if (pos > neg) return 'positive'
  if (neg > pos) return 'negative'
  return 'neutral'
}

async function getNewsSentiment(companies) {
  const results = await Promise.all(companies.map(async (company) => {
    try {
      const searchResult = await yahooFinance.search(company, {
        newsCount: 8,
        quotesCount: 1,
      })

      const symbol = searchResult.quotes?.[0]?.symbol ?? company.toUpperCase()
      const rawArticles = searchResult.news ?? []

      const articles = rawArticles.map((a) => ({
        title: a.title,
        publisher: a.publisher,
        link: a.link,
        publishedAt: a.providerPublishTime
          ? new Date(a.providerPublishTime * 1000).toISOString()
          : null,
        sentiment: classifySentiment(a.title ?? ''),
      }))

      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
      articles.forEach((a) => sentimentCounts[a.sentiment]++)

      const total = articles.length || 1
      const overallSentiment =
        sentimentCounts.positive >= sentimentCounts.negative &&
        sentimentCounts.positive >= sentimentCounts.neutral
          ? 'positive'
          : sentimentCounts.negative >= sentimentCounts.neutral
          ? 'negative'
          : 'neutral'

      const sentimentScore = parseFloat(
        (sentimentCounts.positive / total).toFixed(2)
      )

      return {
        company,
        symbol,
        overallSentiment,
        sentimentScore,
        articles,
        source: 'Yahoo Finance News',
      }
    } catch (err) {
      console.warn(`News fetch failed for ${company}:`, err.message)
      return {
        company,
        symbol: company.toUpperCase(),
        overallSentiment: 'neutral',
        sentimentScore: 0.5,
        articles: [],
        source: 'Yahoo Finance News',
      }
    }
  }))

  return results
}

module.exports = { getNewsSentiment }

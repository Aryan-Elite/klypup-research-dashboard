const tools = [
  {
    type: 'function',
    function: {
      name: 'get_stock_data',
      description: 'Get real-time stock price, financial metrics (P/E, EPS, market cap), and 30-day price history for one or more companies',
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'array',
            items: { type: 'string' },
            description: 'Stock ticker symbols e.g. ["NVDA", "AAPL"]',
          },
        },
        required: ['symbols'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_news_sentiment',
      description: 'Get recent news articles and overall market sentiment (positive/neutral/negative) for one or more companies',
      parameters: {
        type: 'object',
        properties: {
          companies: {
            type: 'array',
            items: { type: 'string' },
            description: 'Company names or ticker symbols e.g. ["NVIDIA", "Apple"]',
          },
        },
        required: ['companies'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_document_knowledge_base',
      description: 'Search earnings reports, 10-K/10-Q filings, and financial documents for specific companies',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query about financial filings or earnings',
          },
          companies: {
            type: 'array',
            items: { type: 'string' },
            description: 'Company names to filter documents by e.g. ["NVIDIA", "AMD"]',
          },
        },
        required: ['query'],
      },
    },
  },
]

module.exports = { tools }

const { getStockData } = require('../stock.service')
const { getNewsSentiment } = require('../news.service')
const { searchDocuments } = require('../vectorSearch.service')

async function executeTool(toolName, toolArgs) {
  switch (toolName) {
    case 'get_stock_data':
      return getStockData(toolArgs.symbols)
    case 'get_news_sentiment':
      return getNewsSentiment(toolArgs.companies)
    case 'search_document_knowledge_base':
      return searchDocuments(toolArgs.query, toolArgs.companies || [])
    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

module.exports = { executeTool }

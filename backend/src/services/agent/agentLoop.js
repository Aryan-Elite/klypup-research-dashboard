const { OpenAI } = require('openai')
const { tools } = require('./toolDefinitions')
const { executeTool } = require('./toolExecutor')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are an AI investment research analyst.
When the user asks about companies, stocks, or financial topics:
- Use get_stock_data to fetch real-time prices and financial metrics
- Use get_news_sentiment to fetch recent news and market sentiment
- Use search_document_knowledge_base to find relevant earnings/filing information
- Call multiple tools when needed — but ONLY tools relevant to the query
- Never call all 3 tools blindly — let the query guide which tools to use`

async function runAgent(query) {
  const startTime = Date.now()
  const toolsCalled = []
  let llmCalls = 0

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: query },
  ]

  while (true) {
    llmCalls++
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
    })

    const message = response.choices[0].message
    messages.push(message)

    if (!message.tool_calls || message.tool_calls.length === 0) break

    const toolResults = await Promise.all(
      message.tool_calls.map(async (tc) => {
        const args = JSON.parse(tc.function.arguments)
        toolsCalled.push(tc.function.name)
        const result = await executeTool(tc.function.name, args)
        return {
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        }
      })
    )

    messages.push(...toolResults)
  }

  messages.push({
    role: 'user',
    content: `Based on all the data above, produce a structured investment research report as JSON with exactly these keys:
{
  "summary": "2-3 sentence executive summary",
  "companies": [{ "symbol": "", "name": "", "sector": "" }],
  "financialMetrics": [{ "symbol": "", "companyName": "", "price": 0, "change": 0, "changePercent": 0, "marketCap": 0, "peRatio": 0, "eps": 0, "volume": 0, "range52Week": "", "source": "" }],
  "historicalPrices": [{ "symbol": "", "prices": [{ "date": "", "price": 0 }], "source": "" }],
  "newsSentiment": [{ "company": "", "symbol": "", "overallSentiment": "", "sentimentScore": 0, "articles": [], "source": "" }],
  "filingInsights": [{ "company": "", "insight": "", "source": "" }],
  "riskAssessment": { "level": "low|medium|high", "factors": [], "source": "" }
}`,
  })

  llmCalls++
  const synthesis = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(synthesis.choices[0].message.content)

  const allTools = ['get_stock_data', 'get_news_sentiment', 'search_document_knowledge_base']
  const toolsSkipped = allTools.filter((t) => !toolsCalled.includes(t))

  return {
    result,
    trace: {
      toolsCalled,
      toolsSkipped,
      llmCalls,
      durationMs: Date.now() - startTime,
    },
  }
}

module.exports = { runAgent }

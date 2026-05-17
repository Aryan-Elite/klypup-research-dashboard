# DECISIONS.md — Investment Research Dashboard

## 1. Why Option A?
Option A's AI output is qualitative research analysis — synthesizing news, financials, and filings into structured insights. This is exactly what LLMs do best. Option B required a concrete price recommendation (a number), which is harder for LLMs to get right and would need extra validation logic. Option A also maps directly to existing backend and AI orchestration skills (Node.js, LangChain concepts, RAG).

## 2. Why this tech stack?
- **Next.js**: Fast to build with, built-in routing, works well with shadcn/ui for a professional dark UI
- **Node.js + Express**: Primary strength — clean REST API, familiar patterns, huge npm ecosystem for financial tooling
- **MongoDB**: Flexible schema suited to storing varied JSON research results, easy org_id based multi-tenancy
- **OpenAI GPT-4o**: Best-in-class tool/function calling reliability. Parallel tool calls are rock solid. `gpt-4o-mini` during dev to save cost, `gpt-4o` for final demo
- **ChromaDB**: Proper vector store for RAG over SEC filings. Official Docker image, JS client available
- **Financial Modeling Prep**: 250 free requests/day, most complete free financial API (price, P/E, EPS, revenue, historical data)
- **GNews API**: 100 free requests/day, works on localhost (unlike NewsAPI free tier which blocks local dev)

**Alternatives considered:**
- Groq instead of OpenAI → rejected because GPT-4o has more reliable parallel tool calling for demo
- PostgreSQL instead of MongoDB → MongoDB chosen for flexible JSON result storage
- LangGraph instead of raw agentic loop → rejected as overkill for single-agent tool calling; raw loop is fully explainable line-by-line in Q&A

## 3. Multi-tenancy approach
Simple `orgId column + middleware filtering` pattern.
- Every model has an `orgId` field referencing the orgs collection
- `tenant.middleware.js` attaches `req.user.orgId` to every authenticated request
- Every DB query is scoped: `{ orgId: req.user.orgId }` — no exceptions
- Pattern chosen over schema-per-tenant because it's simpler to implement correctly in the given timeline and easier to explain in the interview

## 4. AI integration design
- **Agentic loop**: While loop — LLM decides which tools to call, your code executes them in parallel, results are fed back until LLM stops calling tools
- **Dynamic tool selection**: `tool_choice: "auto"` — if user asks only about news, the stock and filing tools are never called
- **Explicit synthesis**: After loop exits, a final LLM call with `response_format: json_object` forces clean structured JSON output
- **Source attribution**: Each tool bakes a `source` field into its result at the tool level — not added by the LLM later
- **Trace**: Every agent run returns `{ toolsCalled, toolsSkipped, llmCalls, durationMs }` shown in UI reasoning panel

## 5. Trade-offs for 3-4 day timeline
- Skipped SSE streaming (would add significant complexity for marginal UX gain)
- Skipped export to PDF/CSV (not in core rubric)
- Skipped CI/CD pipeline and unit tests (focused on working product)
- Pre-prepared 5 company documents manually instead of building a live ingestion pipeline from SEC EDGAR

## 6. What I would improve with 2 more weeks
- Add SSE streaming so users see AI analysis appear in real-time as tools return results
- Build a proper SEC EDGAR ingestion pipeline to automatically fetch and embed latest filings
- Add caching layer (Redis) for repeated stock/news queries to reduce API costs and latency
- Add unit tests for the agentic loop and integration tests for all API endpoints
- Add export to PDF feature for research reports

## 7. Hardest part
<!-- Fill in after completing the project -->

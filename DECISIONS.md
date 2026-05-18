# Decisions — Klypup Investment Research Dashboard

## 1. Which option did you choose and why?

Option A — Investment Research Dashboard.

Option A fits better with what I actually enjoy building: backend APIs, external data integrations, and AI pipelines with real data. The financial data angle (stock prices, earnings reports, news sentiment) is genuinely interesting to work with.

Option B required building a mock product catalog from scratch, five specialized agents that don't talk to real data, and a shopping flow with no meaningful external integrations. The setup cost was higher with less to show for it at demo time.

---

## 2. Why this tech stack? What alternatives did you consider?

**Next.js** — SSR + file-based routing + Tailwind colocation in one install. Considered plain React + Vite but rejected it: no SSR, more config overhead, not worth it for a 5-day build.

**Express** — lightweight, easy to split into routes/controllers/services, no ceremony. Considered NestJS but rejected it: too much boilerplate (decorators, modules, DI) for a project this size.

**MongoDB** — flexible schema for the `result` field, which is a deeply nested Mixed JSON that changes shape depending on which tools the AI called. A rigid relational schema would require migrations every time the AI output shape changed. Considered PostgreSQL with a JSONB column — viable but more friction.

**yahoo-finance2** — real-time stock data with no API key, works in Node, actively maintained. Started with Financial Modeling Prep (FMP) — broken for new free accounts post August 2025 (403 on every endpoint). Tried GNews for news — blocked on localhost on their free tier. Switched entirely to yahoo-finance2 for both stock data and news.

**ChromaDB** — Docker image + JS HTTP client, zero external accounts needed. Considered Pinecone (cloud-hosted, managed) but rejected it: requires a credit card for API access, adds a signup dependency the evaluator would need to resolve.

**OpenAI GPT-4o** — best structured tool calling support + `response_format: json_object` guarantees parseable output. Considered Anthropic Claude — solid tool calling but less reliable structured JSON output at the time of build. `gpt-4o-mini` by default to keep costs low; swap via `OPENAI_MODEL=gpt-4o` in `.env`.

---

## 3. How did you approach multi-tenancy?

Pattern used: **shared schema with `orgId` column on every model** (not schema-per-tenant or database-per-tenant).

Every model — `User`, `Report`, `Watchlist` — has an `orgId` field. Every MongoDB query is filtered by `{ orgId: req.user.orgId }`. There are no exceptions to this rule.

The JWT payload carries `{ userId, orgId, role }`. Auth middleware decodes the token and attaches these to `req.user` on every request. No extra database lookup per request to resolve the tenant.

RBAC sits on top: `requireRole('admin')` middleware guards admin-only routes. The analyst role cannot reach `GET /api/org/members`. For report deletion, analysts can only delete their own reports — enforced in the controller by adding `userId` to the filter when role is not admin.

Why not schema-per-tenant: overkill for this scale. Schema-per-tenant adds operational complexity (dynamic connection pooling, migrations per tenant) that isn't justified when a simple `orgId` filter gives the same isolation guarantee.

---

## 4. How did you design the AI integration?

The agent is a while loop. GPT-4o decides which tools to call — we never hardcode the sequence.

```
messages = [system prompt, user query]

while true:
  call GPT-4o with messages + tool definitions
  if LLM returns tool_calls:
    run ALL tool calls in parallel via Promise.all
    append results to messages
    loop
  else:
    break

call GPT-4o again with response_format: json_object for synthesis
```

**Prompt engineering decisions:**

- System prompt tells GPT-4o to use tools only when relevant to the query — "never call all three blindly." A price question only triggers `get_stock_data`. An earnings question triggers all three.
- `tool_choice: 'auto'` lets the model decide. No forcing, no hardcoding.
- Parallel execution via `Promise.all` — reduces latency from ~60s sequential to ~20s parallel.
- Synthesis uses `response_format: { type: 'json_object' }` with an explicit JSON schema in the prompt. This guarantees the output is parseable without try/catch gymnastics.
- Source attribution is baked into every tool result at the service level (e.g., `source: "Yahoo Finance"`). It's not added at synthesis time — prevents GPT-4o from hallucinating sources.

---

## 5. What trade-offs did you make for the 5-day timeline?

**News sentiment — keyword matching instead of LLM classification.** Fast, zero-cost, and good enough for demo. Each article headline is scored against a list of positive/negative keywords. Production would use a dedicated sentiment model.

**ChromaDB pre-seeded for 5 companies only.** The seed script loads earnings documents for NVIDIA, Apple, Tesla, AMD, and Microsoft. A production system would auto-fetch filings from SEC EDGAR per queried ticker.

**No streaming.** The full AI response returns at once — users wait 15–30 seconds. The loading state shows a progress message. Production would use SSE or WebSockets to stream tokens as they generate.

**No unit tests.** All testing was done end-to-end manually (curl + browser). Each service was verified in isolation before being wired into the agent.

**No caching.** Repeated queries for the same ticker hit Yahoo Finance every time. Production would cache stock data in Redis with a 5-minute TTL.

---

## 6. What would you improve with 2 more weeks?

- **SEC EDGAR integration** — auto-fetch 10-K and 10-Q filings for any ticker the user queries, not just the 5 pre-seeded companies. ChromaDB would grow dynamically.
- **LLM-based sentiment analysis** — replace keyword matching with a dedicated sentiment model or a GPT-4o-mini call per article. More accurate, especially for ambiguous headlines.
- **SSE streaming** — stream the AI synthesis token-by-token to the frontend. The 15-30 second blank loading period is the worst UX issue in the current build.
- **Managed vector store** — swap ChromaDB for Pinecone or Weaviate Cloud so the vector DB doesn't need to run as a local container. Reduces cold-start issues in production.
- **Redis caching** — cache stock quotes and news results with a short TTL. Repeated queries for popular tickers (NVDA, AAPL) shouldn't hit external APIs every time.
- **PDF export** — let users export a research report as a formatted PDF for sharing with stakeholders.

---

## 7. What was the hardest part?

Two things tied for first.

**yahoo-finance2 API quirks.** The package isn't used like a typical npm module — it requires instantiation with `{ suppressNotices: ['yahooSurvey'] }` to suppress noisy warnings, and the `historical()` API returns `adjclose` instead of `close` for adjusted prices. The field names differ from the documentation. Solved by reading the package source directly and testing each method in isolation before wiring into the agent.

**ChromaDB JS client v3 API change.** The client throws a `DefaultEmbeddingFunction` error when creating a collection even if you intend to supply your own embeddings. The v3 client changed how it handles the embedding function parameter. Solved by not specifying `embeddingFunction` at all during collection creation and always supplying pre-computed OpenAI embeddings manually in every `collection.add()` call. The warning about DefaultEmbeddingFunction on `collection.get()` is harmless and can be ignored.

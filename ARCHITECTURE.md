# Architecture Document — Investment Research Dashboard

> Diagrams to be added using Mermaid on Day 4. Sections outlined below.

## 1. System Architecture Diagram
<!-- Mermaid diagram: frontend ↔ backend ↔ MongoDB ↔ ChromaDB ↔ FMP API ↔ GNews API ↔ OpenAI -->

## 2. Data Flow Diagram
<!-- Trace: UI query input → POST /research/query → auth middleware → tenant middleware → agentLoop → tool calls → DB save → structured JSON response → UI components rendered -->

## 3. Database Schema / ER Diagram
```
users
  _id, email, passwordHash, role (admin|analyst), orgId (ref: orgs), createdAt

orgs
  _id, name, inviteCode, createdAt

reports
  _id, userId (ref: users), orgId (ref: orgs), query, title,
  result (JSON), tags (string[]), createdAt

watchlist
  _id, userId (ref: users), orgId (ref: orgs), symbol, companyName, addedAt
```

## 4. AI Orchestration Flow
```
User Query
    ↓
messages = [system prompt, user query]
    ↓
WHILE LOOP:
  → Call GPT-4o (tool_choice: auto)
  → If tool_calls returned:
      - Execute ALL tools in PARALLEL (Promise.all)
      - Append results to messages
      - Loop again
  → If no tool_calls: EXIT LOOP
    ↓
SYNTHESIS CALL:
  → Append "synthesize into JSON" instruction
  → Call GPT-4o with response_format: json_object
  → Parse clean JSON
    ↓
Return { result, trace }
```

**3 Tools:**
- `get_stock_data` → Financial Modeling Prep API
- `get_news_sentiment` → GNews API
- `search_document_knowledge_base` → ChromaDB vector store

## 5. Multi-Tenant Data Flow
```
HTTP Request
    ↓
auth.middleware  → verify JWT → attach req.user { userId, orgId, role }
    ↓
tenant.middleware → every DB query scoped to { orgId: req.user.orgId }
    ↓
MongoDB query:  Report.find({ orgId: req.user.orgId, ... })
                         ↑
                 Org A's data never returned to Org B user
```

## 6. API Design

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | None | Create user + org |
| POST | /api/auth/login | None | Returns JWT |
| POST | /api/auth/logout | JWT | Invalidate session |
| POST | /api/org/create | JWT | Create new org |
| POST | /api/org/join | JWT | Join org via invite code |
| POST | /api/research/query | JWT | Run agentic research, save report |
| GET | /api/research/history | JWT | List all org reports |
| GET | /api/research/:id | JWT | Get single report |
| PUT | /api/research/:id | JWT | Update tags/title |
| DELETE | /api/research/:id | JWT | Delete report |
| POST | /api/watchlist | JWT | Add company to watchlist |
| GET | /api/watchlist | JWT | List watchlist |
| DELETE | /api/watchlist/:symbol | JWT | Remove from watchlist |

# Architecture — Klypup Investment Research Dashboard

## 1. System Architecture

Three layers: Next.js frontend, Node/Express backend, and three data stores. The browser never calls the AI directly — everything goes through the backend API.

```mermaid
graph TD
    Browser["Browser\nNext.js 16"]

    subgraph Docker["Docker Compose (local)"]
        FE["Frontend :3000\nNext.js"]
        BE["Backend :5000\nExpress"]
        CH["ChromaDB :8000\nVector Store"]
    end

    Atlas["MongoDB Atlas\n(cloud DB)"]
    OpenAI["OpenAI API\ngpt-4o-mini"]
    Yahoo["Yahoo Finance\nyahoo-finance2 npm"]

    Browser --> FE
    FE -->|"REST /api/*"| BE
    BE --> Atlas
    BE --> CH
    BE --> OpenAI
    BE --> Yahoo
```

---

## 2. Request → Response Data Flow

How a research query travels through the full system — from typing to rendered results:

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend
    participant MW as Auth Middleware
    participant BE as Research Controller
    participant Agent as GPT-4o Agent Loop
    participant Tools as Tool Services
    participant DB as MongoDB Atlas

    U->>FE: Types query, clicks Analyze
    FE->>MW: POST /api/research/query + JWT
    MW->>MW: Verify JWT → attach userId, orgId, role
    MW->>BE: req.user populated
    BE->>Agent: runAgent(query)

    Agent->>Agent: GPT-4o decides which tools to call
    Agent->>Tools: Promise.all — run selected tools in parallel
    Tools-->>Agent: Stock data + News + Filing chunks
    Agent->>Agent: GPT-4o synthesizes → structured JSON

    Agent-->>BE: result + trace
    BE->>DB: Report.create scoped to orgId
    BE-->>FE: reportId + result + trace
    FE-->>U: Cards, chart, sentiment badges, filing insights
```

---

## 3. AI Agent Orchestration

The agent is a while loop — GPT-4o decides which tools to call, runs them in parallel, then synthesizes everything into a structured JSON report.

```mermaid
flowchart TD
    Q["User Query"] --> LOOP["GPT-4o\ntool_choice: auto"]

    LOOP -->|"calls tools"| PA["Promise.all\nrun in parallel"]
    PA --> T1["get_stock_data\n→ Yahoo Finance\nprice, P/E, EPS, 30-day history"]
    PA --> T2["get_news_sentiment\n→ Yahoo Finance News\narticles + keyword sentiment"]
    PA --> T3["search_document_knowledge_base\n→ ChromaDB\npre-seeded earnings docs"]

    T1 --> RESULTS["Tool results appended to messages"]
    T2 --> RESULTS
    T3 --> RESULTS

    RESULTS --> LOOP
    LOOP -->|"no more tool calls"| SYN["Synthesis call\nresponse_format: json_object"]

    SYN --> OUT["Structured JSON\nsummary · financialMetrics\nhistoricalPrices · newsSentiment\nfilingInsights · riskAssessment"]
```

**Key point:** `tool_choice: 'auto'` means GPT-4o decides. A simple price query only calls `get_stock_data`. An earnings question calls all three. Tools are never hardcoded.

---

## 4. Database Schema

```mermaid
erDiagram
    Org {
        ObjectId _id PK
        string name
        string inviteCode UK
        date createdAt
    }

    User {
        ObjectId _id PK
        string email UK
        string passwordHash
        string role
        ObjectId orgId FK
        date createdAt
    }

    Report {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId orgId FK
        string query
        string title
        Mixed result
        string[] tags
        Mixed trace
        date createdAt
    }

    Watchlist {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId orgId FK
        string symbol
        string companyName
        date addedAt
    }

    Org ||--o{ User : "has many"
    Org ||--o{ Report : "owns"
    Org ||--o{ Watchlist : "owns"
    User ||--o{ Report : "creates"
    User ||--o{ Watchlist : "manages"
```

`role` is `admin` or `analyst`. Every DB query on reports and watchlist is always filtered by `orgId`.

---

## 5. Multi-Tenant Data Isolation

Every request resolves the tenant from the JWT and scopes all DB queries to that org. Org A data never reaches Org B.

```mermaid
flowchart LR
    REQ["HTTP Request\n+ Bearer JWT"] --> AUTH["auth.middleware.js\nverify + decode token"]
    AUTH --> USER["req.user =\n{ userId, orgId, role }"]
    USER --> RBAC{"admin-only\nroute?"}
    RBAC -->|"yes"| CHECK["rbac.middleware.js\nrole !== admin → 403"]
    RBAC -->|"no"| CTRL["Controller"]
    CHECK -->|"role ok"| CTRL
    CTRL --> QUERY["Every MongoDB query:\n{ orgId: req.user.orgId }"]
    QUERY --> RES["Response contains\nonly this org's data"]
```

**RBAC enforced:**
- `GET /api/org/members` → admin only (analysts get 403)
- `DELETE /api/research/:id` → analyst can only delete their own reports; admin can delete any

---

## 6. API Reference

| Method | Endpoint | Auth | Role | What it does |
|--------|----------|------|------|--------------|
| POST | `/api/auth/signup` | ❌ | — | Create account + org, returns JWT |
| POST | `/api/auth/login` | ❌ | — | Login, returns JWT |
| POST | `/api/org/join` | ❌ | — | Join existing org via invite code, returns JWT |
| GET | `/api/org/me` | ✅ | any | Get current org details |
| GET | `/api/org/members` | ✅ | admin | List all members + invite code |
| POST | `/api/research/query` | ✅ | any | Run AI agent, save + return report |
| GET | `/api/research/history` | ✅ | any | List org reports (supports `?search=`) |
| GET | `/api/research/:id` | ✅ | any | Get single report (org-scoped) |
| PUT | `/api/research/:id` | ✅ | any | Update report title or tags |
| DELETE | `/api/research/:id` | ✅ | any* | Delete report (* analyst: own only) |
| POST | `/api/watchlist` | ✅ | any | Add company to watchlist |
| GET | `/api/watchlist` | ✅ | any | Get watchlist |
| DELETE | `/api/watchlist/:symbol` | ✅ | any | Remove company from watchlist |
| GET | `/api/health` | ❌ | — | Health check |

**Response shape:**
```json
// Success examples
{ "token": "...", "user": { "email": "", "role": "admin" }, "org": { "name": "", "inviteCode": "" } }
{ "report": { "_id": "", "query": "", "result": {}, "trace": {} } }
{ "reports": [ { "_id": "", "title": "", "tags": [], "createdAt": "" } ] }

// Error
{ "error": "descriptive message" }
```

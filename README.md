# Investment Research Dashboard — Klypup Applied AI Intern Assessment

## Option Chosen
**Option A: Investment Research Dashboard**

Chosen because the AI's job (synthesizing qualitative financial research) is naturally suited to LLMs, the agentic tool orchestration is clean and explainable, and all outputs are qualitative analysis — no risk of wrong numerical outputs.

## Tech Stack
| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js + Tailwind + shadcn/ui | Fast to build, professional dark UI |
| Backend | Node.js + Express | Primary strength, clean REST API |
| Database | MongoDB | Flexible schema, easy multi-tenant with orgId |
| AI/LLM | OpenAI GPT-4o | Best-in-class tool calling, reliable structured output |
| Vector DB | ChromaDB | Proper RAG for SEC filings/earnings docs |
| Stock Data | Financial Modeling Prep API | 250 free req/day, comprehensive financial data |
| News | GNews API | 100 free req/day, works on localhost |
| Containers | Docker Compose | One-command setup |

## Setup Instructions

### Prerequisites
- Docker + Docker Compose installed
- Node.js 20+ (for running seed scripts locally)

### 1. Clone and configure
```bash
git clone <repo-url>
cd klypup-research-dashboard
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Required API keys (.env)
```
OPENAI_API_KEY=your_openai_key
FMP_API_KEY=your_fmp_key         # financialmodelingprep.com — free tier
GNEWS_API_KEY=your_gnews_key     # gnews.io — free tier
JWT_SECRET=any_random_string
```

### 3. Start everything
```bash
docker-compose up --build
```

### 4. Seed the database
```bash
# In a new terminal (after containers are up)
cd backend
npm run seed:docs    # chunks + embeds company docs into ChromaDB
npm run seed:data    # creates 2 orgs, 4 users, sample reports
```

### 5. Open the app
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Demo accounts (after seeding)
| Email | Password | Org | Role |
|-------|----------|-----|------|
| admin@alpha.com | password123 | Alpha Capital | Admin |
| analyst@alpha.com | password123 | Alpha Capital | Analyst |
| admin@beta.com | password123 | Beta Research | Admin |
| analyst@beta.com | password123 | Beta Research | Analyst |

## Screenshots
<!-- Added after UI is built -->

## Known Limitations
<!-- Added at end of project -->

# CLAUDE.md — klypup-research-dashboard

## Project
Klypup Applied AI Intern Assessment — Option A: Investment Research Dashboard
Stack: Next.js + Node.js/Express + MongoDB + ChromaDB + OpenAI GPT-4o
Location: /home/aryan-gupta/DevSpace/klypup-research-dashboard

## Design Principles
- Keep code simple — college-level, no over-engineering or heavy abstractions
- Do ONE atomic step at a time, wait for user approval before next step
- No comments unless the WHY is non-obvious
- No unnecessary features beyond what the task requires
- Working product over perfection — 80% features working beats broken 100%

## AI Agent Rules
- The LLM DECIDES which tools to call — never hardcode the tool call sequence
- All tool results must include a `source` field baked in at the tool level
- Always use `response_format: { type: "json_object" }` on the synthesis call
- `gpt-4o-mini` for dev, `gpt-4o` for final demo (via OPENAI_MODEL env var)
- Agentic loop lives in: backend/src/services/agent/agentLoop.js

## Multi-Tenancy Rules (hard rules, never break these)
- Every DB query must be scoped: `{ orgId: req.user.orgId }`
- Never query MongoDB without orgId filter
- RBAC: admin-only routes must use `requireRole('admin')` middleware
- Tenant isolation is tested in demo — Org A data must never leak to Org B

## File Conventions
- Routes: routing only, call controller
- Controllers: validate input → call service → return response
- Services: business logic and external API calls
- Models: Mongoose schema only, no business logic

## UI Design Reference
- Dark theme: bg-zinc-950 background, bg-zinc-900 cards, border-zinc-800
- Price up: text-green-500, Price down: text-red-500
- Target look: Perplexity Finance card style (information-dense, clean)
- Charts: Recharts AreaChart with green gradient fill for stock prices

## Plan Sync
After every major decision or completed day, update the plan file at:
/home/aryan-gupta/.claude/plans/home-aryan-gupta-downloads-klypup-appli-witty-reddy.md

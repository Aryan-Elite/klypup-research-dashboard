require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const User = require('../src/models/User')
const Org = require('../src/models/Org')
const Report = require('../src/models/Report')

function generatePriceHistory(basePrice, daysAgo = 0) {
  const prices = []
  let price = basePrice * 0.92
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i - daysAgo)
    price = price * (1 + (Math.random() - 0.47) * 0.025)
    prices.push({ date: date.toISOString().split('T')[0], price: parseFloat(price.toFixed(2)) })
  }
  prices[prices.length - 1].price = basePrice
  return prices
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB\n')

  const SEED_EMAILS = ['admin@meridian.com', 'analyst@meridian.com', 'admin@vertex.com']
  const SEED_INVITE_CODES = ['MERIDIAN2025', 'VERTEX2025']

  const oldOrgs = await Org.find({ inviteCode: { $in: SEED_INVITE_CODES } })
  const oldOrgIds = oldOrgs.map((o) => o._id)
  await Report.deleteMany({ orgId: { $in: oldOrgIds } })
  await User.deleteMany({ email: { $in: SEED_EMAILS } })
  await Org.deleteMany({ inviteCode: { $in: SEED_INVITE_CODES } })
  console.log('Cleaned up previous seed data')

  const passwordHash = await bcrypt.hash('Demo1234!', 10)

  // ── Orgs ──────────────────────────────────────────────────────────────────
  const orgA = await Org.create({ name: 'Meridian Capital', inviteCode: 'MERIDIAN2025' })
  const orgB = await Org.create({ name: 'Vertex Analytics', inviteCode: 'VERTEX2025' })

  // ── Users ─────────────────────────────────────────────────────────────────
  const adminA   = await User.create({ email: 'admin@meridian.com',   passwordHash, role: 'admin',   orgId: orgA._id })
  const analystA = await User.create({ email: 'analyst@meridian.com', passwordHash, role: 'analyst', orgId: orgA._id })
  const adminB   = await User.create({ email: 'admin@vertex.com',     passwordHash, role: 'admin',   orgId: orgB._id })

  // ── Helpers ───────────────────────────────────────────────────────────────
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d }

  // ── Report 1 (Org A, admin) ───────────────────────────────────────────────
  // All 3 tools called — NVDA vs AMD — matches PDF example query
  await Report.create({
    userId: adminA._id,
    orgId: orgA._id,
    query: "Analyze NVIDIA's Q3 2024 earnings report. Compare revenue growth with AMD. Summarize competitive threats and recent news sentiment. Provide a risk assessment based on current market conditions.",
    title: "Analyze NVIDIA's Q3 2024 earnings report. Compare revenue growth with AM...",
    tags: ['Q3 Earnings', 'Semiconductor', 'Competitor Analysis'],
    createdAt: daysAgo(2),
    trace: {
      toolsCalled: ['get_stock_data', 'get_news_sentiment', 'search_document_knowledge_base'],
      toolsSkipped: [],
      llmCalls: 3,
      durationMs: 24810,
    },
    result: {
      summary: "NVIDIA delivered a landmark Q3 FY2025, with data center revenue surging 112% YoY to $30.8B driven by explosive Hopper GPU demand. AMD posted solid results with MI300X gaining traction in the AI accelerator market, but remains significantly behind NVIDIA's scale and ecosystem. Market sentiment is strongly positive for NVIDIA while AMD faces near-term execution risk on its ramp.",
      companies: [
        { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
        { symbol: 'AMD',  name: 'Advanced Micro Devices', sector: 'Technology' },
      ],
      financialMetrics: [
        {
          symbol: 'NVDA', companyName: 'NVIDIA Corporation',
          price: 137.42, change: 4.18, changePercent: 3.13,
          marketCap: 3370000000000, peRatio: 53.2, eps: 2.58,
          volume: 312450000, range52Week: '$47.32 – $153.13',
          source: 'Yahoo Finance',
        },
        {
          symbol: 'AMD', companyName: 'Advanced Micro Devices',
          price: 107.64, change: -1.92, changePercent: -1.75,
          marketCap: 174600000000, peRatio: 44.8, eps: 2.40,
          volume: 58320000, range52Week: '$76.52 – $227.30',
          source: 'Yahoo Finance',
        },
      ],
      historicalPrices: [
        { symbol: 'NVDA', prices: generatePriceHistory(137.42), source: 'Yahoo Finance' },
        { symbol: 'AMD',  prices: generatePriceHistory(107.64), source: 'Yahoo Finance' },
      ],
      newsSentiment: [
        {
          company: 'NVIDIA', symbol: 'NVDA',
          overallSentiment: 'positive', sentimentScore: 0.82,
          articles: [
            { title: "NVIDIA Smashes Q3 Estimates as Data Center Revenue Hits Record $30.8B", link: 'https://finance.yahoo.com/quote/NVDA/news/', publishedAt: daysAgo(3).toISOString(), sentiment: 'positive' },
            { title: "Jensen Huang: Blackwell Demand is 'Insane' — Production Ramping Ahead of Schedule", link: 'https://finance.yahoo.com/quote/NVDA/news/', publishedAt: daysAgo(5).toISOString(), sentiment: 'positive' },
            { title: "NVIDIA Faces Export Control Scrutiny on H20 Chips Destined for China", link: 'https://finance.yahoo.com/quote/NVDA/news/', publishedAt: daysAgo(8).toISOString(), sentiment: 'negative' },
            { title: "Analysts Raise NVDA Price Targets to $200 Following Blowout Quarter", link: 'https://finance.yahoo.com/quote/NVDA/news/', publishedAt: daysAgo(10).toISOString(), sentiment: 'positive' },
          ],
          source: 'Yahoo Finance News',
        },
        {
          company: 'AMD', symbol: 'AMD',
          overallSentiment: 'neutral', sentimentScore: 0.41,
          articles: [
            { title: "AMD MI300X Wins Key Cloud Contracts as AI Chip Race Intensifies", link: 'https://finance.yahoo.com/quote/AMD/news/', publishedAt: daysAgo(4).toISOString(), sentiment: 'positive' },
            { title: "AMD Q3 Revenue Misses High-End Estimates; Data Center Growth Slower Than Peers", link: 'https://finance.yahoo.com/quote/AMD/news/', publishedAt: daysAgo(7).toISOString(), sentiment: 'negative' },
            { title: "AMD Cuts PC CPU Prices as Intel Regains Ground in Consumer Market", link: 'https://finance.yahoo.com/quote/AMD/news/', publishedAt: daysAgo(12).toISOString(), sentiment: 'negative' },
          ],
          source: 'Yahoo Finance News',
        },
      ],
      filingInsights: [
        {
          company: 'NVIDIA',
          insight: "Q3 FY2025 data center revenue reached $30.8B, up 112% YoY. CEO Jensen Huang stated Blackwell GPU production is ramping and demand 'far exceeds supply' heading into Q4. Gross margin expanded to 74.6%, reflecting strong pricing power in the AI accelerator market.",
          source: 'NVIDIA Q3 FY2025 Earnings Report',
        },
        {
          company: 'AMD',
          insight: "AMD Q3 2024 data center segment revenue grew 122% YoY to $3.5B, driven by MI300X GPU adoption. However, client segment revenue declined 26% sequentially. Management guided Q4 data center revenue of $5B+, contingent on production ramp of next-gen MI325X.",
          source: 'AMD Q3 2024 Earnings Report',
        },
        {
          company: 'NVIDIA',
          insight: "NVIDIA's networking revenue (InfiniBand + Ethernet) reached $3.1B in Q3, underscoring that the company's moat extends beyond GPUs to full-stack AI infrastructure including interconnects, software (CUDA ecosystem), and cloud partnerships with all hyperscalers.",
          source: 'NVIDIA Q3 FY2025 Earnings Report',
        },
      ],
      riskAssessment: {
        level: 'high',
        factors: [
          'US export controls on advanced AI chips to China could reduce NVIDIA addressable market by ~15%',
          'AMD MI300X ramp poses competitive threat in cloud inference workloads — pricing pressure likely in 2025',
          'Both companies trade at premium valuations (NVDA 53x P/E, AMD 45x P/E) leaving little margin for execution miss',
          'Geopolitical tensions around Taiwan semiconductor supply chain remain a systemic risk',
          'Customer concentration: hyperscalers (Microsoft, Google, Amazon, Meta) account for ~50% of NVDA data center revenue',
        ],
        source: 'AI Analysis — Yahoo Finance + Earnings Reports',
      },
    },
  })

  // ── Report 2 (Org A, analyst) ─────────────────────────────────────────────
  // Stock + news only (docs skipped) — TSLA — matches PDF example query
  await Report.create({
    userId: analystA._id,
    orgId: orgA._id,
    query: "Give me a quick overview of Tesla — stock performance this quarter, any major news in the last 30 days, and key risks.",
    title: "Give me a quick overview of Tesla — stock performance this quarter, any ...",
    tags: ['Quick Overview', 'EV Sector'],
    createdAt: daysAgo(1),
    trace: {
      toolsCalled: ['get_stock_data', 'get_news_sentiment'],
      toolsSkipped: ['search_document_knowledge_base'],
      llmCalls: 2,
      durationMs: 16340,
    },
    result: {
      summary: "Tesla stock has surged ~38% this quarter, outperforming the broader market, driven by optimism around Full Self-Driving (FSD) licensing deals and renewed investor confidence following a strong Q3 delivery beat. Near-term risks include margin pressure from ongoing price cuts and rising competition from BYD in key international markets.",
      companies: [
        { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Consumer Cyclical' },
      ],
      financialMetrics: [
        {
          symbol: 'TSLA', companyName: 'Tesla, Inc.',
          price: 342.69, change: 12.84, changePercent: 3.89,
          marketCap: 1102000000000, peRatio: 116.4, eps: 2.95,
          volume: 124580000, range52Week: '$138.80 – $488.54',
          source: 'Yahoo Finance',
        },
      ],
      historicalPrices: [
        { symbol: 'TSLA', prices: generatePriceHistory(342.69), source: 'Yahoo Finance' },
      ],
      newsSentiment: [
        {
          company: 'Tesla', symbol: 'TSLA',
          overallSentiment: 'positive', sentimentScore: 0.67,
          articles: [
            { title: "Tesla Q3 Deliveries Beat Estimates at 462,890 — Stock Jumps 8% After-Hours", link: 'https://finance.yahoo.com/quote/TSLA/news/', publishedAt: daysAgo(6).toISOString(), sentiment: 'positive' },
            { title: "Elon Musk Says FSD Will Be Licensed to Other Automakers — Potential $10B Revenue Stream", link: 'https://finance.yahoo.com/quote/TSLA/news/', publishedAt: daysAgo(9).toISOString(), sentiment: 'positive' },
            { title: "Tesla Cuts Model 3 and Model Y Prices in Europe Amid Weakening Demand", link: 'https://finance.yahoo.com/quote/TSLA/news/', publishedAt: daysAgo(14).toISOString(), sentiment: 'negative' },
            { title: "Tesla Cybertruck Production Reaches 1,000 Units/Week — Still Significantly Below Plan", link: 'https://finance.yahoo.com/quote/TSLA/news/', publishedAt: daysAgo(18).toISOString(), sentiment: 'neutral' },
            { title: "BYD Outsells Tesla in Europe for First Time — EV Competition Intensifies", link: 'https://finance.yahoo.com/quote/TSLA/news/', publishedAt: daysAgo(22).toISOString(), sentiment: 'negative' },
          ],
          source: 'Yahoo Finance News',
        },
      ],
      filingInsights: [],
      riskAssessment: {
        level: 'medium',
        factors: [
          'Ongoing price cuts to defend market share are compressing automotive gross margins (now ~14%, down from 26% peak)',
          'BYD and other Chinese EV makers gaining share in Europe and Southeast Asia — key growth markets for Tesla',
          'Premium valuation (116x P/E) requires sustained high growth — any delivery miss could trigger sharp correction',
          'Elon Musk\'s divided attention across Tesla, SpaceX, and xAI creates execution and governance risk',
        ],
        source: 'AI Analysis — Yahoo Finance',
      },
    },
  })

  // ── Report 3 (Org A, admin) ───────────────────────────────────────────────
  // All 3 tools — AAPL vs MSFT
  await Report.create({
    userId: adminA._id,
    orgId: orgA._id,
    query: "Compare Apple and Microsoft revenue growth this quarter. Which has stronger fundamentals for long-term investment?",
    title: "Compare Apple and Microsoft revenue growth this quarter. Which has strong...",
    tags: ['Tech Giants', 'Q1 Earnings'],
    createdAt: daysAgo(4),
    trace: {
      toolsCalled: ['get_stock_data', 'get_news_sentiment', 'search_document_knowledge_base'],
      toolsSkipped: [],
      llmCalls: 3,
      durationMs: 28150,
    },
    result: {
      summary: "Microsoft holds stronger near-term growth fundamentals driven by Azure cloud revenue growing 33% YoY and Copilot AI monetization beginning to scale. Apple's revenue growth is more modest at 6% YoY, constrained by iPhone upgrade cycles, but its $95B services segment provides exceptional recurring cash flows with 75%+ gross margins. Both are high-quality compounders — Microsoft is the growth pick, Apple is the quality/stability pick.",
      companies: [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
      ],
      financialMetrics: [
        {
          symbol: 'AAPL', companyName: 'Apple Inc.',
          price: 211.45, change: -0.83, changePercent: -0.39,
          marketCap: 3190000000000, peRatio: 33.8, eps: 6.25,
          volume: 48920000, range52Week: '$164.08 – $237.49',
          source: 'Yahoo Finance',
        },
        {
          symbol: 'MSFT', companyName: 'Microsoft Corporation',
          price: 424.37, change: 3.62, changePercent: 0.86,
          marketCap: 3150000000000, peRatio: 36.1, eps: 11.75,
          volume: 22140000, range52Week: '$362.90 – $468.35',
          source: 'Yahoo Finance',
        },
      ],
      historicalPrices: [
        { symbol: 'AAPL', prices: generatePriceHistory(211.45), source: 'Yahoo Finance' },
        { symbol: 'MSFT', prices: generatePriceHistory(424.37), source: 'Yahoo Finance' },
      ],
      newsSentiment: [
        {
          company: 'Apple', symbol: 'AAPL',
          overallSentiment: 'neutral', sentimentScore: 0.52,
          articles: [
            { title: "Apple Intelligence Features Roll Out to iPhone 16 — Early User Reception Mixed", link: 'https://finance.yahoo.com/quote/AAPL/news/', publishedAt: daysAgo(5).toISOString(), sentiment: 'neutral' },
            { title: "Apple Services Revenue Hits $24.2B in Q4 — Record High, Up 12% YoY", link: 'https://finance.yahoo.com/quote/AAPL/news/', publishedAt: daysAgo(8).toISOString(), sentiment: 'positive' },
            { title: "iPhone 16 Sales in China Disappoint as Huawei Mate 60 Gains Traction", link: 'https://finance.yahoo.com/quote/AAPL/news/', publishedAt: daysAgo(15).toISOString(), sentiment: 'negative' },
          ],
          source: 'Yahoo Finance News',
        },
        {
          company: 'Microsoft', symbol: 'MSFT',
          overallSentiment: 'positive', sentimentScore: 0.74,
          articles: [
            { title: "Microsoft Azure Revenue Grows 33% — AI Services Now $10B Annualized Run Rate", link: 'https://finance.yahoo.com/quote/MSFT/news/', publishedAt: daysAgo(4).toISOString(), sentiment: 'positive' },
            { title: "Microsoft Copilot Reaches 1M Paid Enterprise Seats — Monetization Accelerating", link: 'https://finance.yahoo.com/quote/MSFT/news/', publishedAt: daysAgo(7).toISOString(), sentiment: 'positive' },
            { title: "EU Opens Investigation into Microsoft-OpenAI Partnership Over Competition Concerns", link: 'https://finance.yahoo.com/quote/MSFT/news/', publishedAt: daysAgo(20).toISOString(), sentiment: 'negative' },
          ],
          source: 'Yahoo Finance News',
        },
      ],
      filingInsights: [
        {
          company: 'Apple',
          insight: "Apple FY2024 total revenue reached $391B, up 2% YoY. Services segment grew 13% to $96.2B with gross margins of 74%, becoming the company's highest-margin business. iPhone revenue was flat at $201B. CEO Tim Cook emphasized Apple Intelligence as a 'generational opportunity' to drive upgrade cycles in FY2025.",
          source: 'Apple FY2024 Annual Results',
        },
        {
          company: 'Microsoft',
          insight: "Microsoft Q1 FY2025 revenue grew 16% YoY to $65.6B. Azure and cloud services grew 33%, with AI services contributing 12 percentage points of growth. Copilot integration across Microsoft 365 is driving ARPU expansion. Operating income grew 14% to $30.6B with operating margins of 47%.",
          source: 'Microsoft Q1 FY2025 Earnings Report',
        },
      ],
      riskAssessment: {
        level: 'low',
        factors: [
          'Apple China revenue risk: ~20% of revenue exposed to ongoing US-China trade tensions and Huawei competition',
          'Microsoft EU regulatory scrutiny on AI partnerships could require structural remedies',
          'Both companies face potential multiple compression if interest rates remain elevated (high-PE stocks most affected)',
        ],
        source: 'AI Analysis — Yahoo Finance + Earnings Reports',
      },
    },
  })

  // ── Report 4 (Org B, adminB) ──────────────────────────────────────────────
  // Org B — demonstrates tenant isolation (Org A cannot see this)
  await Report.create({
    userId: adminB._id,
    orgId: orgB._id,
    query: "NVIDIA stock performance and AI chip market outlook for the next quarter",
    title: "NVIDIA stock performance and AI chip market outlook for the next quarter",
    tags: ['AI Chips'],
    createdAt: daysAgo(1),
    trace: {
      toolsCalled: ['get_stock_data', 'get_news_sentiment'],
      toolsSkipped: ['search_document_knowledge_base'],
      llmCalls: 2,
      durationMs: 14920,
    },
    result: {
      summary: "NVIDIA stock is up 185% YTD, consolidating near all-time highs as the market prices in continued AI infrastructure buildout. Q4 demand for Blackwell GPUs remains robust, with hyperscalers committing multi-year CapEx to AI infrastructure. The AI chip market is projected to grow at a 45% CAGR through 2028, with NVIDIA holding ~80% market share in training workloads.",
      companies: [
        { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
      ],
      financialMetrics: [
        {
          symbol: 'NVDA', companyName: 'NVIDIA Corporation',
          price: 137.42, change: 4.18, changePercent: 3.13,
          marketCap: 3370000000000, peRatio: 53.2, eps: 2.58,
          volume: 312450000, range52Week: '$47.32 – $153.13',
          source: 'Yahoo Finance',
        },
      ],
      historicalPrices: [
        { symbol: 'NVDA', prices: generatePriceHistory(137.42, 3), source: 'Yahoo Finance' },
      ],
      newsSentiment: [
        {
          company: 'NVIDIA', symbol: 'NVDA',
          overallSentiment: 'positive', sentimentScore: 0.79,
          articles: [
            { title: "NVIDIA Blackwell GPU Shipments Begin — Microsoft and Google First to Receive", link: 'https://finance.yahoo.com/quote/NVDA/news/', publishedAt: daysAgo(3).toISOString(), sentiment: 'positive' },
            { title: "Goldman Sachs: AI Infrastructure Spend to Reach $1T by 2028 — NVIDIA Primary Beneficiary", link: 'https://finance.yahoo.com/quote/NVDA/news/', publishedAt: daysAgo(11).toISOString(), sentiment: 'positive' },
          ],
          source: 'Yahoo Finance News',
        },
      ],
      filingInsights: [],
      riskAssessment: {
        level: 'medium',
        factors: [
          'Export control risk on H20 and future chips to China (~15% of potential addressable market)',
          'Supply chain constraints on advanced packaging (CoWoS) could limit Blackwell ramp',
          'Premium valuation at 53x P/E leaves little room for any earnings disappointment',
        ],
        source: 'AI Analysis — Yahoo Finance',
      },
    },
  })

  console.log('\n✅ Seed complete! 2 orgs, 3 users, 4 reports created.\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  DEMO CREDENTIALS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n  Org A — Meridian Capital (invite code: MERIDIAN2025)')
  console.log('  ┌─────────────────────────────┬──────────────┬─────────┐')
  console.log('  │ Email                        │ Password     │ Role    │')
  console.log('  ├─────────────────────────────┼──────────────┼─────────┤')
  console.log('  │ admin@meridian.com           │ Demo1234!    │ admin   │')
  console.log('  │ analyst@meridian.com         │ Demo1234!    │ analyst │')
  console.log('  └─────────────────────────────┴──────────────┴─────────┘')
  console.log('  → 3 pre-saved reports: NVDA/AMD Q3 earnings, Tesla overview, AAPL/MSFT comparison')
  console.log('\n  Org B — Vertex Analytics (invite code: VERTEX2025)')
  console.log('  ┌─────────────────────────────┬──────────────┬─────────┐')
  console.log('  │ admin@vertex.com             │ Demo1234!    │ admin   │')
  console.log('  └─────────────────────────────┴──────────────┴─────────┘')
  console.log('  → 1 separate report — login to verify Org A reports are NOT visible')
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})

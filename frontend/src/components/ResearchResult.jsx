'use client'
import { useState } from 'react'
import CompanyOverviewCard from './CompanyOverviewCard'
import ReasoningPanel from './ReasoningPanel'
import { FileText, Newspaper, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'

const SENTIMENT_STYLES = {
  positive: 'bg-green-500/10 text-green-400 border-green-500/20',
  neutral: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  negative: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const RISK_STYLES = {
  low: 'bg-green-500/10 text-green-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  high: 'bg-red-500/10 text-red-400',
}

function NewsSection({ sentiment }) {
  const [open, setOpen] = useState(false)
  const style = SENTIMENT_STYLES[sentiment.overallSentiment] ?? SENTIMENT_STYLES.neutral

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/40 transition"
      >
        <div className="flex items-center gap-3">
          <Newspaper size={14} className="text-zinc-500" />
          <span className="text-sm font-medium text-zinc-200">{sentiment.company}</span>
          <span className={`text-xs border rounded-full px-2.5 py-0.5 capitalize font-medium ${style}`}>
            {sentiment.overallSentiment}
          </span>
          <span className="text-xs text-zinc-500">{sentiment.articles?.length ?? 0} articles</span>
        </div>
        {open ? <ChevronDown size={13} className="text-zinc-500" /> : <ChevronRight size={13} className="text-zinc-500" />}
      </button>

      {open && sentiment.articles?.length > 0 && (
        <div className="border-t border-zinc-800 divide-y divide-zinc-800">
          {sentiment.articles.map((a, i) => (
            <div key={i} className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <a
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-300 hover:text-violet-400 transition line-clamp-2 leading-relaxed"
                >
                  {a.title}
                </a>
                <p className="text-[10px] text-zinc-600 mt-1">{a.publisher}</p>
              </div>
              <span className={`text-[10px] border rounded-full px-2 py-0.5 shrink-0 capitalize ${SENTIMENT_STYLES[a.sentiment] ?? SENTIMENT_STYLES.neutral}`}>
                {a.sentiment}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ResearchResult({ result, trace }) {
  if (!result) return null

  const { summary, financialMetrics = [], historicalPrices = [], newsSentiment = [], filingInsights = [], riskAssessment } = result

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Summary</p>
          <p className="text-sm text-zinc-200 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Company cards */}
      {financialMetrics.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Stock Overview</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {financialMetrics.map((metric) => {
              const hist = historicalPrices.find(h => h.symbol === metric.symbol)
              return (
                <CompanyOverviewCard key={metric.symbol} metric={metric} historicalData={hist} />
              )
            })}
          </div>
        </div>
      )}

      {/* News sentiment */}
      {newsSentiment.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">News Sentiment</p>
          <div className="space-y-2">
            {newsSentiment.map((s) => (
              <NewsSection key={s.company} sentiment={s} />
            ))}
          </div>
        </div>
      )}

      {/* Filing insights */}
      {filingInsights.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} className="text-violet-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Filing Insights</p>
          </div>
          <div className="space-y-3">
            {filingInsights.map((insight, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{insight.insight}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">{insight.company} · {insight.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk assessment */}
      {riskAssessment?.level && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-zinc-500" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Risk Assessment</p>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${RISK_STYLES[riskAssessment.level] ?? RISK_STYLES.medium}`}>
              {riskAssessment.level}
            </span>
          </div>
          {riskAssessment.factors?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {riskAssessment.factors.map((f, i) => (
                <span key={i} className="text-xs text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">{f}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reasoning panel */}
      <ReasoningPanel trace={trace} />
    </div>
  )
}

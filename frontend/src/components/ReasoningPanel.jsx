'use client'
import { useState } from 'react'
import { ChevronDown, ChevronRight, Brain, CheckCircle2, XCircle, Clock } from 'lucide-react'

const TOOL_LABELS = {
  get_stock_data: 'Stock Data',
  get_news_sentiment: 'News Sentiment',
  search_document_knowledge_base: 'Document Search',
}

export default function ReasoningPanel({ trace }) {
  const [open, setOpen] = useState(true)
  if (!trace) return null

  const { toolsCalled = [], toolsSkipped = [], llmCalls = 0, durationMs = 0 } = trace

  return (
    <div className="bg-zinc-900 border border-violet-500/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/50 transition"
      >
        <div className="flex items-center gap-2.5">
          <Brain size={15} className="text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">Agent Reasoning</span>
          <span className="text-xs text-violet-400/70 bg-violet-500/10 px-2 py-0.5 rounded-full">
            {llmCalls} LLM calls · {(durationMs / 1000).toFixed(1)}s
          </span>
        </div>
        {open ? <ChevronDown size={15} className="text-zinc-500" /> : <ChevronRight size={15} className="text-zinc-500" />}
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-zinc-800 pt-4 space-y-3">
          {toolsCalled.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Tools Called</p>
              <div className="flex flex-wrap gap-2">
                {toolsCalled.map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-3 py-1">
                    <CheckCircle2 size={11} />
                    {TOOL_LABELS[t] ?? t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {toolsSkipped.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Tools Skipped</p>
              <div className="flex flex-wrap gap-2">
                {toolsSkipped.map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs bg-zinc-800 text-zinc-500 border border-zinc-700 rounded-full px-3 py-1">
                    <XCircle size={11} />
                    {TOOL_LABELS[t] ?? t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-zinc-500 pt-1">
            <Clock size={11} />
            {llmCalls} LLM calls · completed in {(durationMs / 1000).toFixed(1)}s
          </div>
        </div>
      )}
    </div>
  )
}

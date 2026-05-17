'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import ResearchResult from '@/components/ResearchResult'
import api from '@/lib/api'
import { Search, Loader2, Sparkles } from 'lucide-react'
import { Suspense } from 'react'

const QUICK_QUERIES = [
  'Analyze NVIDIA stock performance and recent news',
  'Compare Apple vs Microsoft revenue this quarter',
  'Tesla Q3 earnings summary and risk assessment',
  'AMD competitive position vs Intel and NVIDIA',
]

function ResearchPageInner() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [trace, setTrace] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const hasAutoSubmitted = useRef(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true
      setQuery(q)
      runQuery(q)
    }
  }, [searchParams])

  async function runQuery(q) {
    const text = q ?? query
    if (!text.trim()) return
    setIsLoading(true)
    setError('')
    setResult(null)
    setTrace(null)
    try {
      const { data } = await api.post('/research/query', { query: text })
      setResult(data.result)
      setTrace(data.trace)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    runQuery()
  }

  if (loading || !user) return null

  const hasResult = result && !isLoading

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles size={18} className="text-violet-400" />
              Research
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Ask anything about stocks, earnings, or market sentiment</p>
          </div>

          {/* Search input */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Compare NVIDIA and AMD performance..."
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl px-5 py-3 transition flex items-center gap-2 shrink-0"
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {isLoading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </form>

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-3">
                <Loader2 size={16} className="text-violet-400 animate-spin shrink-0" />
                <div>
                  <p className="text-sm text-zinc-300">Analyzing with AI...</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Fetching stock data, news, and filings — this takes 15–30 seconds</p>
                </div>
              </div>
              <div className="space-y-3">
                {[80, 60, 90].map((w, i) => (
                  <div key={i} className={`h-24 bg-zinc-800/50 rounded-xl animate-pulse w-${w === 80 ? 'full' : w === 60 ? '3/4' : 'full'}`} />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Results */}
          {hasResult && <ResearchResult result={result} trace={trace} />}

          {/* Quick queries — show only when no result */}
          {!hasResult && !isLoading && (
            <div className="mt-8">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Try these</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setQuery(q); runQuery(q) }}
                    className="text-left bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 rounded-xl px-4 py-3 text-xs text-zinc-400 hover:text-zinc-200 transition leading-relaxed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function ResearchPage() {
  return (
    <Suspense>
      <ResearchPageInner />
    </Suspense>
  )
}

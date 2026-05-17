'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import {
  Search, Clock, TrendingUp, ArrowRight,
  FileText, Sparkles, BarChart2
} from 'lucide-react'

const QUICK_QUERIES = [
  'Analyze NVIDIA stock performance and recent news',
  'Compare Apple vs Microsoft revenue this quarter',
  'Tesla Q3 earnings summary and risk assessment',
  'AMD competitive position vs Intel and NVIDIA',
]

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    api.get('/research/history')
      .then(({ data }) => setReports(data.reports.slice(0, 5)))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [user])

  if (loading || !user) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100">
            Good morning, <span className="text-violet-400">{user.email.split('@')[0]}</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            What would you like to research today?
          </p>
        </div>

        {/* Quick research CTA */}
        <Link
          href="/research"
          className="flex items-center gap-3 w-full bg-zinc-900 border border-zinc-700 hover:border-violet-500/50 hover:bg-zinc-800/80 rounded-xl px-5 py-4 mb-8 transition group"
        >
          <div className="w-9 h-9 bg-violet-600/20 rounded-lg flex items-center justify-center shrink-0">
            <Sparkles size={17} className="text-violet-400" />
          </div>
          <span className="text-zinc-400 text-sm group-hover:text-zinc-200 transition flex-1">
            Ask anything — NVIDIA vs AMD, Tesla earnings, market risks...
          </span>
          <ArrowRight size={16} className="text-zinc-600 group-hover:text-violet-400 transition" />
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent reports */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <Clock size={15} className="text-zinc-500" /> Recent Reports
              </h2>
              <Link href="/history" className="text-xs text-violet-400 hover:text-violet-300 transition">
                View all →
              </Link>
            </div>

            {fetching ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-zinc-800/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                <FileText size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No reports yet.</p>
                <Link href="/research" className="text-violet-400 text-sm hover:text-violet-300 mt-1 inline-block">
                  Run your first research →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <Link
                    key={r._id}
                    href={`/history/${r._id}`}
                    className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3.5 transition group"
                  >
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                      <BarChart2 size={15} className="text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition">
                        {r.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                        {r.trace?.toolsCalled?.length > 0 && (
                          <span className="ml-2 text-violet-500">
                            · {r.trace.toolsCalled.length} tools used
                          </span>
                        )}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-zinc-700 group-hover:text-zinc-400 transition shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick queries */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2 mb-4">
              <Search size={15} className="text-zinc-500" /> Quick Queries
            </h2>
            <div className="space-y-2">
              {QUICK_QUERIES.map((q) => (
                <Link
                  key={q}
                  href={`/research?q=${encodeURIComponent(q)}`}
                  className="block bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 rounded-xl px-4 py-3 text-xs text-zinc-400 hover:text-zinc-200 transition leading-relaxed"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

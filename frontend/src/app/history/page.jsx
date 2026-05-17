'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { History, Search, BarChart2, ArrowRight, FileText } from 'lucide-react'

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    api.get('/research/history')
      .then(({ data }) => setReports(data.reports))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [user])

  if (loading || !user) return null

  const filtered = reports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <History size={18} className="text-violet-400" />
                History
              </h1>
              <p className="text-zinc-500 text-sm mt-1">{reports.length} research reports in your org</p>
            </div>
            <Link
              href="/research"
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg px-4 py-2 transition"
            >
              + New Research
            </Link>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          {/* List */}
          {fetching ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-zinc-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
              <FileText size={36} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">
                {search ? 'No reports match your search.' : 'No reports yet.'}
              </p>
              {!search && (
                <Link href="/research" className="text-violet-400 text-sm hover:text-violet-300 mt-2 inline-block">
                  Run your first research →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => (
                <Link
                  key={r._id}
                  href={`/history/${r._id}`}
                  className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3.5 transition group"
                >
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                    <BarChart2 size={14} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition">
                      {r.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(r.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                      {r.trace?.toolsCalled?.length > 0 && (
                        <span className="ml-2 text-violet-500">
                          · {r.trace.toolsCalled.length} tools · {((r.trace.durationMs ?? 0) / 1000).toFixed(1)}s
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
      </main>
    </div>
  )
}

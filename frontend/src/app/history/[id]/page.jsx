'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import ResearchResult from '@/components/ResearchResult'
import api from '@/lib/api'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'

export default function ReportDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this report?')) return
    setDeleting(true)
    try {
      await api.delete(`/research/${id}`)
      router.push('/history')
    } catch {
      setError('Could not delete. You may only delete your own reports.')
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user || !id) return
    api.get(`/research/${id}`)
      .then(({ data }) => setReport(data.report))
      .catch(() => setError('Report not found or you do not have access.'))
      .finally(() => setFetching(false))
  }, [user, id])

  if (loading || !user) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">

          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition mb-6"
          >
            <ArrowLeft size={13} />
            Back to History
          </Link>

          {fetching && (
            <div className="flex items-center gap-3 text-zinc-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading report...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {report && (
            <>
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-zinc-100">{report.title}</h1>
                    <p className="text-xs text-zinc-500 mt-1.5">
                      {new Date(report.createdAt).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {(user.role === 'admin' || String(report.userId) === String(user._id)) && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 rounded-lg px-3 py-1.5 transition shrink-0"
                    >
                      {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Delete
                    </button>
                  )}
                </div>
                {report.query && (
                  <p className="text-sm text-zinc-400 mt-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 italic">
                    "{report.query}"
                  </p>
                )}
              </div>

              <ResearchResult result={report.result} trace={report.trace} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}

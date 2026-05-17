'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { Building2, Users, Copy, Check, Crown, User } from 'lucide-react'

export default function TeamPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [org, setOrg] = useState(null)
  const [members, setMembers] = useState([])
  const [fetching, setFetching] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.get('/org/me'),
      api.get('/org/members'),
    ])
      .then(([orgRes, membersRes]) => {
        setOrg(orgRes.data.org)
        setMembers(membersRes.data.members)
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [user])

  function copyInviteCode() {
    if (!org?.inviteCode) return
    navigator.clipboard.writeText(org.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !user) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100">Team</h1>
          <p className="text-zinc-400 text-sm mt-1">Your workspace members and invite code</p>
        </div>

        {fetching ? (
          <div className="space-y-4">
            <div className="h-28 bg-zinc-800/50 rounded-xl animate-pulse" />
            <div className="h-48 bg-zinc-800/50 rounded-xl animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl">

            {/* Org card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-violet-600/20 rounded-lg flex items-center justify-center">
                  <Building2 size={18} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{org?.name}</p>
                  <p className="text-xs text-zinc-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-500 mb-2">Invite Code — share this to add teammates</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 font-mono text-lg font-bold tracking-widest text-violet-300">
                    {org?.inviteCode}
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Members list */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                <Users size={15} className="text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-300">Members</h2>
              </div>

              <div className="divide-y divide-zinc-800">
                {members.map((m) => (
                  <div key={m._id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 bg-violet-600/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-violet-300">
                        {m.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{m.email}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Joined {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      m.role === 'admin'
                        ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {m.role === 'admin' ? <Crown size={11} /> : <User size={11} />}
                      {m.role === 'admin' ? 'Admin' : 'Analyst'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  TrendingUp, LayoutDashboard, Search,
  History, LogOut, Building2, ChevronRight, Users
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/research', label: 'New Research', icon: Search },
  { href: '/history', label: 'History', icon: History },
  { href: '/team', label: 'Team', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, org, logout } = useAuth()

  return (
    <aside className="w-60 shrink-0 bg-[#0f0f12] border-r border-zinc-800/60 flex flex-col h-screen sticky top-0">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100 leading-tight">Klypup Research</p>
            <p className="text-[11px] text-zinc-500 leading-tight">AI Intelligence</p>
          </div>
        </div>
      </div>

      {/* Org badge */}
      {org && (
        <div className="mx-3 mt-3 px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
          <div className="flex items-center gap-2">
            <Building2 size={13} className="text-violet-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">{org.name}</p>
              {org.inviteCode && (
                <p className="text-[10px] text-zinc-500 font-mono">Code: {org.inviteCode}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Icon size={16} className={active ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-violet-400" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-zinc-800/60">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 bg-violet-600/30 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-violet-300">
              {user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-300 truncate">{user?.email}</p>
            <p className="text-[10px] text-zinc-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="text-zinc-500 hover:text-red-400 transition p-1 rounded"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

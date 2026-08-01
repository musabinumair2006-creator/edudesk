'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import {
  LayoutDashboard,
  Database,
  Upload,
  FilePlus,
  FileText,
  BookOpen,
  Users,
  Settings,
  Zap,
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const { profile, activePaperQuestions } = useApp()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/question-bank', label: 'Question Bank', icon: Database, badge: 'Bank' },
    { href: '/question-bank/upload', label: 'Upload Past Paper', icon: Upload },
    { href: '/papers/create', label: 'Create Paper', icon: FilePlus, isPrimary: true, count: activePaperQuestions.length },
    { href: '/papers', label: 'My Papers', icon: FileText },
    { href: '/classes', label: 'Classes & Roster', icon: BookOpen },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="w-60 bg-bg-dark text-white flex flex-col justify-between h-screen fixed left-0 top-0 z-40 border-r border-slate-800">
      {/* Top Branding Header */}
      <div>
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <div className="p-2 bg-accent text-white rounded-lg shadow-md">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white">PhysicsDesk</h1>
            <p className="text-[10px] text-slate-400 font-medium">Centaurus Academy</p>
          </div>
        </div>

        {/* Nav Links List */}
        <nav className="p-3 flex flex-col gap-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))

            if (item.isPrimary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all mt-1 mb-1 shadow-md ${
                    isActive
                      ? 'bg-accent text-white ring-2 ring-blue-400/30'
                      : 'bg-accent/90 text-white hover:bg-accent-hover'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="bg-white text-accent rounded-full text-[10px] px-2 py-0.5 font-extrabold font-mono-numbers">
                      {item.count}
                    </span>
                  )}
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border-l-4 border-accent'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={isActive ? 'text-accent' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Profile Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xs font-bold uppercase">
            {profile?.full_name ? profile.full_name.charAt(0) : 'S'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-200 truncate">
              {profile?.full_name || 'Dr. Sarah Jenkins'}
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              {profile?.academy_name || 'Centaurus Academy'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

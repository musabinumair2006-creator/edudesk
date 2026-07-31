'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { getAISuggestions } from '@/lib/supabase/queries/suggestions'
import {
  LayoutDashboard,
  Upload,
  Lightbulb,
  BookOpen,
  Users,
  FileText,
  BarChart2,
  Settings,
  Zap,
  LogOut,
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useApp()
  const [pendingCount, setPendingCount] = useState<number>(0)

  useEffect(() => {
    getAISuggestions('pending').then((items) => {
      setPendingCount(items.length)
    })
  }, [pathname])

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/upload', label: 'Upload File', icon: Upload, isPrimary: true },
    { href: '/suggestions', label: 'Suggestions', icon: Lightbulb, badge: pendingCount },
    { href: '/classes', label: 'Classes', icon: BookOpen },
    { href: '/students', label: 'Students', icon: Users },
    { href: '/assignments', label: 'Assignments', icon: FileText },
    { href: '/reports', label: 'Reports', icon: BarChart2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="p-4 flex items-center gap-3 border-b border-slate-800">
        <div className="p-2 bg-accent text-white rounded-lg font-bold">
          <Zap size={20} />
        </div>
        <div>
          <h1 className="font-extrabold text-base text-white tracking-tight leading-tight">PhysicsDesk</h1>
          <p className="text-[11px] text-slate-400 font-medium">Centaurus Academy</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {navLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))

          if (link.isPrimary) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-all my-1.5 shadow-md"
              >
                <Icon size={18} />
                <span>{link.label}</span>
                <span className="ml-auto text-[10px] uppercase font-bold bg-white/20 px-1.5 py-0.5 rounded">
                  LMS Hub
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="flex-1">{link.label}</span>
              {typeof link.badge === 'number' && link.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-500 text-slate-950">
                  {link.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Teacher Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between">
        <div className="truncate">
          <div className="text-xs font-semibold text-white truncate">{profile?.full_name || 'Dr. Sarah Jenkins'}</div>
          <div className="text-[10px] text-slate-400 truncate">{profile?.academy_name || 'Centaurus Academy'}</div>
        </div>
        <button
          onClick={signOut}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}

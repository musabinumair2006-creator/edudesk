'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import {
  Zap,
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  FileText,
  BarChart2,
  Settings,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/classes', label: 'Classes', icon: BookOpen },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/papers', label: 'Exam Papers', icon: FileText },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useApp()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div
        style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            style={{
              background: 'rgba(37, 99, 235, 0.25)',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={18} style={{ color: '#60A5FA' }} fill="#60A5FA" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">EduDesk</div>
            <div
              className="text-xs leading-tight"
              style={{ color: '#64748B', fontSize: '11px', marginTop: '1px' }}
            >
              {profile?.academy_name || 'Physics Academy'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.75rem 0.625rem', overflowY: 'auto' }}>
        <div className="label-sm mb-2 px-3" style={{ color: '#475569' }}>
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="nav-item"
              style={active ? { background: 'rgba(37, 99, 235, 0.2)', color: '#93C5FD' } : {}}
            >
              <Icon size={17} style={active ? { color: '#60A5FA' } : {}} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Teacher Info + Sign Out */}
      <div
        style={{
          padding: '0.75rem 0.625rem',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.5rem 0.75rem',
            marginBottom: '0.25rem',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'rgba(37, 99, 235, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#93C5FD', fontSize: '0.8rem', fontWeight: 600 }}>
              {profile?.full_name?.charAt(0).toUpperCase() || 'T'}
            </span>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div
              className="font-medium text-sm truncate"
              style={{ color: '#E2E8F0', maxWidth: '130px' }}
            >
              {profile?.full_name || 'Teacher'}
            </div>
            <div
              className="truncate"
              style={{ color: '#64748B', fontSize: '11px', maxWidth: '130px' }}
            >
              {profile?.email || ''}
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          className="nav-item w-full text-left"
          style={{ color: '#64748B', width: '100%' }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

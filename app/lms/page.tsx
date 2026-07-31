'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import {
  Globe,
  ExternalLink,
  RefreshCw,
  Plus,
  CheckCircle,
  Search,
  BookOpen,
  BarChart2,
  Video,
  FileText,
  Calendar,
  Layers,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react'
import type { LMSConnection, LMSProvider } from '@/lib/types'

const PROVIDER_METADATA: Record<
  LMSProvider,
  { name: string; color: string; bg: string; defaultUrl: string; desc: string }
> = {
  google_classroom: {
    name: 'Google Classroom',
    color: '#34A853',
    bg: 'rgba(52, 168, 83, 0.12)',
    defaultUrl: 'https://classroom.google.com',
    desc: 'Google for Education suite for school classes and coursework.',
  },
  canvas: {
    name: 'Canvas LMS',
    color: '#E13936',
    bg: 'rgba(225, 57, 54, 0.12)',
    defaultUrl: 'https://canvas.instructure.com',
    desc: 'Instructure Canvas portal for university and high school courses.',
  },
  moodle: {
    name: 'Moodle LMS',
    color: '#F25D27',
    bg: 'rgba(242, 93, 39, 0.12)',
    defaultUrl: 'https://moodle.org',
    desc: 'Open-source Moodle virtual learning environment.',
  },
  teams: {
    name: 'MS Teams Education',
    color: '#5B5FC7',
    bg: 'rgba(91, 95, 199, 0.12)',
    defaultUrl: 'https://teams.microsoft.com',
    desc: 'Microsoft Teams education hub for assignments and meetings.',
  },
  custom: {
    name: 'Custom Academy LMS',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    defaultUrl: 'https://lms.myacademy.edu',
    desc: 'Any custom school, college, or tuition academy web portal.',
  },
}

export default function LMSPage() {
  const [connections, setConnections] = useState<LMSConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterProvider, setFilterProvider] = useState<string>('all')
  const [selectedSchool, setSelectedSchool] = useState<LMSConnection | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Form State
  const [provider, setProvider] = useState<LMSProvider>('google_classroom')
  const [academyName, setAcademyName] = useState('')
  const [portalUrl, setPortalUrl] = useState(PROVIDER_METADATA.google_classroom.defaultUrl)
  const [accountEmail, setAccountEmail] = useState('')
  const [gradebookUrl, setGradebookUrl] = useState('')
  const [courseworkUrl, setCourseworkUrl] = useState('')
  const [attendanceUrl, setAttendanceUrl] = useState('')
  const [liveClassUrl, setLiveClassUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function fetchConnections() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/lms')
      const data = await res.json()
      if (data.connections) {
        setConnections(data.connections)
        if (data.connections.length > 0) {
          setSelectedSchool(data.connections[0])
        }
      }
    } catch (err) {
      showToast('Failed to load LMS portals', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConnections()
  }, [])

  function handleProviderChange(selected: LMSProvider) {
    setProvider(selected)
    setPortalUrl(PROVIDER_METADATA[selected].defaultUrl)
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!academyName.trim() || !portalUrl.trim()) {
      showToast('Academy name and portal URL are required', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/lms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          academy_name: academyName,
          portal_url: portalUrl,
          account_email: accountEmail || undefined,
          gradebook_url: gradebookUrl || undefined,
          coursework_url: courseworkUrl || undefined,
          attendance_url: attendanceUrl || undefined,
          live_class_url: liveClassUrl || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()
      if (data.error) {
        showToast(data.error, 'error')
      } else {
        setConnections((prev) => [data.connection, ...prev])
        setSelectedSchool(data.connection)
        showToast(`Connected ${academyName} LMS successfully!`)
        setIsModalOpen(false)
        resetForm()
      }
    } catch (err) {
      showToast('Failed to connect LMS portal', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setAcademyName('')
    setAccountEmail('')
    setGradebookUrl('')
    setCourseworkUrl('')
    setAttendanceUrl('')
    setLiveClassUrl('')
    setNotes('')
    setProvider('google_classroom')
    setPortalUrl(PROVIDER_METADATA.google_classroom.defaultUrl)
  }

  async function handleSync(id: string) {
    setSyncingId(id)
    setTimeout(() => {
      setConnections((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, last_synced_at: new Date().toISOString(), status: 'connected' } : c
        )
      )
      setSyncingId(null)
      showToast('Roster & Coursework deep links synced!')
    }, 1200)
  }

  const filtered = connections.filter((c) => {
    const matchSearch =
      c.academy_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.account_email && c.account_email.toLowerCase().includes(search.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase()))
    const matchProvider = filterProvider === 'all' || c.provider === filterProvider
    return matchSearch && matchProvider
  })

  return (
    <AppShell>
      <Header
        title="Universal LMS Navigator"
        subtitle="Navigate and switch through any school or academy LMS portal"
        actions={
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Register School LMS
          </button>
        }
      />

      <div className="page-body flex flex-col gap-6">
        {/* Navigation Quick Dock Banner */}
        <div className="card bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/50 border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <Globe size={26} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-snug">
                Universal School & Academy LMS Navigation Hub
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Register any custom school portal (Google Classroom, Canvas, Moodle, MS Teams, or private school URLs) and jump directly into specific sections.
              </p>
            </div>
          </div>
          <button className="btn btn-secondary text-xs flex items-center gap-1.5 shrink-0" onClick={fetchConnections}>
            <RefreshCw size={13} /> Refresh Portals
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1" style={{ minWidth: '240px', maxWidth: '420px' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search school name, email, or batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            <button
              className="btn btn-sm"
              style={{
                background: filterProvider === 'all' ? 'var(--accent)' : 'var(--bg-subtle)',
                color: filterProvider === 'all' ? 'white' : 'var(--text-secondary)',
              }}
              onClick={() => setFilterProvider('all')}
            >
              All Schools ({connections.length})
            </button>
            {(Object.keys(PROVIDER_METADATA) as LMSProvider[]).map((key) => {
              const meta = PROVIDER_METADATA[key]
              const count = connections.filter((c) => c.provider === key).length
              return (
                <button
                  key={key}
                  className="btn btn-sm"
                  style={{
                    background: filterProvider === key ? meta.color : 'var(--bg-subtle)',
                    color: filterProvider === key ? 'white' : 'var(--text-secondary)',
                  }}
                  onClick={() => setFilterProvider(key)}
                >
                  {meta.name} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected School Active Control Deck */}
        {selectedSchool && (
          <div className="card border-blue-500/30 bg-slate-900/60 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-3">
                <span
                  className="px-2.5 py-1 rounded text-xs font-bold"
                  style={{
                    background: PROVIDER_METADATA[selectedSchool.provider]?.bg || 'rgba(59,130,246,0.15)',
                    color: PROVIDER_METADATA[selectedSchool.provider]?.color || '#60A5FA',
                  }}
                >
                  {PROVIDER_METADATA[selectedSchool.provider]?.name || 'Custom Portal'}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedSchool.academy_name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{selectedSchool.account_email || 'No email associated'}</span>
                    {selectedSchool.notes && <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-blue-300">🏷️ {selectedSchool.notes}</span>}
                  </div>
                </div>
              </div>

              <a
                href={selectedSchool.portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                <span>Launch Main LMS Portal</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Deep Links Navigation Dock */}
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Quick Jump Sub-Sections
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <a
                  href={selectedSchool.gradebook_url || selectedSchool.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 transition-all flex items-center gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                    <BarChart2 size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Gradebook / Marks</div>
                    <div className="text-[10px] text-slate-400">View student grades</div>
                  </div>
                </a>

                <a
                  href={selectedSchool.coursework_url || selectedSchool.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 transition-all flex items-center gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Assignments</div>
                    <div className="text-[10px] text-slate-400">Manage coursework</div>
                  </div>
                </a>

                <a
                  href={selectedSchool.attendance_url || selectedSchool.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 transition-all flex items-center gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Attendance Log</div>
                    <div className="text-[10px] text-slate-400">Check class roster</div>
                  </div>
                </a>

                <a
                  href={selectedSchool.live_class_url || selectedSchool.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 transition-all flex items-center gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                    <Video size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Virtual Classroom</div>
                    <div className="text-[10px] text-slate-400">Teams / Meet / Zoom</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Registered School LMS List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 className="text-sm font-semibold text-white">
                REGISTERED SCHOOL & ACADEMY PORTALS
              </h2>
              <p className="text-xs mt-0.5 text-slate-400">
                Click any school row to activate its navigation dock above
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Showing {filtered.length} of {connections.length}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="spinner spinner-lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Globe size={40} className="mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-white">No LMS portals match your filter</p>
              <p className="text-xs mt-1">Register a new school or academy LMS portal using the button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => {
                const meta = PROVIDER_METADATA[item.provider] || PROVIDER_METADATA.custom
                const isSelected = selectedSchool?.id === item.id

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSchool(item)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/20 shadow-lg'
                        : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-semibold"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.last_synced_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-white truncate">{item.academy_name}</h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.account_email || item.portal_url}
                      </p>

                      {item.notes && (
                        <p className="text-[11px] text-blue-300/80 mt-1 line-clamp-1">
                          🏷️ {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {item.gradebook_url && <span title="Gradebook link added" className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-blue-300">📊 Marks</span>}
                        {item.live_class_url && <span title="Live class link added" className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-purple-300">🎥 Live</span>}
                      </div>

                      <a
                        href={item.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="btn btn-secondary btn-sm text-[11px] flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Connect Custom School LMS Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="card w-full max-w-xl flex flex-col gap-4 relative animate-fade-in max-h-[90vh] overflow-y-auto"
            style={{ border: '1px solid var(--border-light)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-blue-400" />
                <h3 className="font-bold text-white">Register Any School or Academy LMS</h3>
              </div>
              <button
                className="text-white opacity-60 hover:opacity-100 text-lg"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnect} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Platform Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(Object.keys(PROVIDER_METADATA) as LMSProvider[]).map((key) => {
                    const meta = PROVIDER_METADATA[key]
                    const selected = provider === key
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleProviderChange(key)}
                        className="p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all"
                        style={{
                          background: selected ? meta.bg : 'var(--bg-base)',
                          borderColor: selected ? meta.color : 'var(--border)',
                        }}
                      >
                        <span className="font-semibold text-xs" style={{ color: selected ? meta.color : 'white' }}>
                          {meta.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">School / Academy Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Greenwood High School"
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teacher Account Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="teacher@school.edu"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Main Portal URL *</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://lms.school-domain.edu"
                  value={portalUrl}
                  onChange={(e) => setPortalUrl(e.target.value)}
                  required
                />
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Deep Link Navigation Shortcuts (Optional)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Gradebook URL</label>
                    <input
                      type="url"
                      className="form-input text-xs"
                      placeholder="https://school.edu/grades"
                      value={gradebookUrl}
                      onChange={(e) => setGradebookUrl(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Coursework / Tasks URL</label>
                    <input
                      type="url"
                      className="form-input text-xs"
                      placeholder="https://school.edu/assignments"
                      value={courseworkUrl}
                      onChange={(e) => setCourseworkUrl(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Attendance Log URL</label>
                    <input
                      type="url"
                      className="form-input text-xs"
                      placeholder="https://school.edu/attendance"
                      value={attendanceUrl}
                      onChange={(e) => setAttendanceUrl(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Live Class Link (Meet/Zoom/Teams)</label>
                    <input
                      type="url"
                      className="form-input text-xs"
                      placeholder="https://meet.google.com/xyz"
                      value={liveClassUrl}
                      onChange={(e) => setLiveClassUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Class Tag</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Grade 11 Physics Section B"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                      Registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} /> Save & Register Portal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </AppShell>
  )
}

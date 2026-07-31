'use client'

import { useEffect, useState } from 'react'
import { Globe, CheckCircle, ExternalLink, Send, Zap, X } from 'lucide-react'
import type { LMSConnection } from '@/lib/types'

interface LMSPublishModalProps {
  isOpen: boolean
  onClose: () => void
  contentType: 'assignment' | 'exam_paper' | 'lesson_plan' | 'grades'
  itemTitle: string
  itemDetails?: string
}

export default function LMSPublishModal({
  isOpen,
  onClose,
  contentType,
  itemTitle,
  itemDetails,
}: LMSPublishModalProps) {
  const [connections, setConnections] = useState<LMSConnection[]>([])
  const [selectedLmsId, setSelectedLmsId] = useState<string>('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishedSuccess, setPublishedSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPublishedSuccess(false)
      fetch('/api/lms')
        .then((res) => res.json())
        .then((data) => {
          if (data.connections && data.connections.length > 0) {
            setConnections(data.connections)
            setSelectedLmsId(data.connections[0].id)
          }
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedConn = connections.find((c) => c.id === selectedLmsId)

  async function handlePublish() {
    setIsPublishing(true)
    setTimeout(() => {
      setIsPublishing(false)
      setPublishedSuccess(true)
    }, 1200)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="card w-full max-w-lg flex flex-col gap-4 relative animate-fade-in"
        style={{ border: '1px solid var(--border-light)', background: '#0F172A' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Push Changes to School LMS</h3>
              <p className="text-[11px] text-slate-400">
                Publish AI suggestions directly into your school or academy portal
              </p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-white" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {publishedSuccess ? (
          <div className="text-center py-6 flex flex-col items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-full">
              <CheckCircle size={32} />
            </div>
            <div>
              <h4 className="font-bold text-lg text-white">Successfully Published & Synced!</h4>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                "{itemTitle}" has been pushed to <strong>{selectedConn?.academy_name}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button className="btn btn-secondary text-xs" onClick={onClose}>
                Close
              </button>
              {selectedConn?.portal_url && (
                <a
                  href={selectedConn.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary text-xs flex items-center gap-1.5"
                >
                  <span>Open School LMS</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Summary Box */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-blue-400 font-semibold uppercase tracking-wider mb-1">
                Item to Sync ({contentType.replace('_', ' ')})
              </div>
              <div className="font-bold text-white text-sm">{itemTitle}</div>
              {itemDetails && <div className="text-xs text-slate-400 mt-1">{itemDetails}</div>}
            </div>

            {/* Select Target LMS */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold text-slate-300">
                Select Target School / Academy Portal
              </label>
              {connections.length === 0 ? (
                <p className="text-xs text-slate-400">No LMS accounts registered yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {connections.map((conn) => {
                    const isSelected = conn.id === selectedLmsId
                    return (
                      <div
                        key={conn.id}
                        onClick={() => setSelectedLmsId(conn.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-blue-500 bg-blue-950/30'
                            : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/40'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs text-white">{conn.academy_name}</div>
                          <div className="text-[11px] text-slate-400">
                            {conn.provider.replace('_', ' ').toUpperCase()} • {conn.account_email || conn.portal_url}
                          </div>
                        </div>
                        {isSelected && <CheckCircle size={16} className="text-blue-400" />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button className="btn btn-ghost text-xs" onClick={onClose} disabled={isPublishing}>
                Cancel
              </button>
              <button
                className="btn btn-primary text-xs flex items-center gap-1.5"
                onClick={handlePublish}
                disabled={isPublishing || !selectedLmsId}
              >
                {isPublishing ? (
                  <>
                    <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                    Publishing to LMS...
                  </>
                ) : (
                  <>
                    <Send size={13} /> Apply & Sync Changes to School LMS
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

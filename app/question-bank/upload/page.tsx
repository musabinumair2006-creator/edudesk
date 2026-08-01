'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import type { PaperSource, SourceType } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react'

export default function QuestionBankUploadPage() {
  const router = useRouter()
  const { curriculumLevels } = useApp()

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [curriculumLevelId, setCurriculumLevelId] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>('past_paper')
  const [year, setYear] = useState<string>('2023')
  const [paperNumber, setPaperNumber] = useState('Paper 4')

  // Progress State
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressStage, setProgressStage] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [indexingResult, setIndexingResult] = useState<{
    source_id: string
    questions_extracted: number
    topics_found: string[]
  } | null>(null)

  // Existing Paper Sources Table
  const [sources, setSources] = useState<PaperSource[]>([])
  const [isLoadingSources, setIsLoadingSources] = useState(true)

  useEffect(() => {
    if (curriculumLevels.length > 0 && !curriculumLevelId) {
      setCurriculumLevelId(curriculumLevels[0].id)
    }
    loadSources()
  }, [curriculumLevels])

  async function loadSources() {
    setIsLoadingSources(true)
    try {
      const { data } = await supabase
        .from('paper_sources')
        .select('*, curriculum_level:curriculum_levels(name)')
        .order('uploaded_at', { ascending: false })

      if (data) {
        setSources(data as any)
      }
    } catch (err) {
      console.warn('Sources fetch warning:', err)
    } finally {
      setIsLoadingSources(false)
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      validateAndSetFile(file)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  function validateAndSetFile(file: File) {
    setErrorMsg(null)
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Only PDF files are supported. If your past paper is in another format, convert it to PDF first.')
      setSelectedFile(null)
      return
    }
    setSelectedFile(file)
    if (!title) {
      // Auto-fill title from filename
      const cleanName = file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ')
      setTitle(cleanName)
    }
  }

  async function handleUploadAndIndex(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile || !title.trim() || !curriculumLevelId) return

    setErrorMsg(null)
    setIsProcessing(true)
    setIndexingResult(null)

    try {
      setProgressStage('Uploading PDF to storage...')
      await new Promise((r) => setTimeout(r, 600))

      setProgressStage('Extracting PDF text...')
      await new Promise((r) => setTimeout(r, 800))

      setProgressStage('AI is reading & indexing questions (takes 15-30s)...')

      // Convert file to Base64 payload for reliable serverless transmission
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.readAsDataURL(selectedFile)
        reader.onload = () => resolve((reader.result as string).split(',')[1] || '')
        reader.onerror = reject
      })
      const base64 = await base64Promise

      const res = await fetch('/api/index-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          curriculum_level_id: curriculumLevelId,
          source_type: sourceType,
          year: year ? parseInt(year, 10) : undefined,
          paper_number: paperNumber.trim(),
          fileName: selectedFile.name,
          base64,
        }),
      })

      const rawText = await res.text()
      let data: any = {}
      try {
        data = JSON.parse(rawText)
      } catch {
        data = { error: 'Server error indexing PDF. Please verify PDF contains readable text.' }
      }

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to index paper.')
        setIsProcessing(false)
        return
      }

      setProgressStage('Indexing complete!')
      setIndexingResult({
        source_id: data.source_id,
        questions_extracted: data.questions_extracted || 0,
        topics_found: data.topics_found || [],
      })

      await loadSources()
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during indexing.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleDeleteSource(id: string) {
    if (!confirm('Are you sure you want to delete this paper source and all its indexed questions?')) return
    try {
      await supabase.from('paper_sources').delete().eq('id', id)
      await loadSources()
    } catch (err) {
      console.warn('Delete error:', err)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              Upload Past Papers & Topicals
            </h1>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Extract and index questions automatically into your searchable Physics Question Bank
            </p>
          </div>
          <Link href="/question-bank" className="btn btn-outline text-xs">
            <Database size={14} /> View Question Bank
          </Link>
        </div>

        {/* Upload Form Card */}
        <div className="card bg-white shadow-sm p-6">
          <form onSubmit={handleUploadAndIndex} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PDF Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-success bg-success-light/30'
                    : 'border-border-strong bg-bg-surface hover:border-accent hover:bg-bg-subtle'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById('pdf-file-input')?.click()}
              >
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className={`p-4 rounded-full mb-3 ${selectedFile ? 'bg-success-light text-success' : 'bg-accent-light text-accent'}`}>
                  {selectedFile ? <FileText size={32} /> : <UploadCloud size={32} />}
                </div>
                {selectedFile ? (
                  <div>
                    <span className="font-bold text-sm text-text-primary">{selectedFile.name}</span>
                    <p className="text-xs text-success font-medium mt-1">PDF file ready for indexing ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">Drop a past paper or topical PDF here</h3>
                    <p className="text-xs text-text-muted mt-1">Accepts PDF files only. Click to browse filesystem.</p>
                  </div>
                )}
              </div>

              {/* Metadata Fields */}
              <div className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Document Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. IGCSE Physics Paper 4 May 2023"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Curriculum Level *</label>
                  <select
                    className="form-input"
                    value={curriculumLevelId}
                    onChange={(e) => setCurriculumLevelId(e.target.value)}
                    required
                  >
                    {curriculumLevels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Source Type</label>
                    <select
                      className="form-input"
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value as SourceType)}
                    >
                      <option value="past_paper">Past Paper</option>
                      <option value="topical">Topical Compilation</option>
                      <option value="custom">Custom Material</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Exam Year</label>
                    <input
                      type="number"
                      className="form-input font-mono-numbers"
                      placeholder="2023"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-lg bg-danger-light text-danger border border-danger text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isProcessing && (
              <div className="p-4 rounded-lg bg-accent-light border border-accent/30 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-xs font-semibold text-accent">{progressStage}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary justify-center py-2.5 shadow-md"
              disabled={isProcessing || !selectedFile || !title.trim() || !curriculumLevelId}
            >
              {isProcessing ? 'Indexing Paper with AI...' : 'Upload & Index Questions'}
            </button>
          </form>

          {/* Indexing Results Card */}
          {indexingResult && (
            <div className="mt-6 p-5 rounded-xl bg-success-light border border-success/30 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-success font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Successfully Indexed {indexingResult.questions_extracted} Questions!</span>
              </div>
              <p className="text-xs text-text-secondary">
                The questions have been tagged and saved to your searchable Question Bank.
              </p>

              {indexingResult.topics_found.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[11px] font-semibold text-text-muted mr-1">Topics identified:</span>
                  {indexingResult.topics_found.map((topic, i) => (
                    <span key={i} className="badge badge-success text-[11px]">
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 flex gap-3">
                <Link
                  href="/question-bank"
                  className="btn btn-primary py-1.5 text-xs px-4"
                >
                  View in Question Bank <ArrowRight size={14} />
                </Link>
                <Link
                  href="/papers/create"
                  className="btn btn-secondary py-1.5 text-xs px-4"
                >
                  Create Exam Paper
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Existing Paper Sources List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="font-bold text-base text-text-primary flex items-center gap-2">
              <FileText size={18} className="text-accent" />
              Indexed Paper Sources
            </h2>
            <button
              type="button"
              className="btn btn-outline py-1 px-2.5 text-xs"
              onClick={loadSources}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {isLoadingSources ? (
            <div className="p-8 text-center text-xs text-text-muted">Loading paper sources...</div>
          ) : sources.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted bg-bg-subtle rounded-lg border border-border">
              No paper sources uploaded yet. Use the upload box above to index your first PDF.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-bg-subtle text-text-secondary uppercase font-semibold">
                    <th className="p-3">Title</th>
                    <th className="p-3">Level</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Year</th>
                    <th className="p-3 font-mono-numbers">Questions</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Uploaded</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sources.map((src) => (
                    <tr key={src.id} className="hover:bg-bg-subtle/50">
                      <td className="p-3 font-semibold text-text-primary">{src.title}</td>
                      <td className="p-3 text-text-secondary">{src.curriculum_level?.name || 'N/A'}</td>
                      <td className="p-3 text-text-secondary">{src.source_type.replace('_', ' ').toUpperCase()}</td>
                      <td className="p-3 font-mono-numbers text-text-muted">{src.year || '—'}</td>
                      <td className="p-3 font-mono-numbers font-bold text-accent">{src.question_count}</td>
                      <td className="p-3">
                        <span
                          className={`badge ${
                            src.index_status === 'complete'
                              ? 'badge-success'
                              : src.index_status === 'processing'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {src.index_status}
                        </span>
                      </td>
                      <td className="p-3 text-text-muted">{formatDate(src.uploaded_at)}</td>
                      <td className="p-3 text-right flex items-center justify-end gap-2">
                        <Link
                          href={`/question-bank?source_id=${src.id}`}
                          className="btn btn-outline py-1 px-2.5 text-[11px]"
                        >
                          View Questions
                        </Link>
                        <button
                          type="button"
                          className="p-1.5 text-text-muted hover:text-danger rounded-md hover:bg-danger-light"
                          onClick={() => handleDeleteSource(src.id)}
                          title="Delete source"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import DropZone from '@/components/upload/DropZone'
import ParsedDataPreview from '@/components/upload/ParsedDataPreview'
import ProcessingStatus from '@/components/upload/ProcessingStatus'
import { getUploads } from '@/lib/supabase/queries/uploads'
import { getClasses } from '@/lib/supabase/queries/classes'
import type { Upload, Class, ParsedDataResult } from '@/lib/types'
import { formatDate, formatTimeAgo } from '@/lib/utils'
import { UploadCloud, CheckCircle, AlertTriangle, RefreshCw, Layers } from 'lucide-react'

export default function UploadPage() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Upload & processing state
  const [stage, setStage] = useState<'idle' | 'uploading' | 'reading' | 'understanding' | 'complete' | 'failed'>('idle')
  const [currentFileName, setCurrentFileName] = useState('')
  const [parseResult, setParseResult] = useState<ParsedDataResult | null>(null)
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Selected Class for import
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    const [upls, clss] = await Promise.all([getUploads(), getClasses()])
    setUploads(upls)
    setClasses(clss)
    if (clss.length > 0) setSelectedClassId(clss[0].id)
    setIsLoading(false)
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1] || ''
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  async function handleFileSelected(file: File) {
    setCurrentFileName(file.name)
    setErrorMessage(null)
    setActionSuccessMsg(null)
    setParseResult(null)

    // Stage 1: Uploading
    setStage('uploading')
    await new Promise((r) => setTimeout(r, 300))

    // Stage 2: Reading
    setStage('reading')
    await new Promise((r) => setTimeout(r, 300))

    // Stage 3: Understanding
    setStage('understanding')

    try {
      const base64Data = await fileToBase64(file)

      const res = await fetch('/api/upload/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          base64: base64Data,
        }),
      })

      let data: any = {}
      const rawText = await res.text()
      try {
        data = JSON.parse(rawText)
      } catch {
        data = { error: 'Server error processing file. Please verify the file format.' }
      }

      if (!res.ok || data.error) {
        setStage('failed')
        setErrorMessage(data.error || `Server returned error (${res.status})`)
        return
      }

      setParseResult(data.parsed_data)
      setCurrentUploadId(data.upload_id)
      setStage('complete')
      loadData()
    } catch (err: any) {
      setStage('failed')
      setErrorMessage(err.message || 'Failed to process file.')
    }
  }

  async function handleExecuteAction(action: 'import_attendance' | 'import_grades' | 'import_students' | 'analyze_performance') {
    if (!currentUploadId) return
    setIsProcessingAction(true)
    setActionSuccessMsg(null)

    try {
      const res = await fetch('/api/upload/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_id: currentUploadId,
          action,
          class_id: selectedClassId,
        }),
      })

      const data = await res.json()
      if (data.error) {
        setErrorMessage(data.error)
      } else {
        if (action === 'analyze_performance') {
          setActionSuccessMsg('Automated AI Performance Analysis completed! Check Pending Suggestions for action items.')
        } else {
          setActionSuccessMsg(`Successfully imported data into the selected class roster!`)
        }
        loadData()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Action failed.')
    } finally {
      setIsProcessingAction(false)
    }
  }

  function handleSampleFile(type: 'grades' | 'attendance') {
    const csvContent = type === 'grades'
      ? `Student Name,Roll Number,Midterm Score,Total Marks,Grade\nAlexander Wright,P-101,88,100,A\nBeatrice Chen,P-102,94,100,A*\nCarlos Mendez,P-103,62,100,C\nDina Patel,P-104,79,100,B\nEthan Hunt,P-105,85,100,A`
      : `Student Name,Roll Number,July 28,July 29,July 30,Status\nAlexander Wright,P-101,Present,Present,Present,Present\nBeatrice Chen,P-102,Present,Present,Present,Present\nCarlos Mendez,P-103,Absent,Present,Absent,Absent\nDina Patel,P-104,Present,Present,Present,Present\nEthan Hunt,P-105,Present,Absent,Present,Present`

    const fileName = type === 'grades' ? 'Physics_Midterm_Grades_Sample.csv' : 'Physics_July_Attendance_Sample.csv'
    const sampleFile = new File([csvContent], fileName, { type: 'text/csv' })
    handleFileSelected(sampleFile)
  }

  return (
    <AppShell>
      <Header
        title="LMS File Processing Hub"
        subtitle="Upload exported Excel, CSV, PDF, or image files from your academy LMS"
      />

      <div className="page-body flex flex-col gap-6">
        {/* DropZone Section */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-3 text-text-primary">
            UPLOAD LMS EXPORT FILE
          </h2>

          <DropZone onFileSelected={handleFileSelected} disabled={stage === 'uploading' || stage === 'reading' || stage === 'understanding'} />

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border">
            <span className="text-xs text-text-muted font-medium">Or test with 1-click sample file:</span>
            <button
              type="button"
              className="btn btn-secondary py-1 px-3 text-xs text-accent hover:bg-accent-light border-accent/20 font-medium"
              onClick={() => handleSampleFile('grades')}
              disabled={stage === 'uploading' || stage === 'reading' || stage === 'understanding'}
            >
              📄 Try Sample Grade Sheet (.csv)
            </button>
            <button
              type="button"
              className="btn btn-secondary py-1 px-3 text-xs text-accent hover:bg-accent-light border-accent/20 font-medium"
              onClick={() => handleSampleFile('attendance')}
              disabled={stage === 'uploading' || stage === 'reading' || stage === 'understanding'}
            >
              📊 Try Sample Attendance Sheet (.csv)
            </button>
          </div>

          {/* Processing Status Bar */}
          {stage !== 'idle' && (
            <div className="mt-4">
              <ProcessingStatus stage={stage} fileName={currentFileName} errorMessage={errorMessage} />
            </div>
          )}

          {actionSuccessMsg && (
            <div className="mt-4 p-3.5 rounded-lg bg-success-light text-success border border-success text-xs font-medium flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{actionSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Parsed Results Section */}
        {stage === 'complete' && parseResult && (
          <div className="card border-accent/40 bg-accent-light/10 flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-success" size={20} />
                <div>
                  <h3 className="font-bold text-sm text-text-primary">File Extracted & Analyzed</h3>
                  <div className="text-xs text-text-muted">
                    Detected: <span className="font-semibold text-accent capitalize">{parseResult.detected_type.replace('_', ' ')}</span> ({(parseResult.confidence * 100).toFixed(0)}% confidence)
                  </div>
                </div>
              </div>

              {/* Class selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-secondary">Target Class:</span>
                <select
                  className="form-input form-select text-xs py-1 px-2.5 max-w-[200px]"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap gap-2">
              {parseResult.detected_type.includes('attendance') && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleExecuteAction('import_attendance')}
                  disabled={isProcessingAction}
                >
                  Import Attendance Records
                </button>
              )}

              {parseResult.detected_type.includes('grade') || parseResult.detected_type.includes('exam') ? (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleExecuteAction('analyze_performance')}
                    disabled={isProcessingAction}
                  >
                    ⚡ Run AI Performance Analysis
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleExecuteAction('import_grades')}
                    disabled={isProcessingAction}
                  >
                    Import Grades to Class
                  </button>
                </>
              ) : null}

              {parseResult.detected_type.includes('student') && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleExecuteAction('import_students')}
                  disabled={isProcessingAction}
                >
                  Import Students to Roster
                </button>
              )}
            </div>

            {/* Extracted Data Preview Table */}
            <ParsedDataPreview parsedData={parseResult} />
          </div>
        )}

        {/* Recent Uploads Table */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <UploadCloud size={16} className="text-accent" />
              <h2 className="font-semibold text-sm">Upload History & Parse Log</h2>
            </div>
            <button className="btn btn-ghost btn-sm text-xs" onClick={loadData}>
              <RefreshCw size={12} /> Refresh Log
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="spinner spinner-md" />
            </div>
          ) : uploads.length === 0 ? (
            <div className="empty-state py-8 text-xs">
              No files uploaded yet. Drag an LMS file into the upload zone above.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Detected Data Type</th>
                  <th>Parse Status</th>
                  <th>Uploaded Date</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upl) => (
                  <tr key={upl.id}>
                    <td className="font-medium">{upl.file_name}</td>
                    <td className="capitalize text-text-secondary">
                      {upl.detected_data_type ? upl.detected_data_type.replace('_', ' ') : '—'}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          upl.parse_status === 'complete'
                            ? 'bg-success-light text-success'
                            : upl.parse_status === 'failed'
                            ? 'bg-danger-light text-danger'
                            : 'bg-warning-light text-warning'
                        }`}
                      >
                        {upl.parse_status}
                      </span>
                    </td>
                    <td className="text-text-muted text-xs">{formatDate(upl.uploaded_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  )
}

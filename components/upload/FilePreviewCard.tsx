'use client'

import React from 'react'
import { FileText, FileSpreadsheet, Image as ImageIcon, AlertCircle } from 'lucide-react'

interface FilePreviewCardProps {
  fileName: string
  fileType: string
  status: string
  error?: string | null
}

export default function FilePreviewCard({ fileName, fileType, status, error }: FilePreviewCardProps) {
  const getIcon = () => {
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) return <FileSpreadsheet className="text-emerald-600" size={24} />
    if (fileName.endsWith('.pdf')) return <FileText className="text-red-500" size={24} />
    return <ImageIcon className="text-blue-500" size={24} />
  }

  return (
    <div className="p-4 rounded-lg border border-border bg-bg-surface flex items-center justify-between">
      <div className="flex items-center gap-3">
        {getIcon()}
        <div>
          <div className="font-bold text-sm text-text-primary">{fileName}</div>
          <div className="text-xs text-text-muted capitalize">{fileType || 'LMS Data Document'}</div>
        </div>
      </div>

      <span
        className={`badge ${
          status === 'complete'
            ? 'bg-success-light text-success'
            : status === 'failed'
            ? 'bg-danger-light text-danger'
            : 'bg-warning-light text-warning'
        }`}
      >
        {status}
      </span>
    </div>
  )
}

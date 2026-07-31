'use client'

import React from 'react'
import { CheckCircle, AlertTriangle } from 'lucide-react'

interface ProcessingStatusProps {
  stage: 'idle' | 'uploading' | 'reading' | 'understanding' | 'complete' | 'failed'
  fileName: string
  errorMessage?: string | null
}

export default function ProcessingStatus({ stage, fileName, errorMessage }: ProcessingStatusProps) {
  if (stage === 'idle') return null

  return (
    <div className="p-4 rounded-lg border border-border bg-bg-surface flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {stage === 'complete' ? (
            <CheckCircle className="text-success" size={20} />
          ) : stage === 'failed' ? (
            <AlertTriangle className="text-danger" size={20} />
          ) : (
            <span className="spinner spinner-md" />
          )}

          <div className="font-bold text-sm text-text-primary">
            {stage === 'uploading' && `Stage 1: Uploading ${fileName}...`}
            {stage === 'reading' && `Stage 2: Reading file contents...`}
            {stage === 'understanding' && `Stage 3: Gemini AI identifying data type & extracting structure...`}
            {stage === 'complete' && `Stage 4: Extraction Complete!`}
            {stage === 'failed' && `Processing Failed`}
          </div>
        </div>

        <span className="text-xs text-text-muted capitalize font-mono">{stage}</span>
      </div>

      {/* Progress Bar for uploading */}
      {stage === 'uploading' && (
        <div className="w-full h-2 bg-bg-subtle rounded-full overflow-hidden">
          <div className="h-full bg-accent animate-pulse w-3/4" />
        </div>
      )}

      {stage === 'failed' && errorMessage && (
        <div className="p-2.5 rounded bg-danger-light text-danger text-xs border border-danger">
          {errorMessage}
        </div>
      )}
    </div>
  )
}

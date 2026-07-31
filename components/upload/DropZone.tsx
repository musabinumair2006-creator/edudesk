'use client'

import React, { useRef, useState } from 'react'
import { UploadCloud, FileSpreadsheet, FileText, Image as ImageIcon } from 'lucide-react'

interface DropZoneProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
}

export default function DropZone({ onFileSelected, disabled }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0])
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0])
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
        isDragOver
          ? 'border-accent bg-accent-light/40'
          : 'border-border-strong bg-bg-surface hover:border-accent hover:bg-bg-subtle'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleInputChange}
        disabled={disabled}
      />

      <div className="p-4 rounded-full bg-accent-light text-accent mb-3">
        <UploadCloud size={36} />
      </div>

      <h3 className="font-bold text-base text-text-primary">
        Drop any file from your academy LMS here
      </h3>
      <p className="text-xs text-text-secondary mt-1 max-w-md">
        Upload grade sheets, attendance registers, exam results, or scanned images. The AI will automatically extract and understand the content.
      </p>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <FileSpreadsheet size={14} className="text-emerald-600" /> Excel (.xlsx, .csv)
        </span>
        <span className="flex items-center gap-1">
          <FileText size={14} className="text-red-500" /> PDF Text
        </span>
        <span className="flex items-center gap-1">
          <ImageIcon size={14} className="text-blue-500" /> Scanned Images (OCR)
        </span>
      </div>
    </div>
  )
}

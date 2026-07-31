'use client'

import React, { useState } from 'react'

interface AssignmentEditorProps {
  initialContent: string
  onSave: (content: string) => void
}

export default function AssignmentEditor({ initialContent, onSave }: AssignmentEditorProps) {
  const [content, setContent] = useState(initialContent)

  return (
    <div className="flex flex-col gap-3">
      <textarea
        className="form-input font-mono text-xs min-h-[250px]"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type physics questions or markdown content..."
      />
      <div className="flex justify-end">
        <button className="btn btn-primary btn-sm" onClick={() => onSave(content)}>
          Save Content
        </button>
      </div>
    </div>
  )
}

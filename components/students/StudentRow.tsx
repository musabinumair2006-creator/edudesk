'use client'

import React from 'react'
import Link from 'next/link'
import type { Student } from '@/lib/types'
import { ArrowRight, User } from 'lucide-react'

interface StudentRowProps {
  student: Student
}

export default function StudentRow({ student }: StudentRowProps) {
  return (
    <tr>
      <td className="font-mono text-xs text-text-muted">{student.roll_number || 'PHY-101'}</td>
      <td className="font-bold text-text-primary">
        <Link href={`/students/${student.id}`} className="hover:text-accent hover:underline">
          {student.full_name}
        </Link>
      </td>
      <td className="text-xs text-text-secondary">{student.class?.name || 'Grade 12 Physics'}</td>
      <td className="font-mono text-xs font-semibold text-success">85%</td>
      <td>
        <span className="badge bg-success-light text-success">Active</span>
      </td>
      <td>
        <Link href={`/students/${student.id}`} className="btn btn-secondary btn-sm flex items-center gap-1 text-xs">
          <span>Profile</span>
          <ArrowRight size={12} />
        </Link>
      </td>
    </tr>
  )
}

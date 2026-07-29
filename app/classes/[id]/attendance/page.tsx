'use client'

import { useParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import AttendanceSheet from '@/components/attendance/AttendanceSheet'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ClassAttendancePage() {
  const { id } = useParams<{ id: string }>()

  return (
    <AppShell>
      <Header
        title="Attendance"
        subtitle="Mark and review session attendance"
        actions={
          <Link href={`/classes/${id}`} className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> Back to Class
          </Link>
        }
      />
      <div className="page-body">
        <AttendanceSheet classId={id} />
      </div>
    </AppShell>
  )
}

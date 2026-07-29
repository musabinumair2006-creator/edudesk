'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface SummaryRow {
  student_id: string
  name: string
  summary: {
    total: number
    present: number
    absent: number
    late: number
    excused: number
    percentage: number
  }
}

interface Props {
  data: SummaryRow[]
}

export default function AttendanceSummaryChart({ data }: Props) {
  const chartData = data.map((row) => ({
    name: row.name.split(' ')[0], // Use first name for brevity
    Present: row.summary.present,
    Absent: row.summary.absent,
    Late: row.summary.late,
    Excused: row.summary.excused,
  }))

  if (chartData.length === 0) return null

  return (
    <div>
      <div className="label-sm mb-3">Attendance Breakdown by Student</div>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="var(--border)"
          />
          <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px' }}
          />
          <Bar dataKey="Present" fill="var(--success)" radius={[0, 3, 3, 0]} />
          <Bar dataKey="Absent" fill="var(--danger)" radius={[0, 3, 3, 0]} />
          <Bar dataKey="Late" fill="var(--warning)" radius={[0, 3, 3, 0]} />
          <Bar dataKey="Excused" fill="var(--accent)" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

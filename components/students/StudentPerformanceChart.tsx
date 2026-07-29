'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

interface DataPoint {
  date: string
  title: string
  percentage: number
  marks: number
  total: number
}

interface Props {
  data: DataPoint[]
}

export default function StudentPerformanceChart({ data }: Props) {
  if (data.length === 0) return null

  const chartData = data.map((d, i) => ({
    name: data.length <= 10 ? format(new Date(d.date), 'MMM d') : `#${i + 1}`,
    percentage: d.percentage,
    title: d.title,
    marks: `${d.marks}/${d.total}`,
  }))

  // Determine trend color
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, d) => s + d.percentage, 0) / firstHalf.length : 0
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, d) => s + d.percentage, 0) / secondHalf.length : 0
  const isImproving = secondAvg >= firstAvg
  const lineColor = isImproving ? 'var(--success)' : 'var(--warning)'

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null
              const d = payload[0].payload
              return (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '12px',
                  }}
                >
                  <div className="font-semibold mb-1">{d.title}</div>
                  <div>
                    Score:{' '}
                    <span className="font-mono font-semibold" style={{ color: lineColor }}>
                      {d.marks}
                    </span>
                  </div>
                  <div>
                    Percentage:{' '}
                    <span className="font-mono font-semibold" style={{ color: lineColor }}>
                      {d.percentage}%
                    </span>
                  </div>
                </div>
              )
            }}
          />
          <ReferenceLine y={70} stroke="var(--success)" strokeDasharray="4 2" strokeWidth={1} label={{ value: '70%', fill: 'var(--success)', fontSize: 10 }} />
          <ReferenceLine y={50} stroke="var(--danger)" strokeDasharray="4 2" strokeWidth={1} label={{ value: '50%', fill: 'var(--danger)', fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ fill: lineColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5" style={{ background: 'var(--success)' }} /> Trend: {isImproving ? '↑ Improving' : '↓ Declining'}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: 'var(--success)' }} /> Pass threshold (70%)
        </div>
      </div>
    </div>
  )
}

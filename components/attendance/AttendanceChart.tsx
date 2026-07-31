'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const data = [
  { week: 'Week 1', percentage: 92 },
  { week: 'Week 2', percentage: 88 },
  { week: 'Week 3', percentage: 84 },
  { week: 'Week 4', percentage: 89 },
]

export default function AttendanceChart() {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} tickLine={false} />
          <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#0F172A', color: '#FFF', borderRadius: '6px', border: 'none', fontSize: '12px' }}
            formatter={(value: any) => [`${value}% Attendance`, 'Rate']}
          />
          <Bar dataKey="percentage" fill="#2563EB" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

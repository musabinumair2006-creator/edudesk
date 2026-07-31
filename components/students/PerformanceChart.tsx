'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const performanceData = [
  { date: 'Quiz 1', percentage: 92 },
  { date: 'Homework 1', percentage: 85 },
  { date: 'Midterm', percentage: 78 },
  { date: 'Quiz 2', percentage: 84 },
  { date: 'Lab Report', percentage: 90 },
]

export default function PerformanceChart() {
  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
          <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#0F172A', color: '#FFF', borderRadius: '6px', border: 'none', fontSize: '12px' }}
            formatter={(value: any) => [`${value}% Marks`, 'Score']}
          />
          <Line type="monotone" dataKey="percentage" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

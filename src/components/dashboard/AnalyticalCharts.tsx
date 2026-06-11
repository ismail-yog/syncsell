'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const seoTrendData = [
  { name: 'Mon', score: 65 },
  { name: 'Tue', score: 72 },
  { name: 'Wed', score: 85 },
  { name: 'Thu', score: 82 },
  { name: 'Fri', score: 95 },
  { name: 'Sat', score: 98 },
  { name: 'Sun', score: 99 },
];

const syncData = [
  { name: 'Shopify', value: 1248 },
  { name: 'eBay', value: 1180 },
];

export function AnalyticalCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Wave-form Line Graph */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 col-span-1 lg:col-span-2 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-[100px] pointer-events-none" />
        <h3 className="text-xl font-heading font-thin glow-text mb-6">SEO Score Trend</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seoTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 180, 216, 0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(10, 17, 40, 0.9)',
                  borderColor: 'rgba(0, 180, 216, 0.3)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#00B4D8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#00B4D8', strokeWidth: 2, stroke: '#03040B' }}
                activeDot={{ r: 6, fill: '#0077B6', stroke: '#00B4D8', strokeWidth: 2 }}
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(0, 180, 216, 0.6))',
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="flex flex-col gap-6 col-span-1">
        {/* Circular Progress Ring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden h-full"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[50px] pointer-events-none" />
          <h3 className="text-sm font-heading font-thin text-text-muted mb-4">Overall Optimization</h3>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(0, 180, 216, 0.1)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#00B4D8"
                strokeWidth="8"
                fill="none"
                strokeDasharray="351.8"
                strokeDashoffset={351.8 - (351.8 * 95) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0, 180, 216, 0.5))' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-heading font-bold glow-text">95%</span>
            </div>
          </div>
        </motion.div>

        {/* High-Tech Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 h-full"
        >
          <h3 className="text-sm font-heading font-thin text-text-muted mb-4">Active Sync Channels</h3>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={syncData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={12} width={60} axisLine={false} tickLine={false} />
                <Bar
                  dataKey="value"
                  fill="#0077B6"
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                  style={{ filter: 'drop-shadow(0 0 4px rgba(0, 119, 182, 0.5))' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

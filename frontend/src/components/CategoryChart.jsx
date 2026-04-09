import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function toChartData(countsByCategory) {
  const entries = Object.entries(countsByCategory || {})
  return entries
    .map(([category, count]) => ({ category, count: Number(count) }))
    .sort((a, b) => b.count - a.count)
}

export default function CategoryChart({ countsByCategory }) {
  const data = toChartData(countsByCategory)

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 hover:border-slate-700 transition">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">Complaints by Category</h2>
        <p className="text-xs text-slate-400">Bar chart</p>
      </div>

      <div className="mt-4 h-72">
        {data.length === 0 ? (
          <div className="h-full grid place-items-center text-slate-400 text-sm">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="category" stroke="rgba(148,163,184,0.8)" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
              <YAxis stroke="rgba(148,163,184,0.8)" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(51,65,85,1)',
                  borderRadius: 12,
                  color: 'rgba(241,245,249,1)',
                }}
                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              />
              <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="rgba(56,189,248,0.9)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

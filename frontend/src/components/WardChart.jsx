import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

function toChartData(countsByWard) {
  const entries = Object.entries(countsByWard || {})
  return entries
    .map(([ward, count]) => ({ ward: ward === 'unknown' ? 'Unspecified' : String(ward), count: Number(count) }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
}

const COLORS = [
  'rgba(167,139,250,0.95)',
  'rgba(34,211,238,0.95)',
  'rgba(244,114,182,0.95)',
  'rgba(250,204,21,0.95)',
  'rgba(74,222,128,0.95)',
  'rgba(251,146,60,0.95)',
]

export default function WardChart({ countsByWard }) {
  const data = toChartData(countsByWard)

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 hover:border-slate-700 transition">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">Ward Distribution</h2>
        <p className="text-xs text-slate-400">Pie chart</p>
      </div>

      <div className="mt-4 h-72">
        {data.length === 0 ? (
          <div className="h-full grid place-items-center text-slate-400 text-sm">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(51,65,85,1)',
                  borderRadius: 12,
                  color: 'rgba(241,245,249,1)',
                }}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="ward"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={55}
                paddingAngle={2}
                stroke="rgba(15,23,42,1)"
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {data.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
          {data.slice(0, 6).map((d, idx) => (
            <div key={d.ward} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: COLORS[idx % COLORS.length] }}
              />
              <span className="truncate">Ward {d.ward}</span>
              <span className="ml-auto text-slate-400 tabular-nums">{d.count}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

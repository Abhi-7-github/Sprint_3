export default function TopIssues({ topRecurringIssues }) {
  const issues = Array.isArray(topRecurringIssues) ? topRecurringIssues : []

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 hover:border-slate-700 transition">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">Top Recurring Issues</h2>
        <p className="text-xs text-slate-400">Most frequent descriptions</p>
      </div>

      {issues.length === 0 ? (
        <div className="mt-4 text-slate-400 text-sm">No recurring issues yet.</div>
      ) : (
        <div className="mt-4 grid gap-3">
          {issues.map((issue, idx) => (
            <div
              key={`${issue.description}-${idx}`}
              className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-800/60 grid place-items-center text-slate-200 font-semibold">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-slate-100 leading-snug break-words">
                    {issue.description || '(empty)'}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Count: <span className="tabular-nums text-slate-200">{issue.count}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

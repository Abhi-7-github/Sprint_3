import { useEffect, useMemo, useState } from 'react'

import CategoryChart from '../components/CategoryChart'
import WardChart from '../components/WardChart'
import TopIssues from '../components/TopIssues'

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 hover:border-slate-700 transition">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-100 tabular-nums">
        {value ?? '—'}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
    [],
  )

  const [adminPassword, setAdminPassword] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadInsights() {
    setError('')
    setLoading(true)
    try {
      const resp = await fetch(`${apiBaseUrl}/insights`, {
        headers: adminPassword ? { 'admin-password': adminPassword } : {},
      })

      const contentType = resp.headers.get('content-type') || ''
      const body = contentType.includes('application/json')
        ? await resp.json()
        : await resp.text()

      if (!resp.ok) {
        const message =
          typeof body === 'object' && body && body.detail
            ? String(body.detail)
            : `Request failed (${resp.status})`
        throw new Error(message)
      }

      setData(body)
    } catch (e) {
      setData(null)
      setError(e?.message || 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  // Auto-load when the password is filled (common dashboard flow)
  useEffect(() => {
    if (!adminPassword) return
    loadInsights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminPassword])

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-100">
              Municipal Insights Dashboard
            </h1>
            <p className="mt-2 text-slate-400">
              Visual analytics for municipal grievance resolution.
            </p>
          </div>

          <div className="w-full md:w-[420px]">
            <label className="block text-sm text-slate-300">Admin password</label>
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                type="password"
                placeholder="Required for /insights"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={loadInsights}
                className="rounded-xl bg-sky-500/90 hover:bg-sky-500 px-4 py-2 text-slate-950 font-semibold transition"
              >
                Refresh
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">API: {apiBaseUrl}/insights</p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-900/60 bg-rose-950/30 p-4 text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-slate-300">
            Loading insights…
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard label="Total Complaints" value={data?.totalComplaints} />
          <SummaryCard label="Most Common Category" value={data?.mostCommonCategory} />
          <SummaryCard label="Most Affected Ward" value={data?.mostAffectedWard} />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoryChart countsByCategory={data?.countsByCategory} />
          <WardChart countsByWard={data?.countsByWard} />
        </div>

        <div className="mt-6">
          <TopIssues topRecurringIssues={data?.topRecurringIssues} />
        </div>
      </div>
    </div>
  )
}

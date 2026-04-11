import { useEffect, useMemo, useState } from 'react'

import CategoryChart from '../components/CategoryChart'
import WardChart from '../components/WardChart'
import TopIssues from '../components/TopIssues'
import { getMlInsights } from '../api'

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

  const [mlData, setMlData] = useState(null)
  const [mlLoading, setMlLoading] = useState(false)
  const [mlError, setMlError] = useState('')

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

  async function loadMlInsights() {
    setMlError('')
    setMlLoading(true)
    try {
      const body = await getMlInsights(apiBaseUrl, adminPassword ? adminPassword.trim() : '')
      setMlData(body)
    } catch (e) {
      setMlData(null)
      setMlError(e?.message || 'Failed to load ML insights')
    } finally {
      setMlLoading(false)
    }
  }

  // Auto-load when the password is filled (common dashboard flow)
  useEffect(() => {
    if (!adminPassword) return
    loadInsights()
    loadMlInsights()
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
                onClick={() => {
                  loadInsights()
                  loadMlInsights()
                }}
                className="rounded-xl bg-sky-500/90 hover:bg-sky-500 px-4 py-2 text-slate-950 font-semibold transition"
              >
                Refresh
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">API: {apiBaseUrl}/insights</p>
            <p className="mt-1 text-xs text-slate-500">API: {apiBaseUrl}/ml-insights</p>
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

        {mlError ? (
          <div className="mt-6 rounded-2xl border border-rose-900/60 bg-rose-950/30 p-4 text-rose-200">
            {mlError}
          </div>
        ) : null}

        {mlLoading ? (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-slate-300">
            Loading ML insights…
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

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-100">Recurring Issue Clusters</h2>
              <div className="text-xs text-slate-500">TF-IDF + KMeans</div>
            </div>

            {mlData?.message ? (
              <div className="mt-4 text-sm text-slate-400">{mlData.message}</div>
            ) : null}

            {!mlData?.clusters?.length ? (
              <div className="mt-4 text-sm text-slate-400">No clusters available yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {mlData.clusters.map((c, idx) => (
                  <div key={`${c.issue}-${idx}`} className="rounded-xl border border-slate-800 bg-slate-950/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-slate-100 font-semibold">{c.issue}</div>
                      </div>
                      <div className="text-sm text-slate-200 tabular-nums">{c.count}</div>
                    </div>

                    {c.wards?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {c.wards.map((w) => (
                          <span
                            key={`${c.issue}-${w}`}
                            className="inline-flex items-center rounded-full border border-slate-800 bg-slate-950/30 px-2 py-1 text-xs font-semibold text-slate-200"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-100">Predicted Categories</h2>
              <div className="text-xs text-slate-500">TF-IDF + Logistic Regression</div>
            </div>

            {!mlData?.predictedCategories?.length ? (
              <div className="mt-4 text-sm text-slate-400">No predictions available yet.</div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="py-2 pr-4">Predicted</th>
                      <th className="py-2 pr-4">Actual</th>
                      <th className="py-2 pr-4">Confidence</th>
                      <th className="py-2 pr-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    {mlData.predictedCategories.slice(0, 10).map((p, idx) => (
                      <tr key={`${p.description}-${idx}`} className="border-t border-slate-800/80">
                        <td className="py-3 pr-4 whitespace-nowrap font-semibold text-slate-100">
                          {p.predicted}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap text-slate-300">
                          {p.actual ?? '—'}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap text-slate-300 tabular-nums">
                          {typeof p.confidence === 'number' ? p.confidence.toFixed(3) : '—'}
                        </td>
                        <td className="py-3 pr-4 text-slate-300">
                          {p.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 text-xs text-slate-500">
                  Showing 10 of {mlData.predictedCategories.length}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

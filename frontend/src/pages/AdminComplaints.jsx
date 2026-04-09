import { useMemo, useState } from 'react'

import { getAllComplaints, updateComplaintStatus } from '../api'

function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-700 text-slate-200 bg-slate-950/30',
    sky: 'border-sky-700/60 text-sky-200 bg-sky-950/30',
    amber: 'border-amber-700/60 text-amber-200 bg-amber-950/30',
    rose: 'border-rose-700/60 text-rose-200 bg-rose-950/30',
    emerald: 'border-emerald-700/60 text-emerald-200 bg-emerald-950/30',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
        tones[tone] || tones.slate
      }`}
    >
      {children}
    </span>
  )
}

function statusTone(status) {
  if (status === 'pending') return 'amber'
  if (status === 'in-progress') return 'sky'
  if (status === 'resolved') return 'emerald'
  return 'slate'
}

export default function AdminComplaints() {
  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
    [],
  )

  const [adminPassword, setAdminPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [updatingId, setUpdatingId] = useState('')

  async function load() {
    setError('')
    if (!adminPassword.trim()) {
      setError('Admin password is required to load complaints.')
      return
    }

    setLoading(true)
    try {
      const data = await getAllComplaints(apiBaseUrl, adminPassword.trim())
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  async function setStatus(id, nextStatus) {
    setError('')
    setUpdatingId(id)
    try {
      const updated = await updateComplaintStatus(apiBaseUrl, adminPassword.trim(), id, nextStatus)
      setItems((prev) => prev.map((c) => (c.id === id ? updated : c)))
    } catch (err) {
      setError(err?.message || 'Failed to update status')
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-100">Admin Complaints</h1>
          <p className="mt-2 text-slate-400">List and update complaint status.</p>
          <p className="mt-2 text-xs text-slate-500">API: {apiBaseUrl}/complaints (admin)</p>
        </div>

        <section className="mt-6 rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <label className="flex-1">
              <div className="text-sm text-slate-300">Admin Password</div>
              <input
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </label>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-sky-500/90 hover:bg-sky-500 disabled:opacity-60 px-4 py-2 text-slate-950 font-semibold transition"
            >
              {loading ? 'Loading…' : 'Load'}
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-900/60 bg-rose-950/30 p-3 text-rose-200 text-sm">
              {error}
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Ward</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Update</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {items.length === 0 ? (
                  <tr>
                    <td className="py-4 text-slate-400" colSpan={6}>
                      {loading ? 'Loading…' : 'No complaints loaded yet.'}
                    </td>
                  </tr>
                ) : (
                  items.map((c) => (
                    <tr key={c.id} className="border-t border-slate-800/80">
                      <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">
                        {c.createdAt ? String(c.createdAt) : '-'}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                        {c.id}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">{c.ward || '-'}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <Badge tone="slate">{c.category}</Badge>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <select
                          className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                          value={c.status}
                          disabled={updatingId === c.id}
                          onChange={(e) => setStatus(c.id, e.target.value)}
                        >
                          <option value="pending">pending</option>
                          <option value="in-progress">in-progress</option>
                          <option value="resolved">resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

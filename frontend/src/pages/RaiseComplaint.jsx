import { useMemo, useState } from 'react'

import { createComplaint, getComplaint } from '../api'

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <div className="text-sm text-slate-300">{label}</div>
      <div className="mt-2">{children}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </label>
  )
}

export default function RaiseComplaint() {
  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
    [],
  )

  const [form, setForm] = useState({
    description: '',
    ward: '',
    area: '',
    latitude: '',
    longitude: '',
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitResult, setSubmitResult] = useState(null)

  const [lookupId, setLookupId] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [lookupResult, setLookupResult] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setSubmitResult(null)

    const latitude = form.latitude === '' ? null : Number(form.latitude)
    const longitude = form.longitude === '' ? null : Number(form.longitude)

    if (latitude !== null && (Number.isNaN(latitude) || latitude < -90 || latitude > 90)) {
      setSubmitError('Latitude must be between -90 and 90 (or leave it blank).')
      return
    }
    if (longitude !== null && (Number.isNaN(longitude) || longitude < -180 || longitude > 180)) {
      setSubmitError('Longitude must be between -180 and 180 (or leave it blank).')
      return
    }

    const payload = {
      description: form.description,
      ward: form.ward.trim() ? form.ward.trim() : null,
      area: form.area.trim() ? form.area.trim() : null,
      latitude,
      longitude,
    }

    setSubmitLoading(true)
    try {
      const created = await createComplaint(apiBaseUrl, payload)
      setSubmitResult(created)
      if (created?.id) setLookupId(created.id)
      setForm({ description: '', ward: '', area: '', latitude: '', longitude: '' })
    } catch (err) {
      setSubmitError(err?.message || 'Failed to submit complaint')
    } finally {
      setSubmitLoading(false)
    }
  }

  async function onLookup(e) {
    e.preventDefault()
    setLookupError('')
    setLookupResult(null)

    setLookupLoading(true)
    try {
      const data = await getComplaint(apiBaseUrl, lookupId)
      setLookupResult(data)
    } catch (err) {
      setLookupError(err?.message || 'Failed to fetch complaint status')
    } finally {
      setLookupLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-100">Raise a Complaint</h1>
          <p className="mt-2 text-slate-400">
            Submit a grievance and track its status. No login required.
          </p>
          <p className="mt-2 text-xs text-slate-500">API: {apiBaseUrl}/complaints</p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-100">Submit Complaint</h2>

            <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4">
              <Field label="Description" hint="Required">
                <textarea
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  required
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Describe the issue (e.g., water leakage, garbage overflow...)"
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Ward" hint="Optional">
                  <input
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    value={form.ward}
                    onChange={(e) => setForm((s) => ({ ...s, ward: e.target.value }))}
                    placeholder="e.g., 12"
                  />
                </Field>
                <Field label="Area" hint="Optional">
                  <input
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    value={form.area}
                    onChange={(e) => setForm((s) => ({ ...s, area: e.target.value }))}
                    placeholder="e.g., Central"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Latitude" hint="Optional (-90..90)">
                  <input
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={form.latitude}
                    onChange={(e) => setForm((s) => ({ ...s, latitude: e.target.value }))}
                    placeholder="17.3850"
                  />
                </Field>
                <Field label="Longitude" hint="Optional (-180..180)">
                  <input
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={form.longitude}
                    onChange={(e) => setForm((s) => ({ ...s, longitude: e.target.value }))}
                    placeholder="78.4867"
                  />
                </Field>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-sky-500/90 hover:bg-sky-500 disabled:opacity-60 px-4 py-2 text-slate-950 font-semibold transition"
              >
                {submitLoading ? 'Submitting…' : 'Submit'}
              </button>
            </form>

            {submitError ? (
              <div className="mt-4 rounded-xl border border-rose-900/60 bg-rose-950/30 p-3 text-rose-200 text-sm">
                {submitError}
              </div>
            ) : null}

            {submitResult ? (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <div className="text-sm text-slate-200 font-semibold">Submitted</div>
                <div className="mt-1 text-xs text-slate-400">
                  Complaint ID: <span className="text-slate-100">{submitResult.id}</span>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-100">Check Status</h2>

            <form onSubmit={onLookup} className="mt-4 flex flex-col gap-3">
              <Field label="Complaint ID" hint="Paste the id you received after submission">
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="e.g., 69d7684d8ba8fba6df128f1b"
                />
              </Field>

              <button
                type="submit"
                disabled={lookupLoading}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950/30 hover:bg-slate-950/60 disabled:opacity-60 px-4 py-2 text-slate-100 font-semibold transition"
              >
                {lookupLoading ? 'Loading…' : 'Get Status'}
              </button>
            </form>

            {lookupError ? (
              <div className="mt-4 rounded-xl border border-rose-900/60 bg-rose-950/30 p-3 text-rose-200 text-sm">
                {lookupError}
              </div>
            ) : null}

            {lookupResult ? (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-200 font-semibold">Status</div>
                  <div className="text-xs text-slate-400">{lookupResult.createdAt}</div>
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-100">
                  {lookupResult.status}
                </div>
                <div className="mt-3 text-sm text-slate-300">
                  <div className="text-slate-400">Category</div>
                  <div className="text-slate-100">{lookupResult.category}</div>
                </div>
                <div className="mt-3 text-sm text-slate-300">
                  <div className="text-slate-400">Description</div>
                  <div className="text-slate-100 break-words">{lookupResult.description}</div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-400">
                Enter an ID to view status.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'

import Dashboard from './pages/Dashboard'
import AdminComplaints from './pages/AdminComplaints'
import RaiseComplaint from './pages/RaiseComplaint'

function App() {
  const [active, setActive] = useState('raise')

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-100">Municipal Portal</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActive('raise')}
              className={
                active === 'raise'
                  ? 'rounded-xl bg-sky-500/90 px-3 py-2 text-slate-950 text-sm font-semibold transition'
                  : 'rounded-xl border border-slate-800 bg-slate-950/30 hover:bg-slate-950/60 px-3 py-2 text-slate-100 text-sm font-semibold transition'
              }
            >
              Raise Complaint
            </button>
            <button
              type="button"
              onClick={() => setActive('dashboard')}
              className={
                active === 'dashboard'
                  ? 'rounded-xl bg-sky-500/90 px-3 py-2 text-slate-950 text-sm font-semibold transition'
                  : 'rounded-xl border border-slate-800 bg-slate-950/30 hover:bg-slate-950/60 px-3 py-2 text-slate-100 text-sm font-semibold transition'
              }
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActive('admin')}
              className={
                active === 'admin'
                  ? 'rounded-xl bg-sky-500/90 px-3 py-2 text-slate-950 text-sm font-semibold transition'
                  : 'rounded-xl border border-slate-800 bg-slate-950/30 hover:bg-slate-950/60 px-3 py-2 text-slate-100 text-sm font-semibold transition'
              }
            >
              Complaints
            </button>
          </div>
        </div>
      </div>

      {active === 'raise' ? (
        <RaiseComplaint />
      ) : active === 'admin' ? (
        <AdminComplaints />
      ) : (
        <Dashboard />
      )}
    </div>
  )
}

export default App

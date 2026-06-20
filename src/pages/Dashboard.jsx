import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import * as api from '../api'

export default function Dashboard() {
  const { profile, logout } = useAuth()
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getKpis()
      .then(data => {
        if (data.error) throw new Error(data.error)
        setKpis(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">PCMS Dashboard</h1>
          <p className="text-xs text-gray-500">Signed in as {profile?.full_name} ({profile?.role})</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading && <p className="text-sm text-gray-500">Loading dashboard...</p>}
        {error && <p className="text-sm text-red-600">Error: {error}</p>}

        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard label="Total Projects" value={kpis.total_projects} />
            <KpiCard label="Active Projects" value={kpis.active_projects} />
            <KpiCard label="Total Project Value" value={formatCurrency(kpis.total_project_value)} />
            <KpiCard label="Amount Received" value={formatCurrency(kpis.amount_received)} accent="green" />
            <KpiCard label="Outstanding" value={formatCurrency(kpis.outstanding_amount)} accent="amber" />
            <KpiCard label="Overdue" value={formatCurrency(kpis.overdue_amount)} accent="red" />
          </div>
        )}

        {kpis && kpis.total_projects === 0 && (
          <div className="mt-8 text-center py-12 border border-dashed border-gray-300 rounded-xl">
            <p className="text-sm text-gray-500">No projects yet. Client and project creation coming next.</p>
          </div>
        )}
      </main>
    </div>
  )
}

function KpiCard({ label, value, accent }) {
  const accentClass = {
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  }[accent] || 'text-gray-900'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-semibold ${accentClass}`}>{value}</p>
    </div>
  )
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

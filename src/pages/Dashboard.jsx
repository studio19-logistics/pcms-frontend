import { useEffect, useState } from 'react'
import * as api from '../api'

export default function Dashboard({ onNavigateToCollections }) {
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
    <div className="min-h-screen bg-surface bg-texture">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="font-serif text-3xl text-ink mb-6">Dashboard</h2>

        {loading && <p className="text-sm text-ink-dim">Loading dashboard...</p>}
        {error && <p className="text-sm text-red-400">Error: {error}</p>}

        {kpis && (kpis.payments_due_today > 0 || kpis.payments_overdue > 0 || kpis.payments_due_this_week > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {kpis.payments_overdue > 0 && (
              <AlertCard
                dot="bg-red-400"
                label={`${kpis.payments_overdue} Payment${kpis.payments_overdue === 1 ? '' : 's'} Overdue`}
                onClick={onNavigateToCollections}
              />
            )}
            {kpis.payments_due_today > 0 && (
              <AlertCard
                dot="bg-amber-400"
                label={`${kpis.payments_due_today} Due Today`}
                onClick={onNavigateToCollections}
              />
            )}
            {kpis.payments_due_this_week > 0 && (
              <AlertCard
                dot="bg-yellow-300"
                label={`${kpis.payments_due_this_week} Due This Week`}
                onClick={onNavigateToCollections}
              />
            )}
          </div>
        )}

        {kpis && (
          <>
            {/* Hero stat — mirrors the reference's big "Income $1,209" card */}
            <div className="bg-surface-card rounded-card border border-surface-border p-5 mb-4">
              <p className="text-xs text-ink-dim mb-1">Total Project Value</p>
              <p className="text-4xl font-serif text-ink">{formatCurrency(kpis.total_project_value)}</p>
              <p className="text-xs text-ink-faint mt-1">across {kpis.total_projects} project{kpis.total_projects === 1 ? '' : 's'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Active Projects" value={kpis.active_projects} />
              <StatCard label="Total Projects" value={kpis.total_projects} />
              <StatCard label="Amount Received" value={formatCurrency(kpis.amount_received)} accent="text-emerald-300" />
              <StatCard label="Outstanding" value={formatCurrency(kpis.outstanding_amount)} accent="text-amber-300" />
              <StatCard label="Overdue" value={formatCurrency(kpis.overdue_amount)} accent="text-red-300" full />
            </div>
          </>
        )}

        {kpis && kpis.total_projects === 0 && (
          <div className="mt-8 text-center py-12 border border-dashed border-surface-border rounded-card">
            <p className="text-sm text-ink-dim">No projects yet. Head to Projects to create your first one.</p>
          </div>
        )}
      </main>
    </div>
  )
}

function AlertCard({ dot, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 bg-surface-card border border-surface-border rounded-card px-4 py-3 text-sm font-medium text-left text-ink hover:bg-surface-raised transition"
    >
      <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
      <span>{label}</span>
    </button>
  )
}

function StatCard({ label, value, accent, full }) {
  return (
    <div className={`bg-surface-card border border-surface-border rounded-card p-4 ${full ? 'col-span-2' : ''}`}>
      <p className="text-xs text-ink-dim mb-1">{label}</p>
      <p className={`text-2xl font-serif ${accent || 'text-ink'}`}>{value}</p>
    </div>
  )
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}
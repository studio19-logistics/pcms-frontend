import { useEffect, useState } from 'react'
import * as api from '../api'

export default function Collections({ onOpenProject }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overdue')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const result = await api.getCollections()
    if (result.error) setError(result.error)
    else setData(result)
    setLoading(false)
  }

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-8"><p className="text-sm text-gray-500">Loading collections...</p></div>
  if (error) return <div className="max-w-4xl mx-auto px-6 py-8"><p className="text-sm text-red-600">{error}</p></div>

  const TABS = [
    { id: 'overdue', label: 'Overdue', count: data.overdue.length, color: 'red' },
    { id: 'due_today', label: 'Due Today', count: data.due_today.length, color: 'amber' },
    { id: 'upcoming', label: 'Upcoming', count: data.upcoming.length, color: 'blue' },
    { id: 'recent', label: 'Recently Collected', count: data.recently_collected.length, color: 'green' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Collections Dashboard</h2>
        <p className="text-xs text-gray-500 mt-0.5">Live view of every payment milestone, computed fresh on each load</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-left border rounded-xl p-3 transition ${
              tab === t.id ? 'border-brand-500 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className={`text-2xl font-semibold ${colorClass(t.color)}`}>{t.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t.label}</p>
          </button>
        ))}
      </div>

      {tab === 'overdue' && <MilestoneList items={data.overdue} emptyText="No overdue payments — nice." showOverdueDays onOpenProject={onOpenProject} onRefresh={load} showSnooze />}
      {tab === 'due_today' && <MilestoneList items={data.due_today} emptyText="Nothing due today." onOpenProject={onOpenProject} onRefresh={load} showSnooze />}
      {tab === 'upcoming' && <MilestoneList items={data.upcoming} emptyText="Nothing due in the next 30 days." onOpenProject={onOpenProject} onRefresh={load} />}
      {tab === 'recent' && <RecentList items={data.recently_collected} onOpenProject={onOpenProject} />}
    </div>
  )
}

function MilestoneList({ items, emptyText, showOverdueDays, onOpenProject, onRefresh, showSnooze }) {
  const [snoozeTarget, setSnoozeTarget] = useState(null) // milestone id
  const [snoozeDays, setSnoozeDays] = useState(3)
  const [snoozing, setSnoozing] = useState(false)

  async function handleSnooze(milestoneId) {
    setSnoozing(true)
    await api.snoozeMilestone(milestoneId, snoozeDays)
    setSnoozeTarget(null)
    setSnoozing(false)
    onRefresh()
  }

  async function handleUnsnooze(e, milestoneId) {
    e.stopPropagation()
    await api.unsnoozeMilestone(milestoneId)
    onRefresh()
  }

  if (items.length === 0) {
    return <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl"><p className="text-sm text-gray-500">{emptyText}</p></div>
  }

  return (
    <div className="space-y-2">
      {items.map(m => (
        <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4 transition hover:border-gray-300">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => onOpenProject?.(m.project_id)}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{m.project_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {m.client_name} · {m.stage_name} · Due {formatDate(m.expected_date)}
                {showOverdueDays && m.days_overdue > 0 && (
                  <span className="text-red-600 font-medium"> · {m.days_overdue}d overdue</span>
                )}
                {m.snoozed_until && (
                  <span className="text-amber-600 font-medium"> · Snoozed until {formatDate(m.snoozed_until)}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(m.amount)}</p>
              {showSnooze && (
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  {m.snoozed_until ? (
                    <button
                      onClick={(e) => handleUnsnooze(e, m.id)}
                      className="text-xs px-2 py-1 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition"
                    >
                      Unsnooze
                    </button>
                  ) : (
                    <button
                      onClick={() => setSnoozeTarget(snoozeTarget === m.id ? null : m.id)}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                    >
                      Snooze
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Snooze picker */}
          {showSnooze && snoozeTarget === m.id && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <p className="text-xs text-gray-500">Snooze for</p>
              {[1, 3, 7, 14].map(d => (
                <button
                  key={d}
                  onClick={() => setSnoozeDays(d)}
                  className={`text-xs px-2 py-1 rounded-lg border transition ${
                    snoozeDays === d ? 'border-brand-500 text-brand-600 bg-brand-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {d}d
                </button>
              ))}
              <button
                onClick={() => handleSnooze(m.id)}
                disabled={snoozing}
                className="text-xs px-3 py-1 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition disabled:opacity-50"
              >
                {snoozing ? 'Saving...' : 'Confirm'}
              </button>
              <button
                onClick={() => setSnoozeTarget(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function RecentList({ items, onOpenProject }) {
  if (items.length === 0) {
    return <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl"><p className="text-sm text-gray-500">No payments collected yet.</p></div>
  }
  return (
    <div className="space-y-2">
      {items.map(m => (
        <div
          key={m.id}
          onClick={() => onOpenProject?.(m.project_id)}
          className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-gray-300 transition"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{m.projects?.project_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {m.projects?.clients?.company_name} · {m.stage_name} · Paid {formatDate(m.actual_payment_date)}
            </p>
          </div>
          <p className="text-sm font-semibold text-emerald-600 flex-shrink-0 ml-4">{formatCurrency(m.amount)}</p>
        </div>
      ))}
    </div>
  )
}

function colorClass(color) {
  return {
    red: 'text-red-600',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
    green: 'text-emerald-600',
  }[color] || 'text-gray-900'
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
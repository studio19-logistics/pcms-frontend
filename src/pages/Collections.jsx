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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface bg-texture">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-sm text-ink-dim">Loading collections...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface bg-texture">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  const TABS = [
    { id: 'overdue', label: 'Overdue', count: data.overdue.length, color: 'red' },
    { id: 'due_today', label: 'Due Today', count: data.due_today.length, color: 'amber' },
    { id: 'upcoming', label: 'Upcoming', count: data.upcoming.length, color: 'blue' },
    { id: 'recent', label: 'Recently Collected', count: data.recently_collected.length, color: 'green' },
  ]

  return (
    <div className="min-h-screen bg-surface bg-texture">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="font-serif text-2xl text-ink">Collections</h2>
          <p className="text-xs text-ink-dim mt-0.5">
            Live view of every payment milestone, computed fresh on each load
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-left bg-surface-card border rounded-card p-4 transition ${
                tab === t.id
                  ? 'border-brand-500 ring-1 ring-brand-500'
                  : 'border-surface-border hover:border-brand-500/50'
              }`}
            >
              <p className={`text-3xl font-serif ${colorClass(t.color)}`}>{t.count}</p>
              <p className="text-xs text-ink-dim mt-1">{t.label}</p>
            </button>
          ))}
        </div>

        {tab === 'overdue' && (
          <MilestoneList
            items={data.overdue}
            emptyText="No overdue payments — nice."
            showOverdueDays
            showSnooze
            onOpenProject={onOpenProject}
            onRefresh={load}
          />
        )}

        {tab === 'due_today' && (
          <MilestoneList
            items={data.due_today}
            emptyText="Nothing due today."
            showSnooze
            onOpenProject={onOpenProject}
            onRefresh={load}
          />
        )}

        {tab === 'upcoming' && (
          <MilestoneList
            items={data.upcoming}
            emptyText="Nothing due in the next 30 days."
            onOpenProject={onOpenProject}
          />
        )}

        {tab === 'recent' && (
          <RecentList
            items={data.recently_collected}
            onOpenProject={onOpenProject}
          />
        )}
      </div>
    </div>
  )
}

function MilestoneList({
  items,
  emptyText,
  showOverdueDays,
  onOpenProject,
  onRefresh,
  showSnooze,
}) {
  const [snoozeTarget, setSnoozeTarget] = useState(null)
  const [snoozeDays, setSnoozeDays] = useState(3)
  const [saving, setSaving] = useState(false)

  async function snooze(id) {
    setSaving(true)
  }

  async function handleSnooze(id) {
    setSaving(true)
    await api.snoozeMilestone(id, snoozeDays)
    setSaving(false)
    setSnoozeTarget(null)
    onRefresh?.()
  }

  async function handleUnsnooze(e, id) {
    e.stopPropagation()
    await api.unsnoozeMilestone(id)
    onRefresh?.()
  }

  if (!items.length)
    return (
      <div className="text-center py-12 border border-dashed border-surface-border rounded-card">
        <p className="text-sm text-ink-dim">{emptyText}</p>
      </div>
    )

  return (
    <div className="space-y-2">
      {items.map(m => (
        <div
          key={m.id}
          className="bg-surface-card border border-surface-border rounded-card p-4 hover:border-brand-500/50 transition"
        >
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => onOpenProject?.(m.project_id)}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{m.project_name}</p>
              <p className="text-xs text-ink-dim mt-0.5">
                {m.client_name} · {m.stage_name} · Due {formatDate(m.expected_date)}
                {showOverdueDays && m.days_overdue > 0 && (
                  <span className="text-red-400 font-medium"> · {m.days_overdue}d overdue</span>
                )}
                {m.snoozed_until && (
                  <span className="text-amber-300 font-medium">
                    {' '}· Snoozed until {formatDate(m.snoozed_until)}
                  </span>
                )}
              </p>
            </div>

            <div
              className="flex items-center gap-3 ml-4"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-sm font-semibold text-ink">{formatCurrency(m.amount)}</p>

              {showSnooze && (
                m.snoozed_until ? (
                  <button
                    onClick={e => handleUnsnooze(e, m.id)}
                    className="text-xs px-3 py-1 rounded-lg border border-amber-400/50 text-amber-300 hover:bg-amber-400/10"
                  >
                    Unsnooze
                  </button>
                ) : (
                  <button
                    onClick={() => setSnoozeTarget(snoozeTarget === m.id ? null : m.id)}
                    className="text-xs px-3 py-1 rounded-lg border border-surface-border text-ink-dim hover:border-brand-500"
                  >
                    Snooze
                  </button>
                )
              )}
            </div>
          </div>

          {showSnooze && snoozeTarget === m.id && (
            <div className="mt-3 pt-3 border-t border-surface-border flex items-center gap-2 flex-wrap">
              {[1, 3, 5, 7].map(d => (
                <button
                  key={d}
                  onClick={()=>setSnoozeDays(d)}
                  className={`text-xs px-2 py-1 rounded-lg border ${
                    snoozeDays===d
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-surface-border text-ink-dim'
                  }`}
                >
                  {d}d
                </button>
              ))}
                  <input
                  type="number"
                  min="1"
                  max="30"
                  placeholder=""
                  onChange={e => setSnoozeDays(Number(e.target.value))}
                  className="w-16 text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                 />
              <button
                disabled={saving}
                onClick={()=>handleSnooze(m.id)}
                className="text-xs px-3 py-1 rounded-lg bg-brand-500 text-white disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm'}
              </button>
              <button
                onClick={()=>setSnoozeTarget(null)}
                className="text-xs text-ink-dim"
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
  if (!items.length) {
    return <div className="text-center py-12 border border-dashed border-surface-border rounded-card"><p className="text-sm text-ink-dim">No payments collected yet.</p></div>
  }

  return (
    <div className="space-y-2">
      {items.map(m => (
        <div
          key={m.id}
          onClick={() => onOpenProject?.(m.project_id)}
          className="bg-surface-card border border-surface-border rounded-card p-4 flex items-center justify-between cursor-pointer hover:border-brand-500/50 transition"
        >
          <div>
            <p className="text-sm font-medium text-ink">{m.project_name || m.projects?.project_name}</p>
            <p className="text-xs text-ink-dim">
              {(m.client_name || m.projects?.clients?.company_name)} · {m.stage_name} · Paid {formatDate(m.actual_payment_date)}
            </p>
          </div>
          <p className="text-sm font-semibold text-emerald-300">{formatCurrency(m.amount)}</p>
        </div>
      ))}
    </div>
  )
}

function colorClass(color){
  return {
    red:'text-red-300',
    amber:'text-amber-300',
    blue:'text-blue-300',
    green:'text-emerald-300'
  }[color] || 'text-ink'
}

function formatCurrency(v){
  if(v==null) return '—'
  return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(v)
}

function formatDate(d){
  if(!d) return '—'
  return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
}

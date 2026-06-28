import { useEffect, useState } from 'react'
import * as api from '../api'

const STAGE_TYPES = [
  { value: 'advance', label: 'Advance' },
  { value: 'before_dispatch', label: 'Before Dispatch' },
  { value: 'dispatch', label: 'Dispatch' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'installation', label: 'Installation' },
  { value: 'commissioning', label: 'Commissioning' },
  { value: 'fat', label: 'FAT' },
  { value: 'sat', label: 'SAT' },
  { value: 'retention', label: 'Retention' },
  { value: 'custom', label: 'Custom Stage' },
]

const STATUS_STYLE = {
  pending: 'bg-surface-raised text-ink-dim border-surface-border',
  paid: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
  overdue: 'bg-red-400/10 text-red-300 border-red-400/30',
}

const INVOICE_STATUS_STYLE = {
  Pending: 'bg-surface-raised text-ink-dim border-surface-border',
  Paid: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
}

export default function ProjectDetail({ projectId, onBack }) {
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showProjectNotes, setShowProjectNotes] = useState(false)
  const [showArchitectPocs, setShowArchitectPocs] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState('')

  useEffect(() => { load() }, [projectId])

  async function load() {
    setLoading(true)
    const [projectData, milestoneData] = await Promise.all([
      api.getProject(projectId),
      api.getMilestones(projectId),
    ])
    if (projectData.error) setError(projectData.error)
    else setProject(projectData)
    if (!milestoneData.error) setMilestones(milestoneData)
    setLoading(false)
  }

  function handleMilestonesSaved(saved) {
    setMilestones(saved)
  }

  function handleMilestoneUpdated(updated) {
    setMilestones(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))
  }

  function handleInvoicesChanged(milestoneId, invoices) {
    setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, invoices } : m))
  }

  async function handleToggleStatus() {
    const nextStatus = project.status === 'completed' ? 'active' : 'completed'
    setStatusSaving(true)
    setStatusError('')
    const result = await api.updateProjectStatus(projectId, nextStatus)
    if (result.error) setStatusError(result.error)
    else setProject(prev => ({ ...prev, status: result.status }))
    setStatusSaving(false)
  }

  if (loading) return <div className="min-h-screen bg-surface bg-texture"><div className="max-w-3xl mx-auto px-6 py-8"><p className="text-sm text-ink-dim">Loading...</p></div></div>
  if (error && !project) return <div className="min-h-screen bg-surface bg-texture"><div className="max-w-3xl mx-auto px-6 py-8"><p className="text-sm text-red-400">{error}</p></div></div>

  const totalCollected = milestones.filter(m => m.status === 'paid').reduce((sum, m) => sum + Number(m.amount), 0)
  const progressPct = project.project_value > 0 ? Math.min(100, (totalCollected / project.project_value) * 100) : 0
  const editingMilestoneStructure = milestones.length === 0

  return (
    <div className="min-h-screen bg-surface bg-texture">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button onClick={onBack} className="text-xs text-ink-dim hover:text-ink mb-4">← Back to Projects</button>

        <div className="mb-5">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl text-ink">{project.project_name}</h2>
            {project.po_number && (
              <span className="text-xs font-medium text-ink-dim bg-surface-raised border border-surface-border rounded-full px-2.5 py-0.5">
                PO {project.po_number}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full border ${project.status === 'completed' ? 'bg-blue-400/10 text-blue-300 border-blue-400/30' : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'}`}>
              {project.status === 'completed' ? 'Completed' : 'Active'}
            </span>
          </div>
          <p className="text-xs text-ink-dim mt-0.5">
            {project.architects?.company_name ? (
              <button onClick={() => setShowArchitectPocs(true)} className="hover:text-brand-600 hover:underline">
                {project.architects.company_name}
              </button>
            ) : 'No architect/PMC'}
            {project.po_date && ` · PO Date ${formatDate(project.po_date)}`}
          </p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-ink-dim">Overall Collection Progress</p>
            <p className="text-xs text-ink-dim">{formatCurrency(totalCollected)} / {formatCurrency(project.project_value)}</p>
          </div>
          <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-ink-faint">{progressPct.toFixed(1)}% collected</p>
            <button
              onClick={handleToggleStatus}
              disabled={statusSaving}
              className="text-xs text-brand-600 hover:underline disabled:opacity-50"
            >
              {statusSaving ? 'Saving...' : project.status === 'completed' ? 'Mark as Active' : 'Mark as Completed'}
            </button>
          </div>
          {statusError && <p className="text-xs text-red-500 mt-1">{statusError}</p>}
        </div>

        <MilestoneAlerts milestones={milestones} onMilestoneUpdated={load} />

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-ink">Payment Milestones</h3>
        </div>

        {editingMilestoneStructure ? (
          <div className="mb-6">
            <MilestoneBuilder
              projectId={projectId}
              projectValue={project.project_value}
              initialMilestones={[]}
              onSaved={handleMilestonesSaved}
              onCancel={null}
            />
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {[...milestones].sort((a, b) => a.sort_order - b.sort_order).map(milestone => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                projectId={projectId}
                projectValue={project.project_value}
                allMilestones={milestones}
                onMilestoneUpdated={handleMilestoneUpdated}
                onMilestonesSaved={handleMilestonesSaved}
                onInvoicesChanged={(invs) => handleInvoicesChanged(milestone.id, invs)}
              />
            ))}
          </div>
        )}

        <ProjectNotesSection projectId={projectId} expanded={showProjectNotes} onToggle={() => setShowProjectNotes(v => !v)} />

        {showArchitectPocs && (
          <ArchitectPocsModal
            architectId={project.architect_id}
            architectName={project.architects?.company_name}
            onClose={() => setShowArchitectPocs(false)}
          />
        )}
      </div>
    </div>
  )
}

function ArchitectPocsModal({ architectId, architectName, onClose }) {
  const [pocs, setPocs] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getArchitect(architectId).then(data => {
      if (data.error) setError(data.error)
      else setPocs(data.architect_pocs || [])
    })
  }, [architectId])

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-surface-card border border-surface-border rounded-card p-6 w-full max-w-md shadow-xl">
        <h3 className="font-serif text-xl text-ink mb-4">{architectName}</h3>
        <p className="text-xs font-medium text-ink-dim mb-2">POCs</p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {pocs === null ? (
          <p className="text-xs text-ink-dim">Loading...</p>
        ) : pocs.length === 0 ? (
          <p className="text-xs text-ink-faint">No POCs added for this architect/PMC</p>
        ) : (
          <div className="space-y-2">
            {pocs.map(poc => (
              <div key={poc.id} className="bg-surface border border-surface-border rounded-xl px-3 py-2">
                <p className="text-xs font-medium text-ink">
                  {poc.poc_name} {poc.is_primary && <span className="text-brand-600">(Primary)</span>}
                </p>
                {poc.designation && <p className="text-xs text-ink-dim">{poc.designation}</p>}
                {poc.phone_number && <p className="text-xs text-ink-dim">{poc.phone_number}</p>}
                {poc.email && <p className="text-xs text-ink-dim">{poc.email}</p>}
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose} className="w-full text-sm text-ink-dim border border-surface-border rounded-xl py-2 mt-5">
          Close
        </button>
      </div>
    </div>
  )
}

function MilestoneAlerts({ milestones, onMilestoneUpdated }) {
  const today = new Date().toISOString().slice(0, 10)
  const [snoozeTarget, setSnoozeTarget] = useState(null)
  const [snoozeDays, setSnoozeDays] = useState(3)
  const [customDays, setCustomDays] = useState('')
  const [snoozing, setSnoozing] = useState(false)

  const alertMilestones = milestones
    .filter(m => m.status !== 'paid')
    .filter(m => {
      const diff = Math.round((new Date(m.expected_date) - new Date(today)) / 86400000)
      return diff <= 3
    })
    .sort((a, b) => new Date(a.expected_date) - new Date(b.expected_date))

  if (alertMilestones.length === 0) return null

  async function handleSnooze(milestoneId) {
    const days = customDays ? Number(customDays) : snoozeDays
    if (!days || days < 1) return
    setSnoozing(true)
    await api.snoozeMilestone(milestoneId, days)
    setSnoozeTarget(null)
    setCustomDays('')
    setSnoozing(false)
    onMilestoneUpdated()
  }

  async function handleUnsnooze(milestoneId) {
    await api.unsnoozeMilestone(milestoneId)
    onMilestoneUpdated()
  }

  function getDiffLabel(dateStr) {
    const diff = Math.round((new Date(dateStr) - new Date(today)) / 86400000)
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: 'text-red-400' }
    if (diff === 0) return { label: 'Due today', color: 'text-amber-400' }
    return { label: `Due in ${diff}d`, color: 'text-amber-300' }
  }

  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-medium text-ink-dim mb-2">⚠ Payment Alerts</p>
      {alertMilestones.map(m => {
        const { label, color } = getDiffLabel(m.expected_date)
        return (
          <div key={m.id} className="bg-surface-card border border-surface-border rounded-card p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink">{m.stage_name}</p>
                <p className="text-xs mt-0.5">
                  <span className={`font-medium ${color}`}>{label}</span>
                  <span className="text-ink-faint"> · {formatCurrency(m.amount)}</span>
                  {m.snoozed_until && (
                    <span className="text-amber-500"> · Snoozed until {formatDate(m.snoozed_until)}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {m.snoozed_until ? (
                  <button
                    onClick={() => handleUnsnooze(m.id)}
                    className="text-xs px-2 py-1 rounded-lg border border-amber-400/30 text-amber-400 hover:bg-amber-400/10 transition"
                  >
                    Unsnooze
                  </button>
                ) : (
                  <button
                    onClick={() => setSnoozeTarget(snoozeTarget === m.id ? null : m.id)}
                    className="text-xs px-2 py-1 rounded-lg border border-surface-border text-ink-dim hover:text-ink transition"
                  >
                    Snooze
                  </button>
                )}
              </div>
            </div>

            {snoozeTarget === m.id && (
              <div className="mt-2 pt-2 border-t border-surface-border flex items-center gap-2 flex-wrap">
                <p className="text-xs text-ink-faint">Snooze for</p>
                {[1, 3, 5, 7].map(d => (
                  <button
                    key={d}
                    onClick={() => { setSnoozeDays(d); setCustomDays('') }}
                    className={`text-xs px-2 py-1 rounded-lg border transition ${
                      snoozeDays === d && !customDays ? 'border-brand-500 text-brand-500' : 'border-surface-border text-ink-dim hover:border-ink-dim'
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
                  value={customDays}
                  onChange={e => setCustomDays(e.target.value)}
                  className="w-16 text-xs px-2 py-1 rounded-lg border border-surface-border text-ink bg-surface focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  onClick={() => handleSnooze(m.id)}
                  disabled={snoozing}
                  className="text-xs px-3 py-1 rounded-lg bg-ink text-surface hover:bg-ink/80 transition disabled:opacity-50"
                >
                  {snoozing ? 'Saving...' : 'Confirm'}
                </button>
                <button onClick={() => setSnoozeTarget(null)} className="text-xs text-ink-faint hover:text-ink">Cancel</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MilestoneCard({ milestone, projectId, projectValue, allMilestones, onMilestoneUpdated, onMilestonesSaved, onInvoicesChanged }) {
  const [expanded, setExpanded] = useState(false)
  const [showAddInvoice, setShowAddInvoice] = useState(false)
  const [editingStructure, setEditingStructure] = useState(false)
  const [invoices, setInvoices] = useState(milestone.invoices || [])
  const [invoicesLoaded, setInvoicesLoaded] = useState(Array.isArray(milestone.invoices))

  useEffect(() => {
    if (expanded && !invoicesLoaded) {
      api.getInvoices(milestone.id).then(data => {
        if (!data.error) { setInvoices(data); onInvoicesChanged(data) }
        setInvoicesLoaded(true)
      })
    }
  }, [expanded])

  const collected = invoices.filter(i => i.payment_status === 'Paid').reduce((sum, i) => sum + Number(i.invoice_value), 0)
  const remaining = Number(milestone.amount) - collected

  async function handleTogglePaid() {
    const newStatus = milestone.status === 'paid' ? 'pending' : 'paid'
    const updated = await api.updateMilestoneStatus(milestone.id, newStatus)
    if (updated.error) return
    onMilestoneUpdated(updated)
  }

  function handleInvoiceCreated(invoice) {
    const next = [...invoices, invoice]
    setInvoices(next)
    onInvoicesChanged(next)
    setShowAddInvoice(false)
  }

  function handleInvoiceUpdated(updated) {
    const next = invoices.map(i => i.id === updated.id ? { ...i, ...updated } : i)
    setInvoices(next)
    onInvoicesChanged(next)
  }

  function handleInvoiceDeleted(id) {
    const next = invoices.filter(i => i.id !== id)
    setInvoices(next)
    onInvoicesChanged(next)
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-card overflow-hidden">
      <div className="p-4 cursor-pointer flex items-center justify-between" onClick={() => setExpanded(v => !v)}>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-ink">{milestone.stage_name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[milestone.status]}`}>{milestone.status}</span>
          </div>
          <p className="text-xs text-ink-dim mt-0.5">
            {milestone.percentage}% · Due {formatDate(milestone.expected_date)} · {formatCurrency(collected)} / {formatCurrency(milestone.amount)} collected
            {milestone.actual_payment_date && ` · Paid ${formatDate(milestone.actual_payment_date)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink">{formatCurrency(milestone.amount)}</p>
          <button
            onClick={(e) => { e.stopPropagation(); handleTogglePaid() }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition ${
              milestone.status === 'paid' ? 'border-surface-border text-ink-dim hover:bg-surface-raised' : 'bg-emerald-500 text-surface border-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {milestone.status === 'paid' ? 'Mark Pending' : 'Mark Paid'}
          </button>
          <span className="text-ink-faint text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-border px-4 py-3 bg-surface/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-ink-dim">Invoices</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setEditingStructure(true)} className="text-xs text-ink-dim hover:underline">Edit milestone structure</button>
              <button onClick={() => setShowAddInvoice(true)} className="text-xs text-brand-600 hover:underline">+ Add Invoice</button>
            </div>
          </div>

          {remaining > 0.01 && (
            <p className="text-xs text-amber-500 mb-2">{formatCurrency(remaining)} remaining uncollected on this milestone</p>
          )}

          {!invoicesLoaded ? (
            <p className="text-xs text-ink-dim">Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-surface-border rounded-xl">
              <p className="text-xs text-red-400 font-medium">No invoices have been raised for this milestone.</p>
              <p className="text-xs text-ink-faint mt-0.5">Action required: raise an invoice.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map(invoice => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  onUpdated={handleInvoiceUpdated}
                  onDeleted={handleInvoiceDeleted}
                />
              ))}
            </div>
          )}

          {showAddInvoice && (
            <InvoiceModal
              milestoneId={milestone.id}
              onClose={() => setShowAddInvoice(false)}
              onCreated={handleInvoiceCreated}
            />
          )}

          {editingStructure && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
              <div className="bg-surface-card border border-surface-border rounded-card p-5 w-full max-w-2xl shadow-xl">
                <h3 className="font-serif text-lg text-ink mb-3">Edit Milestone Structure</h3>
                <p className="text-xs text-ink-faint mb-3">This rebuilds all milestones for the project. Percentages must total 100% of the project value.</p>
                <MilestoneBuilder
                  projectId={projectId}
                  projectValue={projectValue}
                  initialMilestones={allMilestones}
                  onSaved={(saved) => { onMilestonesSaved(saved); setEditingStructure(false) }}
                  onCancel={() => setEditingStructure(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InvoiceRow({ invoice, onUpdated, onDeleted }) {
  const [showEdit, setShowEdit] = useState(false)
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [snoozeDays, setSnoozeDays] = useState(3)
  const [customDays, setCustomDays] = useState('')
  const [snoozing, setSnoozing] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete invoice "${invoice.invoice_number}"?`)) return
    await api.deleteInvoice(invoice.id)
    onDeleted(invoice.id)
  }

  async function handleToggleStatus() {
    const newStatus = invoice.payment_status === 'Paid' ? 'Pending' : 'Paid'
    const updated = await api.updateInvoiceStatus(invoice.id, newStatus)
    if (!updated.error) onUpdated(updated)
  }

  async function handleSnooze() {
    const days = customDays ? Number(customDays) : snoozeDays
    if (!days || days < 1) return
    setSnoozing(true)
    const updated = await api.snoozeInvoice(invoice.id, days)
    if (!updated.error) onUpdated(updated)
    setSnoozeOpen(false)
    setCustomDays('')
    setSnoozing(false)
  }

  async function handleUnsnooze() {
    const updated = await api.unsnoozeInvoice(invoice.id)
    if (!updated.error) onUpdated(updated)
  }

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-ink">{invoice.invoice_number}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${INVOICE_STATUS_STYLE[invoice.payment_status]}`}>{invoice.payment_status}</span>
          </div>
          <p className="text-xs text-ink-dim mt-0.5">
            {invoice.invoice_date && `${formatDate(invoice.invoice_date)} · `}
            {invoice.due_date && `Due ${formatDate(invoice.due_date)}`}
            {invoice.snoozed_until && <span className="text-amber-500"> · Snoozed until {formatDate(invoice.snoozed_until)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink">{formatCurrency(invoice.invoice_value)}</p>
          <button onClick={() => setShowEdit(true)} className="text-xs text-ink-dim hover:text-ink border border-surface-border rounded-xl px-2.5 py-1">Edit</button>
          {invoice.payment_status !== 'Paid' && (
            invoice.snoozed_until ? (
              <button onClick={handleUnsnooze} className="text-xs px-2 py-1 rounded-lg border border-amber-400/30 text-amber-400 hover:bg-amber-400/10">Unsnooze</button>
            ) : (
              <button onClick={() => setSnoozeOpen(v => !v)} className="text-xs px-2 py-1 rounded-lg border border-surface-border text-ink-dim hover:text-ink">Snooze</button>
            )
          )}
          <button
            onClick={handleToggleStatus}
            className={`text-xs px-3 py-1.5 rounded-lg border transition ${
              invoice.payment_status === 'Paid' ? 'border-surface-border text-ink-dim hover:bg-surface-raised' : 'bg-emerald-500 text-surface border-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {invoice.payment_status === 'Paid' ? 'Mark Pending' : 'Mark Paid'}
          </button>
          <button onClick={handleDelete} className="text-xs text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1">Delete</button>
        </div>
      </div>

      {snoozeOpen && (
        <div className="mt-2 pt-2 border-t border-surface-border flex items-center gap-2 flex-wrap">
          <p className="text-xs text-ink-faint">Snooze for</p>
          {[1, 3, 5, 7].map(d => (
            <button
              key={d}
              onClick={() => { setSnoozeDays(d); setCustomDays('') }}
              className={`text-xs px-2 py-1 rounded-lg border transition ${
                snoozeDays === d && !customDays ? 'border-brand-500 text-brand-500' : 'border-surface-border text-ink-dim hover:border-ink-dim'
              }`}
            >
              {d}d
            </button>
          ))}
          <input
            type="number" min="1" max="30" value={customDays} onChange={e => setCustomDays(e.target.value)}
            className="w-16 text-xs px-2 py-1 rounded-lg border border-surface-border text-ink bg-surface focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button onClick={handleSnooze} disabled={snoozing} className="text-xs px-3 py-1 rounded-lg bg-ink text-surface hover:bg-ink/80 disabled:opacity-50">
            {snoozing ? 'Saving...' : 'Confirm'}
          </button>
          <button onClick={() => setSnoozeOpen(false)} className="text-xs text-ink-faint hover:text-ink">Cancel</button>
        </div>
      )}

      {showEdit && (
        <InvoiceModal
          invoice={invoice}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => { onUpdated(updated); setShowEdit(false) }}
        />
      )}
    </div>
  )
}

function MilestoneBuilder({ projectId, projectValue, initialMilestones, onSaved, onCancel }) {
  const [rows, setRows] = useState(
    initialMilestones.length > 0
      ? initialMilestones.map(m => ({
          stage_type: m.stage_type,
          stage_name: m.stage_type === 'custom' ? m.stage_name : '',
          percentage: m.percentage,
          expected_date: m.expected_date,
        }))
      : [{ stage_type: 'advance', stage_name: '', percentage: '', expected_date: '' }]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const total = rows.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0)
  const isValid = Math.abs(total - 100) < 0.01

  function updateRow(index, field, value) {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }
  function addRow() {
    setRows(prev => [...prev, { stage_type: 'custom', stage_name: '', percentage: '', expected_date: '' }])
  }
  function removeRow(index) {
    setRows(prev => prev.filter((_, i) => i !== index))
  }
  function stageLabel(row) {
    if (row.stage_type === 'custom') return row.stage_name?.trim() || 'Custom Stage'
    return STAGE_TYPES.find(t => t.value === row.stage_type)?.label || row.stage_type
  }

  async function handleSave() {
    if (rows.some(r => !r.percentage || !r.expected_date)) return setError('Every stage needs a percentage and a due date')
    if (rows.some(r => r.stage_type === 'custom' && !r.stage_name?.trim())) return setError('Custom stages need a name')
    if (!isValid) return setError(`Percentages must total 100%. Currently: ${total.toFixed(2)}%`)
    setSaving(true)
    setError('')
    const payload = rows.map(r => ({
      stage_name: stageLabel(r),
      stage_type: r.stage_type,
      percentage: Number(r.percentage),
      expected_date: r.expected_date,
    }))
    const result = await api.saveMilestones(projectId, payload)
    if (result.error) { setError(result.error); setSaving(false); return }
    onSaved(result)
    setSaving(false)
  }

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-3">
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-start">
            <select
              value={row.stage_type}
              onChange={e => updateRow(i, 'stage_type', e.target.value)}
              className={`px-2 py-1.5 border border-surface-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 ${row.stage_type === 'custom' ? 'w-32' : 'flex-1'}`}
            >
              {STAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {row.stage_type === 'custom' && (
              <input type="text" placeholder="Stage name" value={row.stage_name} onChange={e => updateRow(i, 'stage_name', e.target.value)} className="flex-1 px-2 py-1.5 border border-surface-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
            )}
            <input type="number" placeholder="%" value={row.percentage} onChange={e => updateRow(i, 'percentage', e.target.value)} className="w-16 px-2 py-1.5 border border-surface-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <input type="date" value={row.expected_date} onChange={e => updateRow(i, 'expected_date', e.target.value)} className="px-2 py-1.5 border border-surface-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 w-32" />
            <div className="text-xs text-ink-dim w-20 pt-2 text-right">
              {row.percentage ? formatCurrency(projectValue * Number(row.percentage) / 100) : '—'}
            </div>
            <button onClick={() => removeRow(i)} disabled={rows.length === 1} className="text-ink-faint hover:text-red-400 px-1 pt-1.5 disabled:opacity-30">✕</button>
          </div>
        ))}
      </div>
      <button onClick={addRow} className="text-xs text-brand-600 hover:underline mt-2">+ Add stage</button>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
        <p className={`text-xs font-medium ${isValid ? 'text-emerald-600' : 'text-amber-600'}`}>
          Total: {total.toFixed(2)}% {isValid ? '✓' : '(needs to be 100%)'}
        </p>
        <div className="flex gap-2">
          {onCancel && <button onClick={onCancel} className="text-xs text-ink-dim border border-surface-border rounded-xl px-3 py-1.5">Cancel</button>}
          <button onClick={handleSave} disabled={saving || !isValid} className="text-xs text-surface bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-1.5 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Structure'}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}

function InvoiceModal({ milestoneId, invoice, onClose, onCreated, onUpdated }) {
  const isEdit = !!invoice
  const [form, setForm] = useState({
    invoice_number: invoice?.invoice_number || '',
    invoice_date: invoice?.invoice_date || '',
    invoice_value: invoice?.invoice_value || '',
    due_date: invoice?.due_date || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.invoice_number.trim()) return setError('Invoice number is required')
    if (!form.invoice_value || Number(form.invoice_value) <= 0) return setError('Invoice value must be greater than 0')
    setLoading(true)
    setError('')
    const payload = { ...form, invoice_value: Number(form.invoice_value) }
    const result = isEdit ? await api.updateInvoice(invoice.id, payload) : await api.createInvoice(milestoneId, payload)
    if (result.error) { setError(result.error); setLoading(false); return }
    isEdit ? onUpdated(result) : onCreated(result)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-surface-card border border-surface-border rounded-card p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-serif text-xl text-ink mb-4">{isEdit ? 'Edit Invoice' : 'Add Invoice'}</h3>
        <div className="space-y-3">
          <Field label="Invoice Number" value={form.invoice_number} onChange={v => setForm({ ...form, invoice_number: v })} placeholder="e.g. INV-2026-014" />
          <Field label="Invoice Date" type="date" value={form.invoice_date} onChange={v => setForm({ ...form, invoice_date: v })} optional />
          <Field label="Due Date" type="date" value={form.due_date} onChange={v => setForm({ ...form, due_date: v })} optional />
          <Field label="Invoice Value (₹)" type="number" value={form.invoice_value} onChange={v => setForm({ ...form, invoice_value: v })} placeholder="3000000" />
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-sm text-ink-dim border border-surface-border rounded-xl py-2">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 text-sm text-surface bg-brand-500 hover:bg-brand-600 rounded-lg py-2 disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectNotesSection({ projectId, expanded, onToggle }) {
  const [notes, setNotes] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (expanded && !loaded) {
      api.getProjectNotes(projectId).then(data => {
        if (!data.error) setNotes(data)
        setLoaded(true)
      })
    }
  }, [expanded])

  async function handleAdd() {
    if (!text.trim()) return
    setPosting(true)
    const note = await api.addProjectNote(projectId, text)
    if (!note.error) { setNotes(prev => [note, ...prev]); setText('') }
    setPosting(false)
  }

  return (
    <div className="mt-8 pt-4 border-t border-surface-border">
      <button onClick={onToggle} className="text-xs text-ink-dim hover:text-ink flex items-center gap-1">
        📝 Project Notes {notes.length > 0 && !expanded && `(${notes.length})`} {expanded ? '▲' : '▼'}
      </button>
      {expanded && (
        <div className="mt-3 bg-surface-card border border-surface-border rounded-card p-4">
          <div className="flex gap-2 mb-3">
            <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Add a note about this project..." className="flex-1 px-3 py-2 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <button onClick={handleAdd} disabled={posting} className="text-xs text-surface bg-brand-500 hover:bg-brand-600 rounded-lg px-3 disabled:opacity-50">Add</button>
          </div>
          {notes.length === 0 ? (
            <p className="text-xs text-ink-faint">No notes yet.</p>
          ) : (
            <div className="space-y-2">
              {notes.map(n => (
                <div key={n.id} className="text-xs border-l-2 border-surface-border pl-3">
                  <p className="text-ink">{n.note}</p>
                  <p className="text-ink-faint mt-0.5">{n.user_profiles?.full_name} · {formatDateTime(n.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, optional, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-dim mb-1">
        {label} {optional && <span className="text-ink-faint">(optional)</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 border border-surface-border rounded-xl text-sm bg-surface text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
    </div>
  )
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' at ' +
    new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
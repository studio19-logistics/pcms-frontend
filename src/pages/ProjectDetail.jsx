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

export default function ProjectDetail({ projectId, onBack }) {
  const [project, setProject] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddInvoice, setShowAddInvoice] = useState(false)
  const [showProjectNotes, setShowProjectNotes] = useState(false)

  useEffect(() => { load() }, [projectId])

  async function load() {
    setLoading(true)
    const [projectData, invoiceData] = await Promise.all([
      api.getProject(projectId),
      api.getInvoices(projectId),
    ])
    if (projectData.error) setError(projectData.error)
    else setProject(projectData)
    if (!invoiceData.error) setInvoices(invoiceData)
    setLoading(false)
  }

  function handleInvoiceCreated(invoice) {
    setInvoices(prev => [...prev, { ...invoice, payment_milestones: [] }])
    setShowAddInvoice(false)
  }

  function handleInvoiceUpdated(updated) {
    setInvoices(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i))
  }

  function handleInvoiceDeleted(id) {
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  function handleMilestonesChanged(invoiceId, milestones) {
    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, payment_milestones: milestones } : i))
  }

  if (loading) return <div className="min-h-screen bg-surface bg-texture"><div className="max-w-3xl mx-auto px-6 py-8"><p className="text-sm text-ink-dim">Loading...</p></div></div>
  if (error && !project) return <div className="min-h-screen bg-surface bg-texture"><div className="max-w-3xl mx-auto px-6 py-8"><p className="text-sm text-red-400">{error}</p></div></div>

  // Overall progress: total collected across every invoice's milestones,
  // divided by the project's total order value (not per-invoice bars —
  // one number for "how much of this PO have we actually collected").
  const allMilestones = invoices.flatMap(i => i.payment_milestones || [])
  const totalCollected = allMilestones.filter(m => m.status === 'paid').reduce((sum, m) => sum + Number(m.amount), 0)
  const progressPct = project.project_value > 0 ? Math.min(100, (totalCollected / project.project_value) * 100) : 0

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.invoice_value), 0)

  return (
    <div className="min-h-screen bg-surface bg-texture">
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={onBack} className="text-xs text-ink-dim hover:text-ink mb-4">← Back to Projects</button>

      {/* PO header */}
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-2xl text-ink">{project.project_name}</h2>
          {project.po_number && (
            <span className="text-xs font-medium text-ink-dim bg-surface-raised border border-surface-border rounded-full px-2.5 py-0.5">
              PO {project.po_number}
            </span>
          )}
        </div>
        <p className="text-xs text-ink-dim mt-0.5">
          {project.clients?.company_name}
          {project.po_date && ` · PO Date ${formatDate(project.po_date)}`}
        </p>
      </div>

      {/* Overall progress bar */}
      <div className="bg-surface-card border border-surface-border rounded-card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-ink-dim">Overall Collection Progress</p>
          <p className="text-xs text-ink-dim">{formatCurrency(totalCollected)} / {formatCurrency(project.project_value)}</p>
        </div>
        <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-ink-faint">{progressPct.toFixed(1)}% collected</p>
          <p className="text-xs text-ink-faint">{formatCurrency(totalInvoiced)} invoiced so far</p>
        </div>
      </div>

      {/* Milestone alerts */}
      <MilestoneAlerts invoices={invoices} onMilestoneUpdated={load} />

      {/* Invoices */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-ink">Invoices</h3>
        <button onClick={() => setShowAddInvoice(true)} className="text-xs text-brand-600 hover:underline">
          + Add Invoice
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-surface-border rounded-card mb-6">
          <p className="text-sm text-ink-dim">No invoices yet — this PO hasn't shipped anything.</p>
          <button onClick={() => setShowAddInvoice(true)} className="text-xs text-brand-600 hover:underline mt-1">
            Add the first invoice
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {invoices.map(invoice => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onUpdated={handleInvoiceUpdated}
              onDeleted={handleInvoiceDeleted}
              onMilestonesChanged={(ms) => handleMilestonesChanged(invoice.id, ms)}
            />
          ))}
        </div>
      )}

      {/* Project-level notes */}
      <ProjectNotesSection projectId={projectId} expanded={showProjectNotes} onToggle={() => setShowProjectNotes(v => !v)} />

      {showAddInvoice && (
        <InvoiceModal
          projectId={projectId}
          onClose={() => setShowAddInvoice(false)}
          onCreated={handleInvoiceCreated}
        />
      )}
    </div>
    </div>
  )
}
function InvoiceCard({ invoice, onUpdated, onDeleted }) {
  const [expanded, setExpanded] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [milestones, setMilestones] = useState(invoice.payment_milestones || [])
  const [editingMilestones, setEditingMilestones] = useState(milestones.length === 0)

  const collected = milestones.filter(m => m.status === 'paid').reduce((sum, m) => sum + Number(m.amount), 0)

  async function handleDelete(e) {
    e.stopPropagation()
    if (!confirm(`Delete invoice "${invoice.invoice_number}"? This removes its milestones too.`)) return
    await api.deleteInvoice(invoice.id)
    onDeleted(invoice.id)
  }

  async function handleTogglePaid(milestoneId, currentStatus) {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid'
    const updated = await api.updateMilestoneStatus(milestoneId, newStatus)
    if (updated.error) return
    setMilestones(prev => prev.map(m => m.id === milestoneId ? updated : m))
  }

  function handleMilestonesSaved(saved) {
    setMilestones(saved)
    setEditingMilestones(false)
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-card overflow-hidden">
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setExpanded(v => !v)}
      >
        <div>
          <p className="text-sm font-medium text-ink">Invoice {invoice.invoice_number}</p>
          <p className="text-xs text-ink-dim mt-0.5">
            {invoice.invoice_date && `${formatDate(invoice.invoice_date)} · `}
            {formatCurrency(collected)} / {formatCurrency(invoice.invoice_value)} collected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setShowEdit(true) }} className="text-xs text-ink-dim hover:text-ink border border-surface-border rounded-xl px-2.5 py-1">
            Edit
          </button>
          <button onClick={handleDelete} className="text-xs text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1">
            Delete
          </button>
          <span className="text-ink-faint text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-border px-4 py-3 bg-surface/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-ink-dim">Payment Milestones</p>
            {!editingMilestones && (
              <button onClick={() => setEditingMilestones(true)} className="text-xs text-brand-600 hover:underline">
                Edit structure
              </button>
            )}
          </div>

          {editingMilestones ? (
            <MilestoneBuilder
              invoiceId={invoice.id}
              invoiceValue={invoice.invoice_value}
              initialMilestones={milestones}
              onSaved={handleMilestonesSaved}
              onCancel={milestones.length > 0 ? () => setEditingMilestones(false) : null}
            />
          ) : (
            <MilestoneList milestones={milestones} onTogglePaid={handleTogglePaid} />
          )}

          <InvoiceNotesSection invoiceId={invoice.id} expanded={showNotes} onToggle={() => setShowNotes(v => !v)} />
        </div>
      )}

      {showEdit && (
        <div onClick={e => e.stopPropagation()}>
          <InvoiceModal
            invoice={invoice}
            onClose={() => setShowEdit(false)}
            onUpdated={(updated) => { onUpdated(updated); setShowEdit(false) }}
          />
        </div>
      )}
    </div>
  )
}

function MilestoneList({ milestones, onTogglePaid }) {
  const sorted = [...milestones].sort((a, b) => a.sort_order - b.sort_order)
  return (
    <div className="space-y-2">
      {sorted.map(m => (
        <div key={m.id} className="bg-surface border border-surface-border rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-ink">{m.stage_name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[m.status]}`}>{m.status}</span>
            </div>
            <p className="text-xs text-ink-dim mt-0.5">
              {m.percentage}% · Due {formatDate(m.expected_date)}
              {m.actual_payment_date && ` · Paid ${formatDate(m.actual_payment_date)}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-ink">{formatCurrency(m.amount)}</p>
            <button
              onClick={() => onTogglePaid(m.id, m.status)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                m.status === 'paid' ? 'border-surface-border text-ink-dim hover:bg-surface-raised' : 'bg-emerald-500 text-surface border-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {m.status === 'paid' ? 'Mark Pending' : 'Mark Paid'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function MilestoneBuilder({ invoiceId, invoiceValue, initialMilestones, onSaved, onCancel }) {
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
    if (rows.some(r => !r.percentage || !r.expected_date)) {
      return setError('Every stage needs a percentage and a due date')
    }
    if (rows.some(r => r.stage_type === 'custom' && !r.stage_name?.trim())) {
      return setError('Custom stages need a name')
    }
    if (!isValid) {
      return setError(`Percentages must total 100% of this invoice's value. Currently: ${total.toFixed(2)}%`)
    }
    setSaving(true)
    setError('')
    const payload = rows.map(r => ({
      stage_name: stageLabel(r),
      stage_type: r.stage_type,
      percentage: Number(r.percentage),
      expected_date: r.expected_date,
    }))
    const result = await api.saveMilestones(invoiceId, payload)
    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }
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
              <input
                type="text"
                placeholder="Stage name"
                value={row.stage_name}
                onChange={e => updateRow(i, 'stage_name', e.target.value)}
                className="flex-1 px-2 py-1.5 border border-surface-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            )}
            <input
              type="number"
              placeholder="%"
              value={row.percentage}
              onChange={e => updateRow(i, 'percentage', e.target.value)}
              className="w-16 px-2 py-1.5 border border-surface-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="date"
              value={row.expected_date}
              onChange={e => updateRow(i, 'expected_date', e.target.value)}
              className="px-2 py-1.5 border border-surface-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 w-32"
            />
            <div className="text-xs text-ink-dim w-20 pt-2 text-right">
              {row.percentage ? formatCurrency(invoiceValue * Number(row.percentage) / 100) : '—'}
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

function InvoiceModal({ projectId, invoice, onClose, onCreated, onUpdated }) {
  const isEdit = !!invoice
  const [form, setForm] = useState({
    invoice_number: invoice?.invoice_number || '',
    invoice_date: invoice?.invoice_date || '',
    invoice_value: invoice?.invoice_value || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    api.getRemainingInvoiceValue(projectId).then(data => {
      if (!data.error) {
        // When editing, the amount this invoice already holds is part
        // of "invoiced_total", so add it back in to get the true
        // headroom available while editing this specific invoice.
        const adjusted = isEdit ? data.remaining + Number(invoice.invoice_value) : data.remaining
        setRemaining(adjusted)
      }
    })
  }, [])

  const overBudget = remaining !== null && form.invoice_value && Number(form.invoice_value) > remaining + 0.01

  async function handleSubmit() {
    if (!form.invoice_number.trim()) return setError('Invoice number is required')
    if (!form.invoice_value || Number(form.invoice_value) <= 0) return setError('Invoice value must be greater than 0')
    setLoading(true)
    setError('')
    const payload = { ...form, invoice_value: Number(form.invoice_value) }
    const result = isEdit
      ? await api.updateInvoice(invoice.id, payload)
      : await api.createInvoice(projectId, payload)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    isEdit ? onUpdated(result) : onCreated(result)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-surface-card border border-surface-border rounded-card p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-serif text-xl text-ink mb-1">{isEdit ? 'Edit Invoice' : 'Add Invoice'}</h3>
        {remaining !== null && (
          <p className={`text-xs mb-4 ${overBudget ? 'text-red-400 font-medium' : 'text-ink-dim'}`}>
            {formatCurrency(remaining)} left to invoice on this PO
          </p>
        )}
        <div className="space-y-3">
          <Field label="Invoice Number" value={form.invoice_number} onChange={v => setForm({ ...form, invoice_number: v })} placeholder="e.g. INV-2026-014" />
          <Field label="Invoice Date" type="date" value={form.invoice_date} onChange={v => setForm({ ...form, invoice_date: v })} optional />
          <Field label="Invoice Value (₹)" type="number" value={form.invoice_value} onChange={v => setForm({ ...form, invoice_value: v })} placeholder="3000000" />
        </div>
        {overBudget && (
          <p className="text-xs text-red-600 mt-2">This exceeds the remaining PO value by {formatCurrency(Number(form.invoice_value) - remaining)}</p>
        )}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-sm text-ink-dim border border-surface-border rounded-xl py-2">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || overBudget} className="flex-1 text-sm text-surface bg-brand-500 hover:bg-brand-600 rounded-lg py-2 disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Tucked-away notes — collapsed by default, a small link toggles it
// open. Not always visible, but always one click away.
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
    if (!note.error) {
      setNotes(prev => [note, ...prev])
      setText('')
    }
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
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a note about this project..."
              className="flex-1 px-3 py-2 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} disabled={posting} className="text-xs text-surface bg-brand-500 hover:bg-brand-600 rounded-lg px-3 disabled:opacity-50">
              Add
            </button>
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

function InvoiceNotesSection({ invoiceId, expanded, onToggle }) {
  const [notes, setNotes] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (expanded && !loaded) {
      api.getInvoiceNotes(invoiceId).then(data => {
        if (!data.error) setNotes(data)
        setLoaded(true)
      })
    }
  }, [expanded])

  async function handleAdd() {
    if (!text.trim()) return
    setPosting(true)
    const note = await api.addInvoiceNote(invoiceId, text)
    if (!note.error) {
      setNotes(prev => [note, ...prev])
      setText('')
    }
    setPosting(false)
  }

  return (
    <div className="mt-3 pt-3 border-t border-surface-border">
      <button onClick={onToggle} className="text-xs text-ink-dim hover:text-ink flex items-center gap-1">
        📝 Notes {notes.length > 0 && !expanded && `(${notes.length})`} {expanded ? '▲' : '▼'}
      </button>
      {expanded && (
        <div className="mt-2 bg-surface border border-surface-border rounded-xl p-3">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a note about this invoice..."
              className="flex-1 px-2 py-1.5 border border-surface-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} disabled={posting} className="text-xs text-surface bg-brand-500 hover:bg-brand-600 rounded-lg px-3 disabled:opacity-50">
              Add
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="text-xs text-ink-faint">No notes yet.</p>
          ) : (
            <div className="space-y-1.5">
              {notes.map(n => (
                <div key={n.id} className="text-xs border-l-2 border-surface-border pl-2">
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
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-surface-border rounded-xl text-sm bg-surface text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
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
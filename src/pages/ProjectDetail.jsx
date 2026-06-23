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
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
}

export default function ProjectDetail({ projectId, onBack }) {
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)

  useEffect(() => { load() }, [projectId])

  async function load() {
    setLoading(true)
    const data = await api.getProject(projectId)
    if (data.error) setError(data.error)
    else {
      setProject(data)
      setMilestones(data.payment_milestones || [])
      // If no milestones exist yet, drop straight into edit mode
      if (!data.payment_milestones || data.payment_milestones.length === 0) {
        setEditMode(true)
      }
    }
    setLoading(false)
  }

  async function handleMarkPaid(milestoneId, currentStatus) {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid'
    const updated = await api.updateMilestoneStatus(milestoneId, newStatus)
    if (updated.error) return setError(updated.error)
    setMilestones(prev => prev.map(m => m.id === milestoneId ? updated : m))
  }

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-8"><p className="text-sm text-gray-500">Loading...</p></div>
  if (error && !project) return <div className="max-w-3xl mx-auto px-6 py-8"><p className="text-sm text-red-600">{error}</p></div>

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={onBack} className="text-xs text-gray-500 hover:text-gray-900 mb-4">← Back to Projects</button>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{project.project_name}</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {project.clients?.company_name} · Project value: {formatCurrency(project.project_value)}
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Payment Milestones</h3>
        {!editMode && (
          <button onClick={() => setEditMode(true)} className="text-xs text-brand-600 hover:underline">
            Edit structure
          </button>
        )}
      </div>

      {editMode ? (
        <MilestoneBuilder
          projectId={projectId}
          projectValue={project.project_value}
          initialMilestones={milestones}
          onSaved={(saved) => { setMilestones(saved); setEditMode(false); setError('') }}
          onCancel={() => milestones.length > 0 ? setEditMode(false) : null}
        />
      ) : (
        <MilestoneList milestones={milestones} onTogglePaid={handleMarkPaid} />
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  )
}

function MilestoneList({ milestones, onTogglePaid }) {
  const sorted = [...milestones].sort((a, b) => a.sort_order - b.sort_order)
  return (
    <div className="space-y-2">
      {sorted.map(m => (
        <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">{m.stage_name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[m.status]}`}>
                {m.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {m.percentage}% · Due {formatDate(m.expected_date)}
              {m.actual_payment_date && ` · Paid ${formatDate(m.actual_payment_date)}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-gray-900">{formatCurrency(m.amount)}</p>
            <button
              onClick={() => onTogglePaid(m.id, m.status)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                m.status === 'paid'
                  ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  : 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
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
    if (rows.some(r => !r.percentage || !r.expected_date)) {
      return setError('Every stage needs a percentage and a due date')
    }
    if (rows.some(r => r.stage_type === 'custom' && !r.stage_name?.trim())) {
      return setError('Custom stages need a name')
    }
    if (!isValid) {
      return setError(`Percentages must total 100%. Currently: ${total.toFixed(2)}%`)
    }
    setSaving(true)
    setError('')
    const payload = rows.map(r => ({
      stage_name: stageLabel(r),
      stage_type: r.stage_type,
      percentage: Number(r.percentage),
      expected_date: r.expected_date,
    }))
    const result = await api.saveMilestones(projectId, payload)
    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }
    onSaved(result)
    setSaving(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-start">
            <select
              value={row.stage_type}
              onChange={e => updateRow(i, 'stage_type', e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                row.stage_type === 'custom' ? 'w-36' : 'flex-1'
              }`}
            >
              {STAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {row.stage_type === 'custom' && (
              <input
                type="text"
                placeholder="Stage name"
                value={row.stage_name}
                onChange={e => updateRow(i, 'stage_name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            )}
            <div className="relative w-24">
              <input
                type="number"
                placeholder="%"
                value={row.percentage}
                onChange={e => updateRow(i, 'percentage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <input
              type="date"
              value={row.expected_date}
              onChange={e => updateRow(i, 'expected_date', e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-36"
            />
            <div className="text-xs text-gray-500 w-24 pt-2.5 text-right">
              {row.percentage ? formatCurrency(projectValue * Number(row.percentage) / 100) : '—'}
            </div>
            <button
              onClick={() => removeRow(i)}
              disabled={rows.length === 1}
              className="text-gray-400 hover:text-red-600 px-1 pt-2 disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button onClick={addRow} className="text-xs text-brand-600 hover:underline mt-3">
        + Add stage
      </button>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <p className={`text-sm font-medium ${isValid ? 'text-emerald-600' : 'text-amber-600'}`}>
          Total: {total.toFixed(2)}% {isValid ? '✓' : `(needs to be 100%)`}
        </p>
        <div className="flex gap-2">
          {onCancel && (
            <button onClick={onCancel} className="text-sm text-gray-600 border border-gray-300 rounded-lg px-4 py-2">
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isValid}
            className="text-sm text-white bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Structure'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
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
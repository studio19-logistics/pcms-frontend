import { useEffect, useState } from 'react'
import * as api from '../api'

const STATUS_OPTIONS = ['active', 'completed', 'on_hold', 'cancelled']

const STATUS_STYLE = {
  active: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
  completed: 'bg-blue-400/10 text-blue-300 border-blue-400/30',
  on_hold: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  cancelled: 'bg-surface-raised text-ink-faint border-surface-border',
}

export default function Projects({ onOpenProject }) {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [projectData, clientData, teamData] = await Promise.all([
      api.getProjects(), api.getClients(), api.getTeamMembers()
    ])
    if (projectData.error) setError(projectData.error)
    else setProjects(projectData)
    if (!clientData.error) setClients(clientData)
    if (!teamData.error) setTeamMembers(teamData)
    setLoading(false)
  }

  function handleCreated(project) {
    setProjects(prev => [project, ...prev])
    setShowCreate(false)
  }

  function handleUpdated(updated) {
    setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
  }

  function handleDeleted(id) {
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const filtered = statusFilter === 'all' ? projects : projects.filter(p => p.status === statusFilter)

  return (
    <div className="min-h-screen bg-surface bg-texture">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl text-ink">Projects</h2>
            <p className="text-xs text-ink-dim mt-0.5">{filtered.length} project{filtered.length === 1 ? '' : 's'}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            disabled={clients.length === 0}
            className="bg-brand-500 hover:bg-brand-600 text-surface text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            + New Project
          </button>
        </div>

        {clients.length === 0 && (
          <p className="text-xs text-amber-600 mb-4">You need at least one client before creating a project.</p>
        )}

        <div className="flex gap-1.5 mb-5">
          <FilterPill label="All" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          {STATUS_OPTIONS.map(s => (
            <FilterPill key={s} label={formatStatus(s)} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {loading ? (
          <p className="text-sm text-ink-dim">Loading projects...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-surface-border rounded-card">
            <p className="text-sm text-ink-dim">No projects {statusFilter !== 'all' ? `with status "${formatStatus(statusFilter)}"` : 'yet'}.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(project => (
              <ProjectRow
                key={project.id}
                project={project}
                clients={clients}
                teamMembers={teamMembers}
                onClick={() => onOpenProject?.(project.id)}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}

        {showCreate && (
          <ProjectModal
            clients={clients}
            teamMembers={teamMembers}
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
          />
        )}
      </div>
    </div>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
        active ? 'bg-brand-500 text-surface border-brand-500' : 'bg-surface-card text-ink-dim border-surface-border hover:border-brand-500'
      }`}
    >
      {label}
    </button>
  )
}

function ProjectRow({ project, clients, teamMembers, onClick, onUpdated, onDeleted }) {
  const [showEdit, setShowEdit] = useState(false)

  async function handleDelete(e) {
    e.stopPropagation()
    if (!confirm(`Delete "${project.project_name}"? This cannot be undone.`)) return
    await api.deleteProject(project.id)
    onDeleted(project.id)
  }

  return (
    <div
      onClick={onClick}
      className="bg-surface-card border border-surface-border rounded-card p-4 flex items-center justify-between cursor-pointer hover:border-brand-500/50 transition"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink truncate">{project.project_name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[project.status]}`}>
            {formatStatus(project.status)}
          </span>
        </div>
        <p className="text-xs text-ink-dim mt-0.5">
          {project.clients?.company_name || 'Unknown client'} · {project.team_members?.name || 'No owner'}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <p className="text-sm font-medium text-ink">{formatCurrency(project.project_value)}</p>
        <button
          onClick={(e) => { e.stopPropagation(); setShowEdit(true) }}
          className="text-xs text-ink-dim hover:text-ink border border-surface-border rounded-xl px-2.5 py-1"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="text-xs text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1"
        >
          Delete
        </button>
      </div>

      {showEdit && (
        <div onClick={e => e.stopPropagation()}>
          <ProjectModal
            project={project}
            clients={clients}
            teamMembers={teamMembers}
            onClose={() => setShowEdit(false)}
            onUpdated={(updated) => { onUpdated(updated); setShowEdit(false) }}
          />
        </div>
      )}
    </div>
  )
}

function ProjectModal({ project, clients = [], teamMembers = [], onClose, onCreated, onUpdated }) {
  const isEdit = !!project
  const [form, setForm] = useState({
    project_name: project?.project_name || '',
    client_id: project?.client_id || '',
    owner_id: project?.owner_id || '',
    po_number: project?.po_number || '',
    po_date: project?.po_date || '',
    invoice_number: project?.invoice_number || '',
    invoice_date: project?.invoice_date || '',
    project_value: project?.project_value || '',
    order_date: project?.order_date || '',
    status: project?.status || 'active',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.project_name.trim()) return setError('Project name is required')
    if (!isEdit && !form.client_id) return setError('Select a client')
    if (!form.project_value || Number(form.project_value) <= 0) return setError('Project value must be greater than 0')
    setLoading(true)
    setError('')
    try {
      const payload = { ...form, project_value: Number(form.project_value), owner_id: form.owner_id || null }
      const result = isEdit ? await api.updateProject(project.id, payload) : await api.createProject(payload)
      if (result.error) throw new Error(result.error)
      isEdit ? onUpdated(result) : onCreated(result)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
      <div className="bg-surface-card border border-surface-border rounded-card p-6 w-full max-w-lg shadow-xl">
        <h3 className="font-serif text-xl text-ink mb-4">{isEdit ? 'Edit Project' : 'New Project'}</h3>
        <div className="space-y-3">
          <Field label="Project Name" value={form.project_name} onChange={v => setForm({ ...form, project_name: v })} placeholder="e.g. Installation — Phase 2" />

          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-ink-dim mb-1">Client</label>
              <select
                value={form.client_id}
                onChange={e => setForm({ ...form, client_id: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select a client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-dim mb-1">Owner <span className="text-ink-faint">(optional)</span></label>
            <select
              value={form.owner_id}
              onChange={e => setForm({ ...form, owner_id: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">No owner</option>
              {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="PO Number" value={form.po_number} onChange={v => setForm({ ...form, po_number: v })} optional />
            <Field label="PO Date" type="date" value={form.po_date} onChange={v => setForm({ ...form, po_date: v })} optional />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Invoice Number" value={form.invoice_number} onChange={v => setForm({ ...form, invoice_number: v })} optional />
            <Field label="Invoice Date" type="date" value={form.invoice_date} onChange={v => setForm({ ...form, invoice_date: v })} optional />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Project Value (₹)" type="number" value={form.project_value} onChange={v => setForm({ ...form, project_value: v })} placeholder="1000000" />
            <Field label="Order Date" type="date" value={form.order_date} onChange={v => setForm({ ...form, order_date: v })} optional />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-dim mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-sm text-ink-dim border border-surface-border rounded-xl py-2">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 text-sm text-surface bg-brand-500 hover:bg-brand-600 rounded-lg py-2 disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
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
        className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
    </div>
  )
}

function formatStatus(status) {
  return status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}
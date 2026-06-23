import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import * as api from '../api'

export default function Clients() {
  const { profile } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    setLoading(true)
    const data = await api.getClients()
    if (data.error) setError(data.error)
    else setClients(data)
    setLoading(false)
  }

  function handleCreated(client) {
    setClients(prev => [client, ...prev])
    setShowCreate(false)
  }

  function handleUpdated(updated) {
    setClients(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
  }

  function handleDeleted(id) {
    setClients(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
          <p className="text-xs text-gray-500 mt-0.5">{clients.length} client{clients.length === 1 ? '' : 's'}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Add Client
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading clients...</p>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm text-gray-500">No clients yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm text-brand-600 font-medium mt-2 hover:underline"
          >
            Add your first client
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              currentUserId={profile?.id}
              isAdmin={profile?.role === 'admin'}
              expanded={expandedId === client.id}
              onToggle={() => setExpandedId(expandedId === client.id ? null : client.id)}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onContactsChanged={loadClients}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <ClientModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

function ClientCard({ client, currentUserId, isAdmin, expanded, onToggle, onUpdated, onDeleted, onContactsChanged }) {
  const [showEdit, setShowEdit] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const canEdit = isAdmin || client.created_by === currentUserId
  const primaryContact = client.client_contacts?.find(c => c.is_primary) || client.client_contacts?.[0]

  async function handleDelete() {
    if (!confirm(`Delete "${client.company_name}"? This cannot be undone.`)) return
    await api.deleteClient(client.id)
    onDeleted(client.id)
  }

  async function handleDeleteContact(contactId) {
    await api.deleteContact(contactId)
    onContactsChanged()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={onToggle}
      >
        <div>
          <p className="text-sm font-medium text-gray-900">{client.company_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {primaryContact ? primaryContact.poc_name : 'No contact added yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setShowEdit(true) }}
                className="text-xs text-gray-500 hover:text-gray-900 border border-gray-300 rounded-lg px-2.5 py-1"
              >
                Edit
              </button>
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete() }}
                  className="text-xs text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1"
                >
                  Delete
                </button>
              )}
            </>
          )}
          <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-700">Contacts</p>
            <button
              onClick={() => setShowAddContact(true)}
              className="text-xs text-brand-600 hover:underline"
            >
              + Add contact
            </button>
          </div>

          {(!client.client_contacts || client.client_contacts.length === 0) ? (
            <p className="text-xs text-gray-400">No contacts added</p>
          ) : (
            <div className="space-y-2">
              {client.client_contacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      {contact.poc_name} {contact.is_primary && <span className="text-brand-600">(Primary)</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {contact.phone_number || contact.email || 'No contact info'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-xs text-gray-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEdit && (
        <ClientModal
          client={client}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => { onUpdated(updated); setShowEdit(false) }}
        />
      )}

      {showAddContact && (
        <ContactModal
          clientId={client.id}
          onClose={() => setShowAddContact(false)}
          onAdded={() => { onContactsChanged(); setShowAddContact(false) }}
        />
      )}
    </div>
  )
}

function ClientModal({ client, onClose, onCreated, onUpdated }) {
  const isEdit = !!client
  const [form, setForm] = useState({
    company_name: client?.company_name || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.company_name.trim()) return setError('Client name is required')
    setLoading(true)
    setError('')
    try {
      const result = isEdit
        ? await api.updateClient(client.id, form)
        : await api.createClient(form)
      if (result.error) throw new Error(result.error)
      isEdit ? onUpdated(result) : onCreated(result)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          {isEdit ? 'Edit Client' : 'Add Client'}
        </h3>

        <div className="space-y-3">
          <Field label="Client Name" value={form.company_name} onChange={v => setForm({ ...form, company_name: v })} placeholder="e.g. ABC Industries" />
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-sm text-gray-600 border border-gray-300 rounded-lg py-2">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 text-sm text-white bg-brand-500 hover:bg-brand-600 rounded-lg py-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Client'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ContactModal({ clientId, onClose, onAdded }) {
  const [form, setForm] = useState({
    poc_name: '', email: '', phone_number: '', is_primary: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.poc_name.trim()) return setError('Contact name is required')
    setLoading(true)
    setError('')
    try {
      const result = await api.addContact(clientId, form)
      if (result.error) throw new Error(result.error)
      onAdded(result)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Add Contact</h3>

        <div className="space-y-3">
          <Field label="Contact Name" value={form.poc_name} onChange={v => setForm({ ...form, poc_name: v })} />
          <Field label="Phone Number" value={form.phone_number} onChange={v => setForm({ ...form, phone_number: v })} optional />
          <Field label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} optional type="email" />
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={e => setForm({ ...form, is_primary: e.target.checked })}
            />
            Set as primary contact
          </label>
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-sm text-gray-600 border border-gray-300 rounded-lg py-2">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 text-sm text-white bg-brand-500 hover:bg-brand-600 rounded-lg py-2 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, optional, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {optional && <span className="text-gray-400">(optional)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
    </div>
  )
}
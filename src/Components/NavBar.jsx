import { useAuth } from '../AuthContext'
import { useEffect, useState } from 'react'
import * as api from '../api'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'collections', label: 'Collections' },
  { id: 'clients', label: 'Clients' },
  { id: 'projects', label: 'Projects' },
]

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatAction(action, entityName) {
  const labels = {
    project_created: `Project created`,
    project_updated: `Project updated`,
    project_deleted: `Project deleted`,
    project_reassigned: `Project reassigned`,
    invoice_created: `Invoice added`,
    invoice_updated: `Invoice updated`,
    invoice_deleted: `Invoice deleted`,
    milestones_updated: `Milestones updated`,
    milestone_marked_paid: `Milestone marked paid`,
    milestone_marked_pending: `Milestone marked pending`,
    milestone_snoozed: `Milestone snoozed`,
    milestone_unsnoozed: `Milestone unsnoozed`,
    client_created: `Client added`,
    client_updated: `Client updated`,
    client_deleted: `Client deleted`,
    contact_added: `Contact added`,
    contact_deleted: `Contact deleted`,
    project_note_added: `Note added`,
    invoice_note_added: `Note added`,
    project_note_deleted: `Note deleted`,
    invoice_note_deleted: `Note deleted`,
  }
  return `${labels[action] || action}${entityName ? ` — ${entityName}` : ''}`
}

export default function NavBar({ active, onNavigate }) {
  const { profile, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [activities, setActivities] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)

  const STORAGE_KEY = 'pcms_last_read'

  useEffect(() => {
    fetchActivity()
    const interval = setInterval(fetchActivity, 60000) // refresh every 60s
    return () => clearInterval(interval)
  }, [])

  async function fetchActivity() {
    setLoading(true)
    const result = await api.getActivity()
    if (!result.error) {
      setActivities(result)
      const lastRead = localStorage.getItem(STORAGE_KEY)
      if (lastRead) {
        const count = result.filter(a => new Date(a.created_at) > new Date(lastRead)).length
        setUnread(count)
      } else {
        setUnread(result.length)
      }
    }
    setLoading(false)
  }

  function openSidebar() {
    setOpen(true)
    const now = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, now)
    setUnread(0)
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">PCMS</h1>
            <p className="text-xs text-gray-500">{profile?.full_name} ({profile?.role})</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Bell icon */}
            <button
              onClick={openSidebar}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unread > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="px-6 flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`text-sm font-medium px-4 py-2 border-b-2 transition ${
                active === tab.id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Activity sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Activity</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && activities.length === 0 && (
            <p className="text-xs text-gray-400 px-4 py-6 text-center">Loading...</p>
          )}
          {!loading && activities.length === 0 && (
            <p className="text-xs text-gray-400 px-4 py-6 text-center">No activity yet.</p>
          )}
          {activities.map(a => (
            <div key={a.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition">
              <p className="text-xs text-gray-800">{formatAction(a.action, a.entity_name)}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {a.performed_by_name || 'System'} · {timeAgo(a.created_at)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
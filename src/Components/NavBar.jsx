import { useAuth } from '../AuthContext'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'collections', label: 'Collections' },
  { id: 'clients', label: 'Clients' },
  { id: 'projects', label: 'Projects' },
]

export default function NavBar({ active, onNavigate }) {
  const { profile, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">PCMS</h1>
          <p className="text-xs text-gray-500">{profile?.full_name} ({profile?.role})</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5"
        >
          Sign out
        </button>
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
  )
}
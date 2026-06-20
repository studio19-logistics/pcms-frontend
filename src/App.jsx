import { useAuth } from './AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!session) return <Login />

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-center">
        <p className="text-sm text-gray-500">
          Signed in, but no profile found for this account.<br />
          Ask an admin to set up your user_profiles row.
        </p>
      </div>
    )
  }

  return <Dashboard />
}

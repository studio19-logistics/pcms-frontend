import { useState } from 'react'
import { useAuth } from './AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Collections from './pages/Collections'
import NavBar from './components/NavBar'

export default function App() {
  const { session, profile, loading } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  function navigate(targetPage) {
    setSelectedProjectId(null)
    setPage(targetPage)
  }

  function openProjectFrom(targetPage, projectId) {
    setPage(targetPage)
    setSelectedProjectId(projectId)
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar active={page} onNavigate={navigate} />
      {page === 'dashboard' && <Dashboard />}
      {page === 'collections' && !selectedProjectId && (
        <Collections onOpenProject={(id) => openProjectFrom('collections', id)} />
      )}
      {page === 'clients' && <Clients />}
      {page === 'projects' && !selectedProjectId && (
        <Projects onOpenProject={(id) => openProjectFrom('projects', id)} />
      )}
      {selectedProjectId && (page === 'projects' || page === 'collections') && (
        <ProjectDetail projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />
      )}
    </div>
  )
}
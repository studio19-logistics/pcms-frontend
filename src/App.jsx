import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Collections from './pages/Collections'
import NavBar from './Components/NavBar'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  // Deep link handler — ?project=<id> opens that project directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const projectId = params.get('project')
    if (projectId) {
      setPage('projects')
      setSelectedProjectId(projectId)
    }
  }, [])

  function navigate(targetPage) {
    setSelectedProjectId(null)
    setPage(targetPage)
    window.history.replaceState({}, '', window.location.pathname)
  }

  function openProjectFrom(targetPage, projectId) {
    setPage(targetPage)
    setSelectedProjectId(projectId)
  }

  return (
    <div className="min-h-screen bg-surface bg-texture">
      <NavBar active={page} onNavigate={navigate} />
      {page === 'dashboard' && <Dashboard onNavigateToCollections={() => navigate('collections')} />}
      {page === 'collections' && !selectedProjectId && (
        <Collections onOpenProject={(id) => openProjectFrom('collections', id)} />
      )}
      {page === 'projects' && !selectedProjectId && (
        <Projects onOpenProject={(id) => openProjectFrom('projects', id)} />
      )}
      {selectedProjectId && (page === 'projects' || page === 'collections') && (
        <ProjectDetail projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />
      )}
    </div>
  )
}
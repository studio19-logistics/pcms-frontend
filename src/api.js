import { supabase } from './supabaseClient'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function request(url, options = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const res = await fetch(`${API_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  })
  return res.json()
}

// Architects / PMC — created/edited inline via the project form now;
// only direct read (for the POC modal) and POC management remain here.
export const getArchitect = (id) => request(`/api/architects/${id}`)
export const addPoc = (architectId, data) => request(`/api/architects/${architectId}/pocs`, { method: 'POST', body: JSON.stringify(data) })
export const deletePoc = (pocId) => request(`/api/architects/pocs/${pocId}`, { method: 'DELETE' })

// Projects
export const getProjects = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request(`/api/projects${query ? `?${query}` : ''}`)
}
export const getProject = (id) => request(`/api/projects/${id}`)
export const createProject = (data) => request('/api/projects', { method: 'POST', body: JSON.stringify(data) })
export const updateProject = (id, data) => request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const updateProjectStatus = (id, status) => request(`/api/projects/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
export const deleteProject = (id) => request(`/api/projects/${id}`, { method: 'DELETE' })

// Milestones — scoped to a project directly
export const getMilestones = (projectId) => request(`/api/milestones/project/${projectId}`)
export const saveMilestones = (projectId, milestones) => request(`/api/milestones/project/${projectId}`, { method: 'PUT', body: JSON.stringify({ milestones }) })
export const updateMilestoneStatus = (id, status, actualDate) => request(`/api/milestones/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, actual_payment_date: actualDate }) })
export const snoozeMilestone = (id, days) => request(`/api/milestones/${id}/snooze`, { method: 'PATCH', body: JSON.stringify({ days }) })
export const unsnoozeMilestone = (id) => request(`/api/milestones/${id}/unsnooze`, { method: 'PATCH' })

// Invoices — scoped to a milestone, not a project directly
export const getInvoices = (milestoneId) => request(`/api/invoices/milestone/${milestoneId}`)
export const createInvoice = (milestoneId, data) => request(`/api/invoices/milestone/${milestoneId}`, { method: 'POST', body: JSON.stringify(data) })
export const updateInvoice = (id, data) => request(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const updateInvoiceStatus = (id, paymentStatus) => request(`/api/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ payment_status: paymentStatus }) })
export const snoozeInvoice = (id, days) => request(`/api/invoices/${id}/snooze`, { method: 'PATCH', body: JSON.stringify({ days }) })
export const unsnoozeInvoice = (id) => request(`/api/invoices/${id}/unsnooze`, { method: 'PATCH' })
export const deleteInvoice = (id) => request(`/api/invoices/${id}`, { method: 'DELETE' })

// Notes — project-level only
export const getProjectNotes = (projectId) => request(`/api/notes/project/${projectId}`)
export const addProjectNote = (projectId, note) => request(`/api/notes/project/${projectId}`, { method: 'POST', body: JSON.stringify({ note }) })
export const deleteProjectNote = (noteId) => request(`/api/notes/project-note/${noteId}`, { method: 'DELETE' })

// Dashboard
export const getCollections = () => request('/api/dashboard/collections')
export const getKpis = () => request('/api/dashboard/kpis')
export const getPeopleAnalytics = () => request('/api/dashboard/people')
export const getActivity = () => request('/api/dashboard/activity?limit=50')

export const getTeamMembers = () => request('/api/projects/team-members')
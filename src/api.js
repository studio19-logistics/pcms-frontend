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

// Clients
export const getClients = () => request('/api/clients')
export const getClient = (id) => request(`/api/clients/${id}`)
export const createClient = (data) => request('/api/clients', { method: 'POST', body: JSON.stringify(data) })
export const updateClient = (id, data) => request(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteClient = (id) => request(`/api/clients/${id}`, { method: 'DELETE' })
export const addContact = (clientId, data) => request(`/api/clients/${clientId}/contacts`, { method: 'POST', body: JSON.stringify(data) })
export const deleteContact = (contactId) => request(`/api/clients/contacts/${contactId}`, { method: 'DELETE' })

// Projects
export const getProjects = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request(`/api/projects${query ? `?${query}` : ''}`)
}
export const getProject = (id) => request(`/api/projects/${id}`)
export const createProject = (data) => request('/api/projects', { method: 'POST', body: JSON.stringify(data) })
export const updateProject = (id, data) => request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const reassignProject = (id, ownerId) => request(`/api/projects/${id}/reassign`, { method: 'PATCH', body: JSON.stringify({ owner_id: ownerId }) })
export const deleteProject = (id) => request(`/api/projects/${id}`, { method: 'DELETE' })

// Milestones
export const getMilestones = (projectId) => request(`/api/milestones/project/${projectId}`)
export const saveMilestones = (projectId, milestones) => request(`/api/milestones/project/${projectId}`, { method: 'PUT', body: JSON.stringify({ milestones }) })
export const updateMilestoneStatus = (id, status, actualDate) => request(`/api/milestones/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, actual_payment_date: actualDate }) })

// Dashboard
export const getCollections = () => request('/api/dashboard/collections')
export const getKpis = () => request('/api/dashboard/kpis')

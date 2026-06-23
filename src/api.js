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

// Invoices
export const getInvoices = (projectId) => request(`/api/invoices/project/${projectId}`)
export const getRemainingInvoiceValue = (projectId) => request(`/api/invoices/project/${projectId}/remaining`)
export const createInvoice = (projectId, data) => request(`/api/invoices/project/${projectId}`, { method: 'POST', body: JSON.stringify(data) })
export const updateInvoice = (id, data) => request(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteInvoice = (id) => request(`/api/invoices/${id}`, { method: 'DELETE' })

// Milestones — scoped to an invoice, not a project directly
export const getMilestones = (invoiceId) => request(`/api/milestones/invoice/${invoiceId}`)
export const saveMilestones = (invoiceId, milestones) => request(`/api/milestones/invoice/${invoiceId}`, { method: 'PUT', body: JSON.stringify({ milestones }) })
export const updateMilestoneStatus = (id, status, actualDate) => request(`/api/milestones/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, actual_payment_date: actualDate }) })

// Notes — project-level and invoice-level
export const getProjectNotes = (projectId) => request(`/api/notes/project/${projectId}`)
export const addProjectNote = (projectId, note) => request(`/api/notes/project/${projectId}`, { method: 'POST', body: JSON.stringify({ note }) })
export const deleteProjectNote = (noteId) => request(`/api/notes/project-note/${noteId}`, { method: 'DELETE' })

export const getInvoiceNotes = (invoiceId) => request(`/api/notes/invoice/${invoiceId}`)
export const addInvoiceNote = (invoiceId, note) => request(`/api/notes/invoice/${invoiceId}`, { method: 'POST', body: JSON.stringify({ note }) })
export const deleteInvoiceNote = (noteId) => request(`/api/notes/invoice-note/${noteId}`, { method: 'DELETE' })

// Dashboard
export const getCollections = () => request('/api/dashboard/collections')
export const getKpis = () => request('/api/dashboard/kpis')

export const snoozeMilestone = (id, days) => request(`/api/milestones/${id}/snooze`, { method: 'PATCH', body: JSON.stringify({ days }) })
export const unsnoozeMilestone = (id) => request(`/api/milestones/${id}/unsnooze`, { method: 'PATCH' })
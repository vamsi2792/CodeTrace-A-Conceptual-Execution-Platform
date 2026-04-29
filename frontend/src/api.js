const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('code_trace_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Request failed')
  }
  return response.json().catch(() => null)
}

export async function register(email, password) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function fetchStats() {
  return request('/api/users/me/stats')
}

export async function fetchSnippet(difficulty) {
  return request(`/api/snippets/generate/${difficulty}`)
}

export async function submitAttempt(snippet_id, user_answer) {
  return request('/api/attempts', {
    method: 'POST',
    body: JSON.stringify({ snippet_id, user_answer }),
  })
}

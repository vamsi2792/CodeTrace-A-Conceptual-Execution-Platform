import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App.jsx'

// Mock all API calls so no real network requests are made.
vi.mock('../api', () => ({
  login: vi.fn(),
  register: vi.fn(),
  fetchStats: vi.fn(),
  fetchHistory: vi.fn(),
  fetchSnippet: vi.fn(),
  fetchGeneratedSnippet: vi.fn(),
  generateCustomSnippet: vi.fn(),
  fetchSnippetAssistant: vi.fn(),
  submitAttempt: vi.fn(),
}))

import * as api from '../api'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  // Default responses so useEffect calls don't throw.
  api.fetchStats.mockResolvedValue(null)
  api.fetchHistory.mockResolvedValue([])
})

// ---------------------------------------------------------------------------
// Initial render
// ---------------------------------------------------------------------------

describe('initial render', () => {
  it('shows the login form when no token is stored', () => {
    render(<App />)
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter a secure password')).toBeInTheDocument()
  })

  it('shows a Register toggle button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument()
  })

  it('does not show the username field in login mode', () => {
    render(<App />)
    expect(screen.queryByPlaceholderText('Your display name')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Mode toggle (login ↔ register)
// ---------------------------------------------------------------------------

describe('mode toggle', () => {
  it('switches to register form when Register button is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Your display name')).toBeInTheDocument()
  })

  it('switches back to login form when Login button is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Register form validation
// ---------------------------------------------------------------------------

describe('register form validation', () => {
  it('shows an error when username is empty on register', async () => {
    api.register.mockResolvedValue({ access_token: 'tok', token_type: 'bearer' })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

    // Fill email and password but leave username blank.
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter a secure password'), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => {
      expect(screen.getByText('Please enter a username')).toBeInTheDocument()
    })
    expect(api.register).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Login flow
// ---------------------------------------------------------------------------

describe('login flow', () => {
  it('calls login API with email and password on submit', async () => {
    api.login.mockResolvedValue({ access_token: 'test-token', token_type: 'bearer' })
    api.fetchStats.mockResolvedValue({
      username: 'alice',
      snippets_solved: 0,
      current_streak: 0,
      accuracy_percentage: 0,
    })

    render(<App />)
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'alice@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter a secure password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('alice@example.com', 'password123')
    })
  })

  it('stores token in localStorage after successful login', async () => {
    api.login.mockResolvedValue({ access_token: 'saved-token', token_type: 'bearer' })
    api.fetchStats.mockResolvedValue({
      username: 'bob',
      snippets_solved: 0,
      current_streak: 0,
      accuracy_percentage: 0,
    })

    render(<App />)
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'bob@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter a secure password'), {
      target: { value: 'pass' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => {
      expect(localStorage.getItem('code_trace_token')).toBe('saved-token')
    })
  })

  it('shows error message on failed login', async () => {
    api.login.mockRejectedValue(new Error('Invalid credentials'))
    render(<App />)
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'bad@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter a secure password'), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

describe('logout', () => {
  it('clears token from localStorage and shows login form', async () => {
    api.login.mockResolvedValue({ access_token: 'tok', token_type: 'bearer' })
    api.fetchStats.mockResolvedValue({
      username: 'alice',
      snippets_solved: 3,
      current_streak: 1,
      accuracy_percentage: 100,
    })

    render(<App />)
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'alice@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter a secure password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    // Wait for dashboard to appear.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(localStorage.getItem('code_trace_token')).toBeNull()
      expect(screen.getByText('Welcome back')).toBeInTheDocument()
    })
  })
})

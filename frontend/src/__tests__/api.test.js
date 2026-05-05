import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  register,
  login,
  fetchStats,
  fetchSnippet,
  fetchGeneratedSnippet,
  generateCustomSnippet,
  fetchSnippetAssistant,
  submitAttempt,
  fetchHistory,
} from '../api.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockOkResponse(body) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
  })
}

function mockErrorResponse(status, detail) {
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ detail }),
    status,
  })
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------

describe('register', () => {
  it('POST to /api/auth/register with correct body', async () => {
    fetch.mockReturnValueOnce(mockOkResponse({ access_token: 'tok', token_type: 'bearer' }))
    const result = await register('alice', 'alice@example.com', 'pass123')
    expect(fetch).toHaveBeenCalledOnce()
    const [url, options] = fetch.mock.calls[0]
    expect(url).toContain('/api/auth/register')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toMatchObject({
      username: 'alice',
      email: 'alice@example.com',
      password: 'pass123',
    })
    expect(result.access_token).toBe('tok')
  })

  it('throws with server detail message on error', async () => {
    fetch.mockReturnValueOnce(mockErrorResponse(400, 'Email already registered'))
    await expect(register('bob', 'bob@example.com', 'pw')).rejects.toThrow('Email already registered')
  })
})

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

describe('login', () => {
  it('POST to /api/auth/login with email and password', async () => {
    fetch.mockReturnValueOnce(mockOkResponse({ access_token: 'tok2', token_type: 'bearer' }))
    await login('dave@example.com', 'secret')
    const [url, options] = fetch.mock.calls[0]
    expect(url).toContain('/api/auth/login')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toMatchObject({ email: 'dave@example.com', password: 'secret' })
  })

  it('throws on invalid credentials', async () => {
    fetch.mockReturnValueOnce(mockErrorResponse(401, 'Invalid credentials'))
    await expect(login('x@x.com', 'wrong')).rejects.toThrow('Invalid credentials')
  })
})

// ---------------------------------------------------------------------------
// fetchStats
// ---------------------------------------------------------------------------

describe('fetchStats', () => {
  it('GET /api/users/me/stats with auth header when token in localStorage', async () => {
    localStorage.setItem('code_trace_token', 'mytoken')
    fetch.mockReturnValueOnce(mockOkResponse({ username: 'alice', snippets_solved: 5 }))
    const stats = await fetchStats()
    const [url, options] = fetch.mock.calls[0]
    expect(url).toContain('/api/users/me/stats')
    expect(options.headers.Authorization).toBe('Bearer mytoken')
    expect(stats.snippets_solved).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// fetchSnippet
// ---------------------------------------------------------------------------

describe('fetchSnippet', () => {
  it('GET /api/snippets/{difficulty} without exclude param', async () => {
    fetch.mockReturnValueOnce(mockOkResponse({ id: 1, code_text: 'print(1)', difficulty_level: 'Beginner' }))
    await fetchSnippet('Beginner')
    const [url] = fetch.mock.calls[0]
    expect(url).toContain('/api/snippets/Beginner')
    expect(url).not.toContain('exclude_id')
  })

  it('appends exclude_id query param when provided', async () => {
    fetch.mockReturnValueOnce(mockOkResponse({ id: 2, code_text: 'x', difficulty_level: 'Beginner' }))
    await fetchSnippet('Beginner', 7)
    const [url] = fetch.mock.calls[0]
    expect(url).toContain('exclude_id=7')
  })
})

// ---------------------------------------------------------------------------
// fetchGeneratedSnippet
// ---------------------------------------------------------------------------

describe('fetchGeneratedSnippet', () => {
  it('GET /api/snippets/generate/{difficulty}', async () => {
    fetch.mockReturnValueOnce(mockOkResponse({ id: 3, code_text: 'y', difficulty_level: 'Advanced' }))
    await fetchGeneratedSnippet('Advanced')
    const [url] = fetch.mock.calls[0]
    expect(url).toContain('/api/snippets/generate/Advanced')
  })

  it('appends exclude_id when provided', async () => {
    fetch.mockReturnValueOnce(mockOkResponse({ id: 4, code_text: 'z', difficulty_level: 'Intermediate' }))
    await fetchGeneratedSnippet('Intermediate', 10)
    const [url] = fetch.mock.calls[0]
    expect(url).toContain('exclude_id=10')
  })
})

// ---------------------------------------------------------------------------
// generateCustomSnippet
// ---------------------------------------------------------------------------

describe('generateCustomSnippet', () => {
  it('builds correct query string with all params', async () => {
    fetch.mockReturnValueOnce(mockOkResponse({ id: 5, code_text: 'custom', difficulty_level: 'Beginner' }))
    await generateCustomSnippet('Beginner', 'JavaScript', 'closures', 3)
    const [url] = fetch.mock.calls[0]
    expect(url).toContain('/api/snippets/custom')
    expect(url).toContain('difficulty=Beginner')
    expect(url).toContain('language=JavaScript')
    expect(url).toContain('topic=closures')
    expect(url).toContain('exclude_id=3')
  })

  it('omits topic when not provided', async () => {
    fetch.mockReturnValueOnce(mockOkResponse({ id: 6, code_text: 'c2', difficulty_level: 'Advanced' }))
    await generateCustomSnippet('Advanced', 'Python', null, null)
    const [url] = fetch.mock.calls[0]
    expect(url).not.toContain('topic')
    expect(url).not.toContain('exclude_id')
  })
})

// ---------------------------------------------------------------------------
// fetchSnippetAssistant
// ---------------------------------------------------------------------------

describe('fetchSnippetAssistant', () => {
  it('GET /api/snippets/{id}/assistant with mode param', async () => {
    fetch.mockReturnValueOnce(mockOkResponse({ message: 'Here is a hint.' }))
    const result = await fetchSnippetAssistant(42, 'hint')
    const [url] = fetch.mock.calls[0]
    expect(url).toContain('/api/snippets/42/assistant')
    expect(url).toContain('mode=hint')
    expect(result.message).toBe('Here is a hint.')
  })

  it('includes user_answer param for why_wrong mode', async () => {
    fetch.mockReturnValueOnce(mockOkResponse({ message: 'Because...' }))
    await fetchSnippetAssistant(42, 'why_wrong', 'my wrong answer')
    const [url] = fetch.mock.calls[0]
    expect(url).toContain('user_answer=my+wrong+answer')
  })
})

// ---------------------------------------------------------------------------
// submitAttempt
// ---------------------------------------------------------------------------

describe('submitAttempt', () => {
  it('POST to /api/attempts with snippet_id and user_answer', async () => {
    fetch.mockReturnValueOnce(mockOkResponse({ is_correct: true, expected_output: '42', user_answer: '42', explanation: 'ok' }))
    const result = await submitAttempt(10, '42')
    const [url, options] = fetch.mock.calls[0]
    expect(url).toContain('/api/attempts')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toMatchObject({ snippet_id: 10, user_answer: '42' })
    expect(result.is_correct).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// fetchHistory
// ---------------------------------------------------------------------------

describe('fetchHistory', () => {
  it('GET /api/attempts/history with auth header', async () => {
    localStorage.setItem('code_trace_token', 'histtoken')
    fetch.mockReturnValueOnce(mockOkResponse([{ attempt_id: 1 }]))
    const history = await fetchHistory()
    const [url, options] = fetch.mock.calls[0]
    expect(url).toContain('/api/attempts/history')
    expect(options.headers.Authorization).toBe('Bearer histtoken')
    expect(history).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Generic error handling
// ---------------------------------------------------------------------------

describe('error handling', () => {
  it('throws generic message when server returns no detail', async () => {
    fetch.mockReturnValueOnce(Promise.resolve({
      ok: false,
      json: () => Promise.reject(new Error('not json')),
    }))
    await expect(fetchStats()).rejects.toThrow('Request failed')
  })
})

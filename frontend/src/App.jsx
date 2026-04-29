import { useEffect, useState } from 'react'
import { login, register, fetchStats, fetchSnippet, submitAttempt } from './api'

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

function normalizeDifficulty(value) {
  return value.toLowerCase()
}

function App() {
  const [screen, setScreen] = useState('login')
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [token, setToken] = useState(localStorage.getItem('code_trace_token') || '')
  const [stats, setStats] = useState(null)
  const [snippet, setSnippet] = useState(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null)
  const [answer, setAnswer] = useState('')
  const [timer, setTimer] = useState(120)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      localStorage.setItem('code_trace_token', token)
      setScreen('dashboard')
      loadStats()
    }
  }, [token])

  useEffect(() => {
    let interval
    if (screen === 'exercise' && snippet) {
      interval = setInterval(() => {
        setTimer((current) => {
          if (current <= 1) {
            clearInterval(interval)
            return 0
          }
          return current - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [screen, snippet])

  async function loadStats() {
    try {
      const data = await fetchStats()
      setStats(data)
    } catch (err) {
      console.error(err)
      setError('Unable to load stats. Please log in again.')
      setScreen('login')
    }
  }

  async function handleAuth() {
    setError('')
    setLoading(true)
    try {
      const action = mode === 'login' ? login : register
      const payload = await action(email, password)
      if (payload.access_token) {
        setToken(payload.access_token)
        setScreen('dashboard')
      } else {
        setScreen('dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function selectDifficulty(level, excludeSnippetId = null) {
    setError('')
    setLoading(true)
    setSelectedDifficulty(level)
    setAnswer('')
    setResult(null)
    try {
      const data = await fetchSnippet(level, excludeSnippetId)
      setSnippet(data)
      setTimer(120)
      setScreen('exercise')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!snippet) return
    setError('')
    setLoading(true)
    try {
      const data = await submitAttempt(snippet.id, answer)
      setResult(data)
      await loadStats()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    if (selectedDifficulty) {
      selectDifficulty(selectedDifficulty, snippet?.id ?? null)
    }
  }

  function handleLogout() {
    localStorage.removeItem('code_trace_token')
    setToken('')
    setStats(null)
    setSnippet(null)
    setScreen('login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">CodeTrace</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Code Reading Educational Platform</h1>
          </div>
          {token && (
            <button onClick={handleLogout} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
              Log out
            </button>
          )}
        </header>

        {screen === 'login' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
              >
                {mode === 'login' ? 'Register' : 'Log in'}
              </button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                onClick={handleAuth}
                disabled={loading}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Working...' : mode === 'login' ? 'Log in' : 'Create account'}
              </button>
            </div>
          </div>
        )}

        {screen === 'dashboard' && stats && (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Snippets Solved</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.snippets_solved}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Current Streak</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.current_streak}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Overall Accuracy</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.accuracy_percentage}%</p>
              </div>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-2xl font-semibold">Choose a difficulty</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {DIFFICULTIES.map((level) => (
                  <button
                    key={level}
                    onClick={() => selectDifficulty(level)}
                    className="rounded-3xl border border-slate-300 bg-slate-50 px-6 py-8 text-left transition hover:border-slate-400 hover:bg-slate-100"
                  >
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{level}</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">Practice {level.toLowerCase()} snippets</p>
                  </button>
                ))}
              </div>
            </section>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        {screen === 'exercise' && snippet && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{snippet.difficulty_level} challenge</p>
                <p className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">Time left: {timer}s</p>
              </div>
              <pre className="mt-5 overflow-x-auto rounded-3xl bg-slate-900 p-6 text-sm leading-6 text-green-200">
                <code>{snippet.code_text}</code>
              </pre>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="block text-sm font-medium text-slate-700">Predict console output</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={8}
                className="mt-3 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-4 rounded-3xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Submit answer
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6">
            <div className="w-full max-w-3xl rounded-[2rem] bg-white p-8 shadow-2xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-sm font-semibold ${result.is_correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {result.is_correct ? 'Correct answer!' : 'Incorrect answer'}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">Review your submission</h3>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Your answer</p>
                  <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-900">{result.user_answer || 'No answer provided'}</pre>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Expected output</p>
                  <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-900">{result.expected_output}</pre>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Explanation</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{result.explanation}</p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null)
                    setScreen('dashboard')
                  }}
                  className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-slate-900 transition hover:bg-slate-100"
                >
                  Back to dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null)
                    handleNext()
                  }}
                  className="rounded-3xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-800"
                >
                  Next question
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

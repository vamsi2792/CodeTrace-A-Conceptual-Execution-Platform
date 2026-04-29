import { useEffect, useState } from 'react'
import { fetchHistory, fetchSnippet, fetchStats, login, register, submitAttempt } from './api'

function App() {
  const [screen, setScreen] = useState('login')
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [token, setToken] = useState(localStorage.getItem('code_trace_token') || '')
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [snippet, setSnippet] = useState(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState('Beginner')
  const [answer, setAnswer] = useState('')
  const [timer, setTimer] = useState(120)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      localStorage.setItem('code_trace_token', token)
      loadStats()
      loadHistory()
      setScreen('dashboard')
    }
  }, [token])

  useEffect(() => {
    let interval
    if (screen === 'exercise' && snippet) {
      interval = setInterval(() => {
        setTimer((current) => (current <= 1 ? 0 : current - 1))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [screen, snippet])

  async function loadStats() {
    const data = await fetchStats()
    setStats(data)
  }

  async function loadHistory() {
    const data = await fetchHistory()
    setHistory(data || [])
  }

  async function handleAuth() {
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        if (!username.trim()) {
          throw new Error('Please enter a username')
        }
        const payload = await register(username.trim(), email, password)
        setToken(payload.access_token)
      } else {
        const payload = await login(email, password)
        setToken(payload.access_token)
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
      await loadHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('code_trace_token')
    setToken('')
    setStats(null)
    setHistory([])
    setSnippet(null)
    setScreen('login')
  }

  const displayName = stats?.username || 'User'
  let authButtonLabel = mode === 'login' ? 'Log in' : 'Create account'
  if (loading) authButtonLabel = 'Working...'

  return (
    <div className="min-h-screen bg-slate-200 p-4 text-slate-900">
      <div className="mx-auto max-w-6xl">
        {token && (
          <header className="overflow-hidden rounded-t-2xl border border-slate-300 bg-white">
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[10px] text-slate-600">~~</div>
                  <p className="text-3xl font-semibold">CodeTrace</p>
                </div>
                <div className="flex items-center gap-6 text-xl">
                  <button type="button" onClick={() => setScreen('dashboard')} className={screen === 'dashboard' ? 'border-b-2 border-blue-500 pb-1 font-medium text-blue-600' : 'pb-1 text-slate-700'}>Home</button>
                  <button type="button" onClick={() => setScreen('history')} className={screen === 'history' ? 'border-b-2 border-blue-500 pb-1 font-medium text-blue-600' : 'pb-1 text-slate-700'}>History</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-slate-300" />
                <span className="text-sm font-medium text-slate-700">{displayName}</span>
                <button onClick={handleLogout} className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-100">Log out</button>
              </div>
            </div>
          </header>
        )}
        <div className={`rounded-b-2xl border border-slate-300 bg-slate-100 p-5 ${token ? 'border-t-0' : ''}`}>
          {screen === 'login' && (
            <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
                <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white hover:bg-slate-800">
                  {mode === 'login' ? 'Register' : 'Log in'}
                </button>
              </div>
              <div className="space-y-3">
                {mode === 'register' && (
                  <>
                    <label htmlFor="auth-username" className="block text-sm font-medium text-slate-700">Username</label>
                    <input id="auth-username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus:border-slate-500 focus:outline-none" />
                  </>
                )}
                <label htmlFor="auth-email" className="block text-sm font-medium text-slate-700">Email</label>
                <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus:border-slate-500 focus:outline-none" />
                <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700">Password</label>
                <input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus:border-slate-500 focus:outline-none" />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button onClick={handleAuth} disabled={loading} className="w-full rounded-xl bg-slate-900 px-3 py-2 text-white hover:bg-slate-800 disabled:opacity-60">
                  {authButtonLabel}
                </button>
              </div>
            </div>
          )}

          {screen === 'dashboard' && stats && (
            <div className="space-y-4">
              <section>
                <h2 className="text-4xl font-bold">Welcome back, {displayName}!</h2>
                <p className="text-base text-slate-700">Track your progress and start your next coding challenge.</p>
              </section>
              <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xl font-semibold">Snippets Solved</p>
                  <p className="mt-2 text-4xl font-bold">{stats.snippets_solved}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xl font-semibold">Current Streak</p>
                  <p className="mt-2 text-4xl font-bold">{stats.current_streak} {stats.current_streak === 1 ? 'Day' : 'Days'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xl font-semibold">Overall Accuracy</p>
                  <p className="mt-2 text-4xl font-bold">{stats.accuracy_percentage}%</p>
                </div>
              </section>
              <section className="rounded-xl border border-slate-300 bg-white p-5">
                <h3 className="text-4xl font-bold">Select Difficulty Level</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 p-4 text-center">
                    <p className="text-3xl">🚀</p>
                    <p className="mt-2 text-2xl font-semibold">Beginner</p>
                    <button onClick={() => selectDifficulty('Beginner')} className="mt-3 w-full rounded-lg bg-emerald-600 py-2 text-lg font-semibold text-white hover:bg-emerald-700">Start</button>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 text-center">
                    <p className="text-3xl">⚙️</p>
                    <p className="mt-2 text-2xl font-semibold">Intermediate</p>
                    <button onClick={() => selectDifficulty('Intermediate')} className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-lg font-semibold text-white hover:bg-blue-700">Start</button>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 text-center">
                    <p className="text-3xl">⚡</p>
                    <p className="mt-2 text-2xl font-semibold">Advanced</p>
                    <button onClick={() => selectDifficulty('Advanced')} className="mt-3 w-full rounded-lg bg-purple-700 py-2 text-lg font-semibold text-white hover:bg-purple-800">Start</button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {screen === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Attempt History</h2>
                <button onClick={() => setScreen('dashboard')} className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm">Back</button>
              </div>
              <div className="max-h-[55vh] overflow-auto rounded-xl border border-slate-300 bg-white">
                {history.length === 0 && <p className="p-4 text-slate-600">No attempts yet.</p>}
                {history.map((item) => (
                  <div key={item.attempt_id} className="border-b border-slate-200 p-4 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{item.difficulty_level}</p>
                      <span className={`text-sm font-medium ${item.is_correct ? 'text-emerald-600' : 'text-rose-600'}`}>{item.is_correct ? 'Correct' : 'Incorrect'}</span>
                    </div>
                    <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-2 text-xs">{item.code_text}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {screen === 'exercise' && snippet && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setScreen('dashboard')} className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm">Back</button>
                <p className="text-sm text-slate-700">{selectedDifficulty} challenge - {timer}s left</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-950 p-5 text-white">
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-green-200"><code>{snippet.code_text}</code></pre>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <label htmlFor="exercise-answer" className="block text-sm font-medium text-slate-700">Predict console output</label>
                <textarea id="exercise-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={6} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus:border-slate-500 focus:outline-none" />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                <button onClick={handleSubmit} disabled={loading} className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60">Submit answer</button>
              </div>
            </div>
          )}

          {result && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6">
              <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
                <p className={`text-sm font-semibold ${result.is_correct ? 'text-emerald-600' : 'text-rose-600'}`}>{result.is_correct ? 'Correct answer!' : 'Incorrect answer'}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Your answer</p><pre className="mt-2 whitespace-pre-wrap text-sm">{result.user_answer || 'No answer provided'}</pre></div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Expected output</p><pre className="mt-2 whitespace-pre-wrap text-sm">{result.expected_output}</pre></div>
                </div>
                <p className="mt-3 text-sm text-slate-700">{result.explanation}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => { setResult(null); setScreen('dashboard') }} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm">Back to dashboard</button>
                  <button type="button" onClick={() => { setResult(null); selectDifficulty(selectedDifficulty, snippet?.id ?? null) }} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">Next question</button>
                </div>
              </div>
            </div>
          )}
          {error && screen !== 'login' && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default App

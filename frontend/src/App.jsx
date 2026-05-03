import { useEffect, useState } from 'react'
import { fetchHistory, fetchSnippet, fetchStats, fetchGeneratedSnippet, generateCustomSnippet, fetchSnippetAssistant, login, register, submitAttempt } from './api'

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
  const [customLanguage, setCustomLanguage] = useState('Python')
  const [customTopic, setCustomTopic] = useState('recursion')
  const [assistantMessage, setAssistantMessage] = useState('')
  const [assistantMode, setAssistantMode] = useState('')
  const [assistantHistory, setAssistantHistory] = useState([])
  const [answer, setAnswer] = useState('')
  const [timer, setTimer] = useState(120)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fastMode, setFastMode] = useState(true)

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

  async function generateCustomChallenge() {
    setError('')
    setLoading(true)
    setAssistantMessage('')
    setAssistantHistory([])
    try {
      const data = await generateCustomSnippet(selectedDifficulty, customLanguage, customTopic, snippet?.id ?? null)
      setSnippet(data)
      setTimer(120)
      setScreen('exercise')
      setAssistantMode('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function requestAssistant(mode) {
    if (!snippet) return
    setError('')
    setAssistantMessage('')
    setAssistantMode(mode)
    try {
      const response = await fetchSnippetAssistant(snippet.id, mode, mode === 'why_wrong' ? answer : '')
      setAssistantMessage(response.message)
      setAssistantHistory((history) => [
        { mode, message: response.message, timestamp: new Date().toISOString() },
        ...history,
      ])
    } catch (err) {
      setError(err.message)
    }
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
    setAssistantMessage('')
    setAssistantMode('')
    setAssistantHistory([])
    try {
      const data = fastMode ? await fetchSnippet(level, excludeSnippetId) : await fetchGeneratedSnippet(level, excludeSnippetId)
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

  const displayName = stats?.username || 'Coder'
  const authButtonLabel = loading ? 'Working…' : mode === 'login' ? 'Log in' : 'Create account'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">CodeTrace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Learn code output faster with interactive challenges.</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Predict terminal output, earn streaks, and let AI generate new practice snippets automatically.</p>
            </div>
            {token && (
              <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-slate-200 shadow-lg">
                <span className="text-sm uppercase tracking-[0.2em] text-slate-400">Signed in as</span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-medium text-white">{displayName}</span>
                <button onClick={handleLogout} className="rounded-full border border-slate-700 bg-slate-800 px-4 py-1 text-sm hover:bg-slate-700">Sign out</button>
              </div>
            )}
          </div>
        </div>

        {!token && (
          <div className="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-white">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
                <p className="mt-2 text-slate-400">{mode === 'login' ? 'Sign in to access your coding dashboard' : 'Start solving AI-powered code challenges'}</p>
              </div>
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
                {mode === 'login' ? 'Register' : 'Login'}
              </button>
            </div>
            <div className="grid gap-4">
              {mode === 'register' && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-300">Username</label>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} className="rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none" placeholder="Your display name" />
                </div>
              )}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none" placeholder="you@example.com" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none" placeholder="Enter a secure password" />
              </div>
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <button onClick={handleAuth} disabled={loading} className="rounded-3xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-70">
                {authButtonLabel}
              </button>
            </div>
          </div>
        )}

        {token && screen === 'dashboard' && stats && (
          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">Your practice overview</h2>
                  </div>
                  <div className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">Fast · Focused · Fresh</div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl bg-slate-900 p-4 shadow-inner ring-1 ring-white/5">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Solved</p>
                    <p className="mt-3 text-4xl font-semibold text-white">{stats.snippets_solved}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900 p-4 shadow-inner ring-1 ring-white/5">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Streak</p>
                    <p className="mt-3 text-4xl font-semibold text-white">{stats.current_streak}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900 p-4 shadow-inner ring-1 ring-white/5">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Accuracy</p>
                    <p className="mt-3 text-4xl font-semibold text-white">{stats.accuracy_percentage}%</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">AI Practice</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Generate new exercises instantly</h3>
                  </div>
                  <div className="rounded-full bg-blue-500 px-3 py-1 text-sm font-semibold text-white">Powered by GPT</div>
                </div>
                <p className="mt-4 text-slate-300">Every question is created on demand. The more you practice, the sharper your output reading becomes.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button key={level} onClick={() => selectDifficulty(level)} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-5 text-left transition duration-300 hover:-translate-y-1 hover:bg-slate-900/80">
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{level}</p>
                      <p className="mt-3 text-xl font-semibold text-white">{level === 'Beginner' ? 'Start easy' : level === 'Intermediate' ? 'Step it up' : 'Go advanced'}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Fast mode loads existing snippets instantly.</p>
                  </div>
                  <button onClick={() => setFastMode(!fastMode)} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
                    {fastMode ? 'Fast mode on' : 'Fast mode off'}
                  </button>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Custom challenge</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Ask AI for a tailored snippet</h3>
                  </div>
                  <span className="rounded-full bg-cyan-500 px-3 py-1 text-sm font-semibold text-slate-950">Multi-language</span>
                </div>
                <p className="mt-4 text-slate-300">Create a challenge for a topic, language, and difficulty that fits your learning goals.</p>
                <div className="mt-6 grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm text-slate-400">Language</label>
                    <select value={customLanguage} onChange={(e) => setCustomLanguage(e.target.value)} className="rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none">
                      {['Python', 'JavaScript', 'Java'].map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm text-slate-400">Topic</label>
                    <input value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder="e.g. recursion, arrays, loops" className="rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <button onClick={generateCustomChallenge} disabled={loading} className="rounded-3xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white hover:from-violet-400 hover:to-fuchsia-400 disabled:opacity-70">Create custom challenge</button>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Focus mode</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Ready to solve code in seconds</h3>
                  </div>
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-sm font-semibold text-slate-950">Fast Loading</span>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl bg-slate-900 p-5 text-slate-300">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Practice flow</p>
                    <p className="mt-2 text-base">Pick a level → solve the snippet → review results → continue with fresh questions.</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900 p-5 text-slate-300">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Quick tip</p>
                    <p className="mt-2 text-base">Match line breaks exactly and avoid adding extra spaces in your answer.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {token && screen === 'history' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-semibold text-white">Attempt history</h2>
                <p className="text-slate-400">Review your past code predictions and learn from every result.</p>
              </div>
              <button onClick={() => setScreen('dashboard')} className="rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800">Back to dashboard</button>
            </div>
            <div className="grid gap-4">
              {history.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-slate-400">No attempts yet. Solve some challenges to see your history here.</div>
              ) : (
                history.map((item) => (
                  <div key={item.attempt_id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">{item.difficulty_level} challenge</p>
                        <p className="text-sm text-slate-400">{new Date(item.attempted_at).toLocaleString()}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${item.is_correct ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-slate-950'}`}>{item.is_correct ? 'Correct' : 'Incorrect'}</span>
                    </div>
                    <pre className="mt-4 overflow-x-auto rounded-3xl bg-slate-900 p-4 text-sm text-slate-100">{item.code_text}</pre>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {token && screen === 'exercise' && snippet && (
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button onClick={() => setScreen('dashboard')} className="rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800">Back</button>
                <div className="rounded-full bg-slate-900 px-4 py-2 text-sm text-slate-200">{selectedDifficulty} • {timer}s remaining</div>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Snippet</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Read the code and predict the output</h3>
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">AI-powered dynamic content</div>
                </div>
                <pre className="mt-5 overflow-x-auto rounded-[1.5rem] bg-slate-900 p-6 text-sm leading-6 text-emerald-200"><code>{snippet.code_text}</code></pre>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl ring-1 ring-white/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Your output prediction</p>
                    <p className="text-sm text-slate-400">Exact output, line breaks included.</p>
                  </div>
                  {loading && <span className="rounded-full bg-slate-900 px-3 py-1 text-sm text-slate-200">Submitting...</span>}
                </div>
                <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={8} className="mt-4 w-full rounded-[1.5rem] border border-slate-800 bg-slate-900 px-4 py-4 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none" placeholder="Type the exact console output here..." />
                {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => requestAssistant('hint')} className="rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700">Show hint</button>
                    <button type="button" onClick={() => requestAssistant('explain')} className="rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700">Explain line-by-line</button>
                  </div>
                  <button onClick={handleSubmit} disabled={loading} className="rounded-[1.5rem] bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-70">Submit answer</button>
                </div>
                <p className="mt-3 text-sm text-slate-400">Tip: whitespace and new lines matter.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">AI Tutor</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Your tutor assistant</h3>
                  </div>
                  <span className="rounded-full bg-indigo-500 px-3 py-1 text-sm font-semibold text-white">History</span>
                </div>
                <p className="mt-4 text-slate-300">Send a hint, explanation, or ask why an answer is wrong. The tutor keeps a record of every response.</p>
                <div className="mt-6 grid gap-3">
                  <button type="button" onClick={() => requestAssistant('hint')} className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Hint</button>
                  <button type="button" onClick={() => requestAssistant('explain')} className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Explain line-by-line</button>
                  <button type="button" onClick={() => requestAssistant('why_wrong')} className="rounded-3xl bg-rose-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-rose-400">Why this is wrong</button>
                  <button type="button" onClick={() => setAssistantHistory([])} className="rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800">Clear history</button>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl ring-1 ring-white/10">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Tutor history</p>
                <div className="mt-4 space-y-3">
                  {assistantHistory.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-slate-900 p-4 text-slate-400">No tutor responses yet. Ask for a hint or explanation to see history here.</div>
                  ) : (
                    assistantHistory.map((entry, index) => (
                      <div key={`${entry.mode}-${index}`} className="rounded-3xl border border-white/10 bg-slate-900 p-4 text-slate-100">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">{entry.mode === 'hint' ? 'Hint' : entry.mode === 'why_wrong' ? 'Why wrong' : 'Explanation'}</span>
                          <span className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-slate-300">{entry.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-[2rem] bg-slate-100 p-6 shadow-2xl ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-sm font-semibold ${result.is_correct ? 'text-emerald-600' : 'text-rose-600'}`}>{result.is_correct ? 'Correct answer!' : 'Incorrect answer'}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">Review your response</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${result.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{result.is_correct ? 'Well done' : 'Review and retry'}</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-900 p-4 text-slate-100">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Your answer</p>
                  <pre className="mt-3 whitespace-pre-wrap text-sm leading-6">{result.user_answer || 'No answer provided'}</pre>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-900 p-4 text-slate-100">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Expected output</p>
                  <pre className="mt-3 whitespace-pre-wrap text-sm leading-6">{result.expected_output}</pre>
                </div>
              </div>
              <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Explanation</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{result.explanation}</p>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                {result && !result.is_correct && (
                  <button type="button" onClick={() => requestAssistant('why_wrong')} className="w-full rounded-3xl bg-rose-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-rose-400">Why this is wrong</button>
                )}
                <div className="flex flex-wrap gap-3 justify-end">
                  <button type="button" onClick={() => { setResult(null); setScreen('dashboard') }} className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900">Back to dashboard</button>
                  <button type="button" onClick={() => { setResult(null); selectDifficulty(selectedDifficulty, snippet?.id ?? null) }} className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Next question</button>
                </div>
              </div>
              {assistantMessage && assistantMode === 'why_wrong' && (
                <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-900 p-4 text-sm text-slate-100">
                  <p className="font-semibold text-rose-200">Why this answer was incorrect</p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-300">{assistantMessage}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

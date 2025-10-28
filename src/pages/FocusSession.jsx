import React, { useState } from 'react'
import Timer from '../components/Timer'
import { supabase } from '../supabaseClient'
import './css/FocusSession.css'

export default function FocusSession({ user }) {
  const [mode, setMode] = useState('pomodoro') // 'pomodoro' or '50-10'
  const [duration, setDuration] = useState(25)
  const [selectedTask] = useState(null)

  function onModeChange(m) {
    setMode(m)
    if (m === 'pomodoro') setDuration(25)
    if (m === '50-10') setDuration(50)
  }

  async function handleComplete() {
    try {
      await supabase.from('sessions').insert({
        user_id: user.id,
        task_id: selectedTask?.id ?? null,
        duration_minutes: duration
      })
      alert('Session saved! Great work 🌟')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="focus-container">
      <div className="focus-grid">
        <div className="focus-left">
          <h2>Focus Session</h2>
          <div className="card focus-card">
            <div className="mode-select">
              <button
                className={`btn ${mode === 'pomodoro' ? '' : 'secondary'}`}
                onClick={() => onModeChange('pomodoro')}
              >
                Pomodoro (25/5)
              </button>
              <button
                className={`btn ${mode === '50-10' ? '' : 'secondary'}`}
                onClick={() => onModeChange('50-10')}
              >
                50 / 10
              </button>
              <select
                className="duration-select"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={45}>45</option>
              </select>
            </div>

            <Timer initialMinutes={duration} onComplete={handleComplete} />
          </div>
        </div>

        <div className="focus-right">
          <div className="card task-card">
            <h3>Choose task (optional)</h3>
            <p className="task-desc">
              If you pick a task, this session will be associated with it.
            </p>
            <div className="task-placeholder">
              <p className="task-placeholder-text">
                Task selection coming soon — use Tasks page to create tasks and they will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

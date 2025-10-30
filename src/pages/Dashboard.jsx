import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './css/Dashboard.css'
import takoProud from '../assets/tako_proud.png'

export default function Dashboard({ user }) {
  const [sessions, setSessions] = useState([])
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [focusGoal, setFocusGoal] = useState('')
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState([])
  const [streakCount, setStreakCount] = useState(0)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setSessions(data || [])
      const total = (data || []).reduce((s, cur) => s + (cur.duration_minutes || 0), 0)
      setTotalMinutes(total)

      // calculate streak (sessions done on consecutive days)
      if (data && data.length > 0) {
        const dates = [...new Set(data.map(d => d.created_at.split('T')[0]))]
        dates.sort((a, b) => new Date(b) - new Date(a))
        let streak = 1
        for (let i = 0; i < dates.length - 1; i++) {
          const curr = new Date(dates[i])
          const next = new Date(dates[i + 1])
          const diff = (curr - next) / (1000 * 60 * 60 * 24)
          if (diff === 1) streak++
          else break
        }
        setStreakCount(streak)
      }
    }
    load()
  }, [user])

  async function generatePlan() {
    if (!focusGoal.trim() || !user) return
    setLoadingPlan(true)

    try {
      const mockSteps = [
        'Define your objective clearly',
        'Gather materials or references',
        'Work deeply for 25 minutes',
        'Take a 5-minute refresh break',
        'Summarize what you accomplished',
      ]

      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: focusGoal,
          due_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()
      if (taskError) throw taskError

      const subs = mockSteps.map((s) => ({
        user_id: user.id,
        task_id: taskData.id,
        title: s,
      }))
      const { error: subError } = await supabase.from('subtasks').insert(subs)
      if (subError) throw subError

      setGeneratedPlan(mockSteps)
      setFocusGoal('')
    } catch (err) {
      console.error('Error generating plan:', err)
    } finally {
      setLoadingPlan(false)
    }
  }

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Dashboard</h2>

      {/* Focus Input Card */}
      <div className="focus-plan-card">
        <h3>What do you want to focus on today?</h3>
        <input
          type="text"
          className="focus-input"
          placeholder="e.g., Write essay draft, prepare for exam..."
          value={focusGoal}
          onChange={(e) => setFocusGoal(e.target.value)}
        />
        <button
          className="btn generate-btn"
          onClick={generatePlan}
          disabled={loadingPlan}
        >
          {loadingPlan ? 'Generating...' : 'Generate Plan'}
        </button>

        {generatedPlan.length > 0 && (
          <div className="generated-plan">
            <h4>Suggested Breakdown:</h4>
            <ul>
              {generatedPlan.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-left">
          <div className="card total-focus-card">
            <h3>Total Focus Time</h3>
            <p className="total-minutes">{totalMinutes} minutes</p>
            <p className="session-count">{sessions.length} sessions completed</p>
          </div>

          <div className="card recent-sessions-card">
            <h3>Recent Sessions</h3>
            <ul className="session-list">
              {sessions.slice(0, 6).map((s) => (
                <li key={s.id} className="session-item">
                  <div className="session-row">
                    <div>{s.task_id ? `Task: ${s.task_id}` : 'General focus'}</div>
                    <div className="session-duration">{s.duration_minutes} min</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="dashboard-right">
          <div className="card streak-card">
            <img src={takoProud} alt="Tako Proud" className="streak-mascot" />
            <h3>Your Focus Streak</h3>
            <p className="streak-count">{streakCount} day{streakCount !== 1 ? 's' : ''}</p>
            <p className="streak-text">Keep the momentum going 🔥</p>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './css/Dashboard.css'
import takoProud from '../assets/tako_proud.png'

export default function Dashboard({ user }) {
  const [sessions, setSessions] = useState([])
  const [totalMinutes, setTotalMinutes] = useState(0)

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
    }
    load()
  }, [user])

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Dashboard</h2>
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
              {sessions.slice(0, 6).map(s => (
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
          <div className="card encouragement-card">
            <img src={takoProud} alt="tako" className="encouragement-img" />
            <h3>Keep it up!</h3>
            <p className="encouragement-text">Complete sessions to grow your streak.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

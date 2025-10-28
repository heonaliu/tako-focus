import React, { useState } from 'react'
import Timer from '../components/Timer'
import { supabase } from '../supabaseClient'

export default function FocusSession({ user }){
  const [mode, setMode] = useState('pomodoro') // 'pomodoro' or '50/10'
  const [duration, setDuration] = useState(25)
  const [selectedTask] = useState(null)

  function onModeChange(m){
    setMode(m)
    if (m === 'pomodoro') setDuration(25)
    if (m === '50-10') setDuration(50)
  }

  async function handleComplete(){
    // log session to DB for user
    try {
      await supabase.from('sessions').insert({
        user_id: user.id,
        task_id: selectedTask?.id ?? null,
        duration_minutes: duration
      })
      // optional: show a small modal or toast
      alert('Session saved! Great work 🌟')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="container">
      <div className="grid-2">
        <div>
          <h2>Focus Session</h2>
          <div className="card" style={{marginBottom:20}}>
            <div style={{display:'flex', gap:10, marginBottom:10}}>
              <button className={`btn ${mode==='pomodoro'?'':'secondary'}`} onClick={()=> onModeChange('pomodoro')}>Pomodoro (25/5)</button>
              <button className={`btn ${mode==='50-10'?'':'secondary'}`} onClick={()=> onModeChange('50-10')}>50 / 10</button>
              <select value={duration} onChange={e=>setDuration(Number(e.target.value))} style={{marginLeft:'auto', padding:8}}>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={45}>45</option>
              </select>
            </div>

            <Timer initialMinutes={duration} onComplete={handleComplete}/>
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Choose task (optional)</h3>
            <p style={{color:'var(--muted)'}}>If you pick a task, this session will be associated with it.</p>
            {/* TODO: list user's tasks fetched from DB — keep simple for now */}
            <div style={{marginTop:12}}>
              <p style={{color:'var(--muted)'}}>Task selection coming soon — use Tasks page to create tasks and they will appear here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

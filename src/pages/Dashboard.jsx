import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Dashboard({ user }){
  const [sessions, setSessions] = useState([])
  const [totalMinutes, setTotalMinutes] = useState(0)

  useEffect(()=> {
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
    <div className="container">
      <h2 style={{marginBottom:8}}>Dashboard</h2>
      <div className="grid-2">
        <div>
          <div className="card" style={{marginBottom:20}}>
            <h3>Total Focus Time</h3>
            <p style={{fontSize:28, fontWeight:700}}>{totalMinutes} minutes</p>
            <p style={{color:'var(--muted)'}}>{sessions.length} sessions completed</p>
          </div>

          <div className="card">
            <h3>Recent Sessions</h3>
            <ul>
              {sessions.slice(0,6).map(s => (
                <li key={s.id} style={{padding:'8px 0', borderBottom:'1px solid #f0f0f0'}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <div>{s.task_id ? `Task: ${s.task_id}` : 'General focus'}</div>
                    <div style={{color:'var(--muted)'}}>{s.duration_minutes} min</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="card" style={{textAlign:'center'}}>
            <img src="/assets/tako_proud.png" alt="tako" style={{width:220}}/>
            <h3 style={{marginTop:10}}>Keep it up!</h3>
            <p style={{color:'var(--muted)'}}>Complete sessions to grow your streak.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

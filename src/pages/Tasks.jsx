import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Tasks({ user }){
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(()=> { if (!user) return load(); async function load(){ 
      const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending:false })
      setTasks(data || [])
  }}, [user])

  async function createTask(){
    if (!title.trim()) return
    const { data, error } = await supabase.from('tasks').insert({ user_id: user.id, title, notes }).select()
    if (error) return alert(error.message)
    setTasks([data[0], ...tasks])
    setTitle(''); setNotes('')
  }

  async function toggleDone(id, done){
    await supabase.from('tasks').update({ is_done: !done, updated_at: new Date() }).eq('id', id)
    setTasks(tasks.map(t => t.id===id?{...t, is_done: !done}:t))
  }

  async function deleteTask(id){
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter(t=> t.id !== id))
  }

  return (
    <div className="container">
      <h2>Tasks</h2>
      <div className="card" style={{marginBottom:20}}>
        <input placeholder="Task title" value={title} onChange={e=>setTitle(e.target.value)} style={{width:'100%', padding:10, marginBottom:8}}/>
        <textarea placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} style={{width:'100%', padding:10, marginBottom:8}}/>
        <div style={{display:'flex', gap:8}}>
          <button className="btn" onClick={createTask}>Create</button>
        </div>
      </div>

      <div className="card">
        {tasks.length===0 && <p style={{color:'var(--muted)'}}>No tasks yet.</p>}
        {tasks.map(t=>(
          <div key={t.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f1f1f1'}}>
            <div>
              <div style={{fontWeight:600}}>{t.title}</div>
              <div style={{color:'var(--muted)', fontSize:13}}>{t.notes}</div>
            </div>
            <div style={{display:'flex', gap:8}}>
              <button className="btn secondary" onClick={()=>toggleDone(t.id, t.is_done)}>{t.is_done? 'Undo': 'Done'}</button>
              <button className="btn secondary" onClick={()=> deleteTask(t.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

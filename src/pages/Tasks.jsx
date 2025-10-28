import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './css/Tasks.css'

export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setTasks(data || [])
    }
    load()
  }, [user])

  async function createTask() {
  if (!title.trim()) return

  // Get the profile record for the current user
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError.message)
    alert('Could not find your profile. Try logging out and back in.')
    return
  }

  // Insert new task using the profile.id
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: profile.id, // ✅ Correct foreign key
      title,
      notes
    })
    .select()

  if (error) {
    console.error('Insert error:', error.message)
    console.log("Profile ID used:", profile.id)
    alert(error.message)
    return
  }

  setTasks([data[0], ...tasks])
  setTitle('')
  setNotes('')
}


  async function toggleDone(id, done) {
    await supabase
      .from('tasks')
      .update({ is_done: !done, updated_at: new Date() })
      .eq('id', id)
    setTasks(tasks.map(t => (t.id === id ? { ...t, is_done: !done } : t)))
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  return (
    <div className="tasks-container">
      <h2>Tasks</h2>

      <div className="card new-task-card">
        <input
          className="task-input"
          placeholder="Task"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="task-notes"
          placeholder="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <div className="task-actions">
          <button className="btn" onClick={createTask}>
            Create
          </button>
        </div>
      </div>

      <div className="card task-list-card">
        {tasks.length === 0 && (
          <p className="no-tasks">No tasks yet.</p>
        )}

        {tasks.map(t => (
          <div key={t.id} className="task-item">
            <div className="task-details">
              <div className="task-title">{t.title}</div>
              <div className="task-notes-preview">{t.notes}</div>
            </div>
            <div className="task-buttons">
              <button
                className="btn secondary"
                onClick={() => toggleDone(t.id, t.is_done)}
              >
                {t.is_done ? 'Undo' : 'Done'}
              </button>
              <button
                className="btn secondary"
                onClick={() => deleteTask(t.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

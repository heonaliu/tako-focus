import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './css/Tasks.css'

export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 🔹 Load tasks for the logged-in user
  useEffect(() => {
    if (!user) return

    async function loadTasks() {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id) // profile.id = auth.uid()
          .order('created_at', { ascending: false })

        if (error) throw error

        setTasks(data || [])
      } catch (err) {
        console.error('Error loading tasks:', err.message)
        setError('Failed to load tasks.')
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [user])

  // 🔹 Create a new task
  async function createTask() {
    if (!title.trim()) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title,
          notes,
        })
        .select()

      if (error) throw error

      setTasks([data[0], ...tasks])
      setTitle('')
      setNotes('')
    } catch (err) {
      console.error('Insert error:', err.message)
      alert(err.message)
    }
  }

  // 🔹 Toggle done/undone
  async function toggleDone(id, done) {
    try {
      await supabase
        .from('tasks')
        .update({ is_done: !done, updated_at: new Date() })
        .eq('id', id)

      setTasks(tasks.map(t => (t.id === id ? { ...t, is_done: !done } : t)))
    } catch (err) {
      console.error(err)
    }
  }

  // 🔹 Delete task
  async function deleteTask(id) {
    try {
      await supabase.from('tasks').delete().eq('id', id)
      setTasks(tasks.filter(t => t.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="container"><p>Loading tasks...</p></div>
  if (error) return <div className="container"><p className="error-text">{error}</p></div>

  return (
    <div className="tasks-container">
      <h2>Tasks</h2>

      <div className="card new-task-card">
        <input
          className="task-input"
          placeholder="Task title"
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
          <button className="btn" onClick={createTask}>Create</button>
        </div>
      </div>

      <div className="card task-list-card">
        {tasks.length === 0 && <p className="no-tasks">No tasks yet.</p>}

        {tasks.map(t => (
          <div key={t.id} className="task-item">
            <div className="task-details">
              <div className={`task-title ${t.is_done ? 'done' : ''}`}>{t.title}</div>
              <div className="task-notes-preview">{t.notes}</div>
            </div>
            <div className="task-buttons">
              <button className="btn secondary" onClick={() => toggleDone(t.id, t.is_done)}>
                {t.is_done ? 'Undo' : 'Done'}
              </button>
              <button className="btn secondary" onClick={() => deleteTask(t.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

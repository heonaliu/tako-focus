import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './css/Tasks.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faTrash, faEdit, faFilter, faCalendarAlt } from '@fortawesome/free-solid-svg-icons'

export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterDate, setFilterDate] = useState('')
  const [showOverview, setShowOverview] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  useEffect(() => {
    if (!user) return
    loadTasks()
  }, [user])

  async function loadTasks() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
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

  async function createTask() {
    if (!title.trim()) return
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title,
          notes,
          due_date: date
        })
        .select()

      if (error) throw error

      setTasks([data[0], ...tasks])
      setTitle('')
      setNotes('')
      setDate(new Date().toISOString().split('T')[0])
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  async function updateTask(task) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: task.title,
        notes: task.notes,
        due_date: task.due_date?.split('T')[0] // <-- normalize date
      })
      .eq('id', task.id)
      .select()

    if (error) throw error

    setTasks(tasks.map(t => (t.id === task.id ? data[0] : t)))
    setEditingTask(null)
  } catch (err) {
    console.error(err)
    alert('Failed to update task: ' + err.message)
  }
}


  async function toggleDone(id, done) {
    try {
      await supabase.from('tasks').update({ is_done: !done }).eq('id', id)
      setTasks(tasks.map(t => (t.id === id ? { ...t, is_done: !done } : t)))
    } catch (err) {
      console.error(err)
    }
  }

  async function deleteTask(id) {
    try {
      await supabase.from('tasks').delete().eq('id', id)
      setTasks(tasks.filter(t => t.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const filteredTasks = filterDate
    ? tasks.filter(t => t.due_date?.split('T')[0] === filterDate)
    : tasks

  const weeks = {}
  filteredTasks.forEach(task => {
    const taskDate = new Date(task.due_date)
    const sunday = new Date(taskDate)
    sunday.setDate(taskDate.getDate() - taskDate.getDay())
    const saturday = new Date(sunday)
    saturday.setDate(sunday.getDate() + 6)
    const key = `${sunday.toLocaleDateString()} - ${saturday.toLocaleDateString()}`
    if (!weeks[key]) weeks[key] = []
    weeks[key].push(task)
  })

  if (loading) return <div className="container"><p>Loading tasks...</p></div>
  if (error) return <div className="container"><p className="error-text">{error}</p></div>

  const renderTask = t => (
    <div key={t.id} className="task-item">
      {editingTask?.id === t.id ? (
        <>
          <input
            className="task-input"
            value={editingTask.title}
            onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
          />
          <textarea
            className="task-notes"
            value={editingTask.notes}
            onChange={e => setEditingTask({ ...editingTask, notes: e.target.value })}
          />
          <input
  type="date"
  className="task-date"
  value={editingTask.due_date?.split('T')[0] || ''}
  onChange={e => setEditingTask({ ...editingTask, due_date: e.target.value })}
/>

          <button type="button" className="icon-btn" onClick={() => updateTask(editingTask)}>
            <FontAwesomeIcon icon={faCheck} title="Save" />
          </button>
          <button type="button" className="icon-btn" onClick={() => setEditingTask(null)}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <div className="task-details">
            <div className={`task-title ${t.is_done ? 'done' : ''}`}>{t.title}</div>
            <div className="task-notes-preview">{t.notes}</div>
            <div className="task-date-preview">{t.due_date?.split('T')[0]}</div>
          </div>
          <div className="task-buttons">
            <button className="icon-btn" onClick={() => toggleDone(t.id, t.is_done)}>
              <FontAwesomeIcon icon={faCheck} title="Done" />
            </button>
            <button className="icon-btn" onClick={() => setEditingTask({ ...t })}>
              <FontAwesomeIcon icon={faEdit} title="Edit" />
            </button>
            <button className="icon-btn" onClick={() => deleteTask(t.id)}>
              <FontAwesomeIcon icon={faTrash} title="Delete" />
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="tasks-container">
      <h2>
        Tasks
        <button type="button" className="icon-btn" onClick={() => setFilterDate('')}>
          <FontAwesomeIcon icon={faCalendarAlt} title="Filter by date" />
        </button>
        <button type="button" className="icon-btn" onClick={() => setShowOverview(!showOverview)}>
          <FontAwesomeIcon icon={faFilter} title="Overview" />
        </button>
      </h2>

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
        <input
          type="date"
          className="task-date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <div className="task-actions">
          <button type="button" className="btn" onClick={createTask}>Create</button>
        </div>
      </div>

      {showOverview ? (
        Object.keys(weeks).map(week => (
          <div key={week} className="week-group">
            <h3>{week}</h3>
            {weeks[week].map(renderTask)}
          </div>
        ))
      ) : (
        filteredTasks.map(renderTask)
      )}
    </div>
  )
}

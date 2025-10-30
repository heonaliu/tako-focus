import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './css/Dashboard.css'
import takoProud from '../assets/tako_proud.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'

export default function Dashboard({ user }) {
  const [sessions, setSessions] = useState([])
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [focusGoal, setFocusGoal] = useState('')
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [streakCount, setStreakCount] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [newTask, setNewTask] = useState(null)

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
        .select('*')
        .single()

      if (taskError) throw taskError

      const subs = mockSteps.map(s => ({
        user_id: user.id,
        task_id: taskData.id,
        title: s,
      }))

      const { data: subData, error: subError } = await supabase
        .from('subtasks')
        .insert(subs)
        .select('*')

      if (subError) throw subError

      setNewTask({
        id: taskData?.id || Date.now(),
        title: focusGoal,
        subtasks: subData?.map(s => s.title) || mockSteps,
      })

      setModalOpen(true)
      setFocusGoal('')
    } catch (err) {
      console.error('Error generating plan:', err)
      setNewTask({
        id: Date.now(),
        title: focusGoal,
        subtasks: [
          'Step 1: Brainstorm',
          'Step 2: Outline your process',
          'Step 3: Execute for 25 min',
        ],
      })
      setModalOpen(true)
    } finally {
      setLoadingPlan(false)
    }
  }

  function handleSubtaskChange(index, value) {
    setNewTask(prev => {
      const updated = { ...prev }
      updated.subtasks[index] = value
      return updated
    })
  }

  function addSubtask() {
    // Adds a completely blank subtask
    setNewTask(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, ''],
    }))
  }

  function removeSubtask(index) {
    setNewTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index),
    }))
  }

  function saveSubtasks() {
    console.log('Saved subtasks:', newTask)
    setModalOpen(false)
  }

  function startFocusSession() {
    window.location.href = '/focus'
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
          onChange={e => setFocusGoal(e.target.value)}
        />
        <button
          className="btn generate-btn"
          onClick={generatePlan}
          disabled={loadingPlan}
        >
          {loadingPlan ? 'Generating...' : 'Generate Plan'}
        </button>
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
          <div className="card streak-card">
            <img src={takoProud} alt="Tako Proud" className="streak-mascot" />
            <h3>Your Focus Streak</h3>
            <p className="streak-count">
              {streakCount} day{streakCount !== 1 ? 's' : ''}
            </p>
            <p className="streak-text">Keep the momentum going 🔥</p>
          </div>
        </div>
      </div>

      {/* ✅ Modal */}
      {modalOpen && newTask && (
        <div className="modal-overlay">
          <div className="modal-card fade-in">
            <h3>🧠 New Task Created</h3>
            <h4 className="modal-task-title">{newTask.title}</h4>
            <div className="modal-subtasks">
              {newTask.subtasks.map((sub, i) => (
                <div className="modal-subtask-row" key={i}>
                  <input
                    value={sub}
                    placeholder="New subtask..."
                    onChange={e => handleSubtaskChange(i, e.target.value)}
                    className="modal-subtask-input"
                  />
                  <button
                    className="trash-btn"
                    onClick={() => removeSubtask(i)}
                    aria-label="Delete subtask"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
            </div>
            <button className="btn add-subtask-btn" onClick={addSubtask}>
              + Add Subtask
            </button>
            <div className="modal-actions">
              <button className="btn save-btn" onClick={saveSubtasks}>
                Save Changes
              </button>
              <button className="btn start-btn" onClick={startFocusSession}>
                Start Focus Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

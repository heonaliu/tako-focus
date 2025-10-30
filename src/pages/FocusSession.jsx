import React, { useState, useEffect, useCallback } from 'react'
import Timer from '../components/Timer'
import { supabase } from '../supabaseClient'
import './css/FocusSession.css'

function FullscreenFocus({
  studyDuration,
  breakDuration,
  isBreak,
  cycleCount,
  mode,
  todayTasks,
  subtasks,
  onExit,
  onComplete,
  toggleTaskDone,
  toggleSubtaskDone
}) {
  return (
    <div className="fullscreen-session">
      <div className="timer-fullscreen-card">
        <Timer
          key={`${isBreak ? 'break' : 'study'}-${cycleCount}-${mode}`}
          initialMinutes={isBreak ? breakDuration : studyDuration}
          onComplete={onComplete}
          mode={isBreak ? 'break' : 'study'}
          autoStart={true}
        />
        <button className="exit-btn" onClick={onExit}>
          ✕ Exit
        </button>
      </div>

      <div className="floating-task-card">
        <h4>Today's Tasks</h4>
        {todayTasks.length > 0 ? (
          todayTasks.map(task => (
            <div key={task.id} className="task-mini">
              <label>
                <input
                  type="checkbox"
                  checked={task.is_done}
                  onChange={() => toggleTaskDone(task.id, task.is_done)}
                />
                {task.title}
              </label>
              {task.notes && <p className="task-notes-mini">{task.notes}</p>}
              {subtasks[task.id]?.map(st => (
                <div key={st.id} className="subtask-mini">
                  <input
                    type="checkbox"
                    checked={st.is_done}
                    onChange={() => toggleSubtaskDone(st.id, st.is_done)}
                  />
                  {st.title}
                </div>
              ))}
            </div>
          ))
        ) : (
          <p>No tasks for today 🎉</p>
        )}
      </div>
    </div>
  )
}

export default function FocusSession({ user }) {
  const [mode, setMode] = useState('pomodoro')
  const [studyDuration, setStudyDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [cycleCount, setCycleCount] = useState(0)
  const [isBreak, setIsBreak] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [todayTasks, setTodayTasks] = useState([])
  const [subtasks, setSubtasks] = useState({})
  const [showConfirm, setShowConfirm] = useState(false)

  // Load today's tasks + subtasks
  const loadTodayTasks = useCallback(async () => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const { data: tasksData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('due_date', today)

    if (taskError) return console.error(taskError)

    const taskIds = tasksData.map(t => t.id)
    if (taskIds.length > 0) {
      const { data: subs, error: subError } = await supabase
        .from('subtasks')
        .select('*')
        .in('task_id', taskIds)

      if (!subError) {
        const grouped = subs.reduce((acc, s) => {
          acc[s.task_id] = acc[s.task_id] ? [...acc[s.task_id], s] : [s]
          return acc
        }, {})
        setSubtasks(grouped)
      }
    }

    setTodayTasks(tasksData)
  }, [user])

  useEffect(() => {
    loadTodayTasks()
  }, [loadTodayTasks])

  function onModeChange(m) {
    setMode(m)
    if (m === 'pomodoro') {
      setStudyDuration(25)
      setBreakDuration(5)
    } else if (m === '50-10') {
      setStudyDuration(50)
      setBreakDuration(10)
    } else if (m === '52-17') {
      setStudyDuration(52)
      setBreakDuration(17)
    }
  }

  async function handleComplete() {
    try {
      await supabase.from('sessions').insert({
        user_id: user.id,
        duration_minutes: isBreak ? breakDuration : studyDuration,
        type: isBreak ? 'break' : 'study'
      })
    } catch (err) {
      console.error(err)
    }

    // Cycle logic
    if (!isBreak) {
      const newCycle = cycleCount + 1
      setCycleCount(newCycle)
      setBreakDuration(newCycle % 4 === 0 ? 30 : mode === 'pomodoro' ? 5 : breakDuration)
    }
    setIsBreak(!isBreak)
  }

  async function toggleTaskDone(id, done) {
    await supabase.from('tasks').update({ is_done: !done }).eq('id', id)
    setTodayTasks(prev => prev.map(t => (t.id === id ? { ...t, is_done: !done } : t)))
  }

  async function toggleSubtaskDone(id, done) {
    await supabase.from('subtasks').update({ is_done: !done }).eq('id', id)
    setSubtasks(prev => {
      const updated = { ...prev }
      for (const tid in updated) {
        updated[tid] = updated[tid].map(st => (st.id === id ? { ...st, is_done: !done } : st))
      }
      return updated
    })
  }

  function startSession() {
    setShowConfirm(false)
    setIsSessionActive(true)
  }

  return (
    <div className={`focus-container ${isSessionActive ? 'fullscreen' : ''}`}>
      {isSessionActive ? (
        <FullscreenFocus
          studyDuration={studyDuration}
          breakDuration={breakDuration}
          isBreak={isBreak}
          cycleCount={cycleCount}
          mode={mode}
          todayTasks={todayTasks}
          subtasks={subtasks}
          onExit={() => setIsSessionActive(false)}
          onComplete={handleComplete}
          toggleTaskDone={toggleTaskDone}
          toggleSubtaskDone={toggleSubtaskDone}
        />
      ) : (
        <div className="focus-grid">
          <div className="focus-left">
            <h2>Focus Session</h2>
            <div className="card focus-card">
              <div className="mode-select">
                {['pomodoro', '50-10', '52-17', 'custom'].map(m => (
                  <button
                    key={m}
                    className={`btn ${mode === m ? '' : 'secondary'}`}
                    onClick={() => onModeChange(m)}
                  >
                    {m === 'pomodoro' ? 'Pomodoro (25/5)' : m === '50-10' ? '50 / 10' : m === '52-17' ? '52 / 17' : 'Custom'}
                  </button>
                ))}
              </div>

              {mode === 'custom' && (
                <div className="custom-inputs">
                  <label>
                    Study (min):
                    <input
                      type="number"
                      min="5"
                      value={studyDuration}
                      onChange={e => setStudyDuration(Math.max(5, parseInt(e.target.value) || 5))}
                    />
                  </label>
                  <label>
                    Break (min):
                    <input
                      type="number"
                      value={breakDuration}
                      onChange={e => setBreakDuration(parseInt(e.target.value) || 1)}
                    />
                  </label>
                </div>
              )}

              <Timer
                key={`${isBreak ? 'break' : 'study'}-${cycleCount}-${mode}`}
                initialMinutes={isBreak ? breakDuration : studyDuration}
                onComplete={handleComplete}
                mode={isBreak ? 'break' : 'study'}
              />
              <div className="session-controls">
                <button className="btn start-btn" onClick={() => setShowConfirm(true)}>
                  Start Session
                </button>
              </div>
            </div>
          </div>

          <div className="focus-right">
            <div className="card task-card">
              <h3>Today's Tasks</h3>
              {todayTasks.length > 0 ? (
                todayTasks.map(task => (
                  <div key={task.id} className="task-mini">
                    <label>
                      <input
                        type="checkbox"
                        checked={task.is_done}
                        onChange={() => toggleTaskDone(task.id, task.is_done)}
                      />
                      {task.title}
                    </label>
                    {task.notes && <p className="task-notes-mini">{task.notes}</p>}
                    {subtasks[task.id]?.map(st => (
                      <div key={st.id} className="subtask-mini">
                        <input
                          type="checkbox"
                          checked={st.is_done}
                          onChange={() => toggleSubtaskDone(st.id, st.is_done)}
                        />
                        {st.title}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p>No tasks for today 🎉</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Start Focus Session?</h3>
            <p>Entering focus mode will go fullscreen.</p>
            <div className="modal-actions">
              <button className="btn" onClick={startSession}>
                Yes, Start
              </button>
              <button className="btn secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

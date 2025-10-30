import React, { useState, useEffect, useCallback } from 'react'
import Timer from '../components/Timer'
import ExitButton from '../components/ExitButton'
import { supabase } from '../supabaseClient'
import './css/FocusSession.css'

export default function FocusSession({ user }) {
  const [mode, setMode] = useState('pomodoro')
  const [studyDuration, setStudyDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [cycleCount, setCycleCount] = useState(0)
  const [isBreak, setIsBreak] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [todayTasks, setTodayTasks] = useState([])
  const [subtasks, setSubtasks] = useState({})

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

    if (!isBreak) {
      const newCycle = cycleCount + 1
      setCycleCount(newCycle)
      if (newCycle % 4 === 0) {
        setBreakDuration(30)
      } else {
        setBreakDuration(mode === 'pomodoro' ? 5 : breakDuration)
      }
    }
    setIsBreak(!isBreak)
  }

  // Toggle task/subtask completion
  async function toggleTaskDone(id, done) {
    await supabase.from('tasks').update({ is_done: !done }).eq('id', id)
    setTodayTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, is_done: !done } : t))
    )
  }

  async function toggleSubtaskDone(id, done) {
    await supabase.from('subtasks').update({ is_done: !done }).eq('id', id)
    setSubtasks(prev => {
      const updated = { ...prev }
      for (const tid in updated) {
        updated[tid] = updated[tid].map(st =>
          st.id === id ? { ...st, is_done: !done } : st
        )
      }
      return updated
    })
  }

  return (
    <div className={`focus-container ${isSessionActive ? 'fullscreen' : ''}`}>
      {isSessionActive ? (
        <div className="fullscreen-session fade-in">
          <div className="timer-fullscreen-card">
            <Timer
              key={`${isBreak ? 'break' : 'study'}-${cycleCount}-${mode}`}
              initialMinutes={isBreak ? breakDuration : studyDuration}
              onComplete={handleComplete}
              mode={isBreak ? 'break' : 'study'}
              autoStart
            />
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
                  {task.notes && (
                    <p className="task-notes-mini">{task.notes}</p>
                  )}
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

          {/* 👇 Exit Button Integration */}
          <div className="exit-button-wrapper">
            <ExitButton onConfirmExit={() => setIsSessionActive(false)} />
          </div>
        </div>
      ) : (
        <div className="focus-grid">
          <div className="focus-left">
            <h2>Focus Session</h2>
            <div className="card focus-card">
              <div className="mode-select">
                <button
                  className={`btn ${mode === 'pomodoro' ? '' : 'secondary'}`}
                  onClick={() => onModeChange('pomodoro')}
                >
                  Pomodoro (25/5)
                </button>
                <button
                  className={`btn ${mode === '50-10' ? '' : 'secondary'}`}
                  onClick={() => onModeChange('50-10')}
                >
                  50 / 10
                </button>
                <button
                  className={`btn ${mode === '52-17' ? '' : 'secondary'}`}
                  onClick={() => onModeChange('52-17')}
                >
                  52 / 17
                </button>
                <button
                  className={`btn ${mode === 'custom' ? '' : 'secondary'}`}
                  onClick={() => setMode('custom')}
                >
                  Custom
                </button>
              </div>

              {mode === 'custom' && (
                <div className="custom-inputs">
                  <label>
                    Study (min):
                    <input
                      type="number"
                      min="5"
                      value={studyDuration}
                      onChange={e =>
                        setStudyDuration(
                          Math.max(5, parseInt(e.target.value) || 5)
                        )
                      }
                    />
                  </label>
                  <label>
                    Break (min):
                    <input
                      type="number"
                      value={breakDuration}
                      onChange={e =>
                        setBreakDuration(parseInt(e.target.value) || 1)
                      }
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
                <button
                  className="btn start-btn"
                  onClick={() => setIsSessionActive(true)}
                >
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
                    {task.notes && (
                      <p className="task-notes-mini">{task.notes}</p>
                    )}
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
    </div>
  )
}

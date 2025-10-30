import React, { useState, useEffect, useCallback, useRef } from 'react'
import Timer from '../components/Timer'
import ExitButton from '../components/ExitButton'
import { supabase } from '../supabaseClient'
import './css/FocusSession.css'
import FloatingMascot from '../components/FloatingMascot'
import confetti from 'canvas-confetti'
import takoProud from '../assets/tako_proud.png'

export default function FocusSession({ user }) {
  const [mode, setMode] = useState('pomodoro')
  const [studyDuration, setStudyDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [cycleCount, setCycleCount] = useState(0)
  const [isBreak, setIsBreak] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [todayTasks, setTodayTasks] = useState([])
  const [subtasks, setSubtasks] = useState({})
  const [showStartModal, setShowStartModal] = useState(false)
  const [showBreakModal, setShowBreakModal] = useState(false)
  const [sessionSummary, setSessionSummary] = useState(null)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [fadeOutBreak, setFadeOutBreak] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)

  const totalStudyTime = useRef(0)
    const completedBeforeSession = useRef(new Set()) // 🆕 track which tasks were already done before starting

  // 🧠 Load today's tasks and subtasks
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

      if (!subError && subs) {
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

  // 🧭 Mode change
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

  // ⏱️ Format duration nicely (e.g., 1 hr 15 min)
  function formatDuration(minutes) {
    const hrs = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hrs > 0 && mins > 0) return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min`
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`
    return `${mins} min${mins !== 1 ? 's' : ''}`
  }

  // 🕒 When a timer finishes
  async function handleComplete() {
    if (!user?.id) return
    const sessionType = isBreak ? 'break' : 'study'
    const duration = isBreak ? breakDuration : studyDuration

    if (!isBreak) totalStudyTime.current += duration

    try {
      await supabase.from('sessions').insert({
        user_id: user.id,
        duration_minutes: duration,
        type: sessionType,
        created_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('❌ Error saving session:', err)
    }

    if (!isBreak) {
      // Study done → short break modal
      setTimerPaused(true)
      setShowBreakModal(true)
      setFadeOutBreak(false)
      setTimeout(() => setFadeOutBreak(true), 8000)
      setTimeout(() => {
        setShowBreakModal(false)
        setIsBreak(true)
        setCycleCount(prev => prev + 1)
        setTimerPaused(false)
      }, 10000)
    } else {
      // Break done → back to study
      setIsBreak(false)
    }
  }

  // 🎯 End session manually
  function endSession() {
    console.log('📘 Ending session...')

    // 🎉 Confetti burst first
    const duration = 1000
    const end = Date.now() + duration
    const colors = ['#a78bfa', '#fbcfe8', '#c084fc']

    ;(function frame() {
      confetti({
        particleCount: 40,
        startVelocity: 25,
        spread: 70,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    })()

    // Wait for confetti → then exit fullscreen and show summary
    setTimeout(() => {
      setIsSessionActive(false)
      const newlyCompleted = todayTasks.filter(
        t => t.is_done && !completedBeforeSession.current.has(t.id)
        ).length

        setSessionSummary({
        totalStudyTime: totalStudyTime.current,
        completedTasks: newlyCompleted,
        })

      setShowSummaryModal(true)
    }, 1200)
  }

  // ✅ Task toggle helpers
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

  // ☕ Break Modal
  const BreakModal = () =>
    showBreakModal ? (
      <div className="break-modal-overlay">
        <div className={`break-modal-card ${fadeOutBreak ? 'fade-out' : ''}`}>
          <h3>☕ Break Starting!</h3>
          <img src="/images/tako_break.png" alt="Tako mascot" />
          <p>Take a short break! Session will resume shortly...</p>
        </div>
      </div>
    ) : null

  // 🎯 Session Summary Modal
  const SummaryModal = () =>
    showSummaryModal && sessionSummary ? (
      <div className="summary-overlay" onClick={() => setShowSummaryModal(false)}>
        <div className="summary-card" onClick={e => e.stopPropagation()}>
          <h3>🎯 Session Summary</h3>
          <img src={takoProud} alt="Tako mascot" className="tako-img" />
          <p>
            Total Study Time:{' '}
            <strong>{formatDuration(sessionSummary.totalStudyTime)}</strong>
          </p>
          <p>
            {sessionSummary.completedTasks > 0
              ? `✅ ${sessionSummary.completedTasks} tasks completed!`
              : 'No tasks marked complete this time.'}
          </p>
          <button
            className="btn close-btn"
            onClick={() => setShowSummaryModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    ) : null

  // 🎬 Component Layout
  return (
    <div className={`focus-container ${isSessionActive ? 'fullscreen' : ''}`}>
      {/* FULLSCREEN SESSION VIEW */}
      {isSessionActive ? (
        <div className="fullscreen-session fade-in">
          <div className="timer-fullscreen-card">
            <FloatingMascot mode={isBreak ? 'break' : 'study'} />
            {!timerPaused && (
              <Timer
                key={`${isBreak ? 'break' : 'study'}-${cycleCount}-${mode}`}
                initialMinutes={isBreak ? breakDuration : studyDuration}
                onComplete={handleComplete}
                mode={isBreak ? 'break' : 'study'}
                autoStart
              />
            )}
            <ExitButton onExit={endSession} />
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

          <BreakModal />
        </div>
      ) : (
        /* NORMAL DASHBOARD VIEW */
        <div className="focus-grid">
          <div className="focus-left">
            <h2>Focus Session</h2>
            <div className="card focus-card">
              <div className="mode-select">
                {['pomodoro', '50-10', '52-17', 'custom'].map(opt => (
                  <button
                    key={opt}
                    className={`btn ${mode === opt ? '' : 'secondary'}`}
                    onClick={() => onModeChange(opt)}
                  >
                    {opt === 'pomodoro' ? 'Pomodoro (25/5)' : opt.replace('-', ' / ')}
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
                      onChange={e =>
                        setStudyDuration(Math.max(1, parseInt(e.target.value) || 1))
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
                  onClick={() => setShowStartModal(true)}
                >
                  Start Session
                </button>
              </div>

              {/* Start Modal */}
              {showStartModal && (
                <div className="start-modal-overlay">
                  <div className="start-modal fade-in">
                    <h3>Start Focus Session?</h3>
                    <p>Are you ready to enter focus mode?</p>
                    <div className="modal-actions">
                      <button
                        className="btn confirm-btn"
                        onClick={() => {
                            setShowStartModal(false)
                            setIsSessionActive(true)

                            // 🧹 Reset previous session state
                            setSessionSummary(null)
                            setShowSummaryModal(false)
                            totalStudyTime.current = 0
                            setCycleCount(0)
                            setIsBreak(false)

                            // 🆕 Record which tasks were already completed before session started
                            completedBeforeSession.current = new Set(
                                todayTasks.filter(t => t.is_done).map(t => t.id)
                            )
                            }}
                        >
                        Yes, start
                        </button>

                      <button
                        className="btn secondary cancel-btn"
                        onClick={() => setShowStartModal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Task list panel */}
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

      {/* ✅ Keep Summary Modal always mounted */}
      <SummaryModal />
    </div>
  )
}

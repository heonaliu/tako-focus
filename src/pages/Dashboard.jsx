import React, { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './css/Dashboard.css'
import takoProud from '../assets/tako_proud.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'

//Images
import takoWave from "../assets/tako_wave.png";
import takoIdle from "../assets/tako_idle.png";
import takoFocus from "../assets/tako_focus.png";
import takoTired from "../assets/tako_tired.png";
import takoBreak from "../assets/tako_break.png";


export default function Dashboard({ user }) {
  const [sessions, setSessions] = useState([])
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [focusGoal, setFocusGoal] = useState('')
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [streakCount, setStreakCount] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [newTask, setNewTask] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false);
  const location = useLocation()
  const navigate = useNavigate()
  const [showWelcome, setShowWelcome] = useState(false);
  //const [hasShown, setHasShown] = useState(false);
    const takoImages = useMemo(
    () => [takoWave, takoIdle, takoFocus, takoTired, takoBreak],
    []
  );
  const [currentTako, setCurrentTako] = useState(
  takoImages[Math.floor(Math.random() * takoImages.length)]
);
const [fade, setFade] = useState(false);

useEffect(() => {
  const interval = setInterval(() => {
    setFade(true);
    setTimeout(() => {
      const nextTako =
        takoImages[Math.floor(Math.random() * takoImages.length)];
      setCurrentTako(nextTako);
      setFade(false);
    }, 1000); // fade duration
  }, 45000); // 🕒 switch every 45 seconds

  return () => clearInterval(interval);
}, [takoImages]);

  useEffect(() => {
  if (!user) return
  async function load() {
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('sessions')
      .select('id, user_id, task_id, duration_minutes, type, created_at, timer_label')
      .eq('user_id', user.id)
      .eq('type', 'study')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching sessions:', error)
      return
    }

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
}, [user, location.pathname])


useEffect(() => {
    if (window.location.hash.includes("access_token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // 🪄 Show banner once per login session, after user loads & URL stable
  useEffect(() => {
    // Wait until user is ready and we're on dashboard
    if (!user || location.pathname !== "/dashboard") return;

    // Delay slightly to ensure redirect finishes
    const timeout = setTimeout(() => {
      const hasSeen = sessionStorage.getItem("hasSeenWelcome");
      if (!hasSeen) {
        setShowWelcome(true);
        sessionStorage.setItem("hasSeenWelcome", "true");
      }
    }, 400); // short delay avoids race condition

    return () => clearTimeout(timeout);
  }, [user, location.pathname]);

  // Hide when navigating away
  useEffect(() => {
    if (showWelcome && location.pathname !== "/dashboard") {
      setShowWelcome(false);
    }
  }, [location.pathname, showWelcome]);
  // --- your existing helper functions remain unchanged below ---

  async function saveSubtasks() {
    if (!newTask) return;
    try {
      await supabase.from('subtasks').delete().eq('task_id', newTask.id);

      const cleanedSubs = newTask.subtasks
        .filter((t) => t.trim() !== '')
        .map((title) => ({
          user_id: user.id,
          task_id: newTask.id,
          title,
          is_done: false,
          created_at: new Date().toISOString(),
        }));

      if (cleanedSubs.length > 0) {
        const { error: subError } = await supabase.from('subtasks').insert(cleanedSubs);
        if (subError) throw subError;
      }

      console.log('✅ Subtasks saved for task:', newTask.title);

      // Show success animation before closing modal
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error('❌ Error saving subtasks:', err);
    }
  }

  async function generatePlan() {
    if (!focusGoal.trim() || !user) return;
    setLoadingPlan(true);

    try {
        // 👇 Call your Vercel serverless function
        const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: focusGoal }),
        });

        const data = await res.json();

        if (!res.ok || !data.subtasks) throw new Error(data.error || "No subtasks returned");

        // Save to Supabase like before
        const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .insert({
            user_id: user.id,
            title: focusGoal,
            due_date: new Date().toISOString().split("T")[0],
        })
        .select("*")
        .single();

        if (taskError) throw taskError;

        const subs = data.subtasks.map((s) => ({
        user_id: user.id,
        task_id: taskData.id,
        title: s,
        }));

        const { data: subData, error: subError } = await supabase
        .from("subtasks")
        .insert(subs)
        .select("*");

        if (subError) throw subError;

        setNewTask({
        id: taskData?.id || Date.now(),
        title: focusGoal,
        subtasks: subData?.map((s) => s.title) || data.subtasks,
        });

        setModalOpen(true);
        setFocusGoal("");
    } catch (err) {
        console.error("Error generating plan:", err);
        setNewTask({
        id: Date.now(),
        title: focusGoal,
        subtasks: [
            "Step 1: Define what success looks like",
            "Step 2: Gather what you need",
            "Step 3: Focus for one Pomodoro (25 min)",
        ],
        });
        setModalOpen(true);
    } finally {
        setLoadingPlan(false);
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

  function startFocusSession() {
    window.location.href = '/focus'
  }

  return (
    <div className="dashboard-container">
      {showWelcome && (
        <div className="welcome-banner">
          Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ""}!
        </div>
      )}
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
            <p className="total-minutes">{totalMinutes.toFixed(1)} minutes</p>
            <p className="session-count">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} completed today
            </p>
            <div className="tako-rotation-container">
            <img
                src={currentTako}
                alt="Tako mascot"
                className={`corner-tako ${fade ? "fade-out" : "fade-in"}`}
            />
            </div>
            </div>

            <div className="card recent-sessions-card">
            <h3>Recent Sessions</h3>
            <ul className="session-list">
                {sessions.slice(0, 6).map(s => (
                <li key={s.id} className="session-item">
                    <div className="session-row">
                    <div className="session-label">{s.timer_label || 'General focus'}</div>
                    <div className="session-duration">{s.duration_minutes?.toFixed(1)} min</div>
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
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains('modal-overlay')) setModalOpen(false);
          }}
        >
          <div className="modal-card fade-in">
            {showSuccess ? (
              <div className="success-animation">
                <img src={takoProud} alt="Tako Proud" className="success-tako" />
                <p className="success-text">Saved!</p>
              </div>
            ) : (
              <>
                <h3>New Task Created</h3>
                <h4 className="modal-task-title">{newTask.title}</h4>
                <div className="modal-subtasks">
                  {newTask.subtasks.map((sub, i) => (
                    <div className="modal-subtask-row" key={i}>
                      <input
                        value={sub}
                        placeholder="New subtask..."
                        onChange={(e) => handleSubtaskChange(i, e.target.value)}
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

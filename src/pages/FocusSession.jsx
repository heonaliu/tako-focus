import React, { useState, useEffect } from 'react';
import Timer from '../components/Timer';
import { supabase } from '../supabaseClient';
import './css/FocusSession.css';

export default function FocusSession({ user }) {
  const [mode, setMode] = useState('pomodoro');
  const [studyDuration, setStudyDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [cycleCount, setCycleCount] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customStudy, setCustomStudy] = useState(30);
  const [customBreak, setCustomBreak] = useState(10);

  // --- Handle mode switching ---
  function onModeChange(m) {
    setMode(m);
    setCycleCount(0);
    setIsBreak(false);

    if (m === 'pomodoro') {
      setStudyDuration(25);
      setBreakDuration(5);
    } else if (m === '50-10') {
      setStudyDuration(50);
      setBreakDuration(10);
    } else if (m === '52-17') {
      setStudyDuration(52);
      setBreakDuration(17);
    } else if (m === 'custom') {
      setStudyDuration(customStudy);
      setBreakDuration(customBreak);
    }
  }

  // --- Handle Timer completion ---
  async function handleComplete() {
    try {
      await supabase.from('sessions').insert({
        user_id: user.id,
        duration_minutes: isBreak ? breakDuration : studyDuration,
        is_break: isBreak,
        mode: mode,
      });

      if (!isBreak) {
        const newCycle = cycleCount + 1;
        setCycleCount(newCycle);

        if (mode === 'pomodoro' && newCycle % 4 === 0) {
          setIsBreak(true);
          setBreakDuration(30); // long break every 4 pomodoros
        } else {
          setIsBreak(true);
          setBreakDuration(mode === 'pomodoro' ? 5 : breakDuration);
        }
      } else {
        setIsBreak(false);
      }

      alert(isBreak ? 'Break over — back to focus! 💪' : 'Great work! Time for a break 🌿');
    } catch (err) {
      console.error('Error saving session:', err);
    }
  }

  // --- Load today's tasks ---
  async function loadTodayTasks() {
    setLoading(true);
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const { data, error: taskError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          is_done,
          notes,
          due_date,
          user_id,
          subtasks (
            id,
            title,
            is_done
          )
        `)
        .eq('user_id', user.id)
        .eq('due_date', todayStr)
        .order('is_done', { ascending: true });

      if (taskError) throw taskError;
      setTasks(data || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load today’s tasks.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadTodayTasks();
  }, [user]);

  async function toggleDone(id, done) {
    try {
      await supabase.from('tasks').update({ is_done: !done }).eq('id', id);
      setTasks(tasks.map(t => (t.id === id ? { ...t, is_done: !done } : t)));
    } catch (err) {
      console.error('Error updating task:', err);
    }
  }

  async function toggleSubtaskDone(subtaskId, done) {
    try {
      await supabase.from('subtasks').update({ is_done: !done }).eq('id', subtaskId);
      setTasks(prev =>
        prev.map(task => ({
          ...task,
          subtasks: task.subtasks?.map(st =>
            st.id === subtaskId ? { ...st, is_done: !done } : st
          ),
        }))
      );
    } catch (err) {
      console.error('Error updating subtask:', err);
    }
  }

  return (
    <div className="focus-container">
      <div className="focus-grid">
        {/* LEFT SIDE */}
        <div className="focus-left">
          <h2>Focus Session</h2>
          <div className="card focus-card">
            <div className="mode-select">
              <button
                className={`btn ${mode === 'pomodoro' ? '' : 'secondary'}`}
                onClick={() => onModeChange('pomodoro')}
              >
                Pomodoro 25 / 5
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
                onClick={() => onModeChange('custom')}
              >
                Custom
              </button>
            </div>

            {mode === 'custom' && (
              <div className="custom-inputs">
                <label>
                  Study (min):{' '}
                  <input
                    type="number"
                    value={customStudy}
                    min={5}
                    onChange={e =>
                      setCustomStudy(Math.max(5, Number(e.target.value)))
                    }
                  />
                </label>
                <label>
                  Break (min):{' '}
                  <input
                    type="number"
                    value={customBreak}
                    min={1}
                    onChange={e =>
                      setCustomBreak(Math.max(1, Number(e.target.value)))
                    }
                  />
                </label>
                <button className="btn small-btn" onClick={() => onModeChange('custom')}>
                  Set
                </button>
              </div>
            )}

            <Timer
              key={`${isBreak ? 'break' : 'study'}-${cycleCount}-${mode}`}
              initialMinutes={isBreak ? breakDuration : studyDuration}
              onComplete={handleComplete}
              className="timer-display"
            />
            <p className="timer-status">
              {isBreak ? 'Break Time 🌿' : 'Focus Time 🔥'} — Cycle {cycleCount % 4 || 1}
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="focus-right">
          <div className="card task-card">
            <h3>Today's Tasks</h3>
            {loading ? (
              <p>Loading tasks...</p>
            ) : error ? (
              <p className="error-text">{error}</p>
            ) : tasks.length === 0 ? (
              <p>No tasks for today 🎉</p>
            ) : (
              <div className="mini-task-list">
                {tasks.map(task => (
                  <div key={task.id} className="mini-task-item">
                    <label className="custom-checkbox">
                      <input
                        type="checkbox"
                        checked={task.is_done}
                        onChange={() => toggleDone(task.id, task.is_done)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <div className="mini-task-content">
                      <span className={`mini-task-title ${task.is_done ? 'done' : ''}`}>
                        {task.title}
                      </span>
                      {task.notes && <p className="mini-task-notes">{task.notes}</p>}

                      {task.subtasks?.length > 0 && (
                        <ul className="mini-subtask-list">
                          {task.subtasks.map(st => (
                            <li key={st.id} className="mini-subtask-item">
                              <label className="custom-checkbox small">
                                <input
                                  type="checkbox"
                                  checked={st.is_done}
                                  onChange={() => toggleSubtaskDone(st.id, st.is_done)}
                                />
                                <span className="checkmark"></span>
                              </label>
                              <span className={`mini-subtask-title ${st.is_done ? 'done' : ''}`}>
                                {st.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Timer from '../components/Timer';
import { supabase } from '../supabaseClient';
import './css/FocusSession.css';

export default function FocusSession({ user }) {
  const [mode, setMode] = useState('pomodoro');
  const [duration, setDuration] = useState(25);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function onModeChange(m) {
    setMode(m);
    if (m === 'pomodoro') setDuration(25);
    if (m === '50-10') setDuration(50);
  }

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

  async function handleComplete() {
    try {
      await supabase.from('sessions').insert({
        user_id: user.id,
        duration_minutes: duration,
      });
      alert('Session saved! Great work 🌟');
    } catch (err) {
      console.error(err);
      alert('Failed to save session.');
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
                Pomodoro (25/5)
              </button>
              <button
                className={`btn ${mode === '50-10' ? '' : 'secondary'}`}
                onClick={() => onModeChange('50-10')}
              >
                50 / 10
              </button>
              <select
                className="duration-select"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={45}>45</option>
                <option value={50}>50</option>
              </select>
            </div>

            <Timer
              initialMinutes={duration}
              onComplete={handleComplete}
              className="timer-display"
            />
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

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import './css/Tasks.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTrash, faEdit, faCalendarAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function Tasks({ user }) {

      // 🕒 Utility to strip time & timezone (fixes date comparisons)
function toLocalDate(dateInput) {
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getLocalISODate() {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return local.toISOString().split('T')[0];
}
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(getLocalISODate);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOverview, setShowOverview] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterMode, setFilterMode] = useState('today');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;

      const tasksWithDates = (data || []).map(task => {
        const [year, month, day] = task.due_date.split('-').map(Number);
        return { ...task, due: new Date(year, month - 1, day) };
      });

      setTasks(tasksWithDates);
    } catch (err) {
      console.error(err.message);
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    loadTasks();
  }, [user, loadTasks]);

  async function createTask() {
    if (!title.trim()) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title,
          notes,
          due_date: date,
        })
        .select();
      if (error) throw error;

      const [year, month, day] = data[0].due_date.split('-').map(Number);
      const newTask = { ...data[0], due: new Date(year, month - 1, day) };
      setTasks([newTask, ...tasks]);
      setTitle('');
      setNotes('');
      setDate(getLocalISODate);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  async function updateTask(task) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          notes: task.notes,
          due_date: task.due_date,
        })
        .eq('id', task.id)
        .select();
      if (error) throw error;

      const [year, month, day] = data[0].due_date.split('-').map(Number);
      const updatedTask = { ...data[0], due: new Date(year, month - 1, day) };
      setTasks(tasks.map(t => (t.id === task.id ? updatedTask : t)));
      setEditingTask(null);
    } catch (err) {
      console.error('Failed to update task:', err.message);
      alert('Failed to update task: ' + err.message);
    }
  }

  async function toggleDone(id, done) {
    try {
      await supabase.from('tasks').update({ is_done: !done }).eq('id', id);
      setTasks(tasks.map(task => (task.id === id ? { ...task, is_done: !done } : task)));
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteTask(id) {
    try {
      await supabase.from('tasks').delete().eq('id', id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      console.error(err);
    }
  }




function isSameLocalDate(d1, d2) {
  return toLocalDate(d1).getTime() === toLocalDate(d2).getTime();
}


  const today = toLocalDate(new Date());

  // --- Group all tasks into weeks ---
  const weeks = {};
  tasks.forEach(task => {
    const taskDate = task.due;
    const sunday = new Date(taskDate);
    sunday.setDate(taskDate.getDate() - taskDate.getDay());
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    const weekKey = `${sunday.toISOString().split('T')[0]}_${saturday.toISOString().split('T')[0]}`;
    const displayKey = `${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${saturday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    if (!weeks[weekKey]) weeks[weekKey] = { displayKey, tasks: [] };
    weeks[weekKey].tasks.push(task);
  });

  const sortedWeekKeys = Object.keys(weeks).sort((a, b) => {
    const startA = new Date(a.split('_')[0]);
    const endA = new Date(a.split('_')[1]);
    const startB = new Date(b.split('_')[0]);
    const endB = new Date(b.split('_')[1]);
    const aIsCurrent = startA <= today && today <= endA;
    const bIsCurrent = startB <= today && today <= endB;
    if (aIsCurrent) return -1;
    if (bIsCurrent) return 1;
    return startA - startB;
  });

  sortedWeekKeys.forEach(weekKey => {
    weeks[weekKey].tasks.sort((a, b) => a.due - b.due);
  });

  const activeTasks = (() => {
    if (selectedDate) {
      return tasks.filter(task => isSameLocalDate(task.due, selectedDate)).sort((a, b) => a.due - b.due);
    }
    if (showOverview) {
      return [...tasks].sort((a, b) => a.due - b.due);
    }
    return tasks
    
      .filter(task => {
        const taskDate = toLocalDate(task.due);
        const isToday = isSameLocalDate(taskDate, today);
        if (filterMode === 'today') return isToday;
        if (filterMode === 'week') {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return taskDate >= weekStart && taskDate <= weekEnd;
        }
        if (filterMode === 'all') return true;
        if (filterMode === 'before') return taskDate < today;
        if (filterMode === 'after') return taskDate > today;
        return false;
      })
      .sort((a, b) => a.due - b.due);
  })();

  const completedTasks = activeTasks.filter(task => task.is_done);
  const incompleteTasks = activeTasks.filter(task => !task.is_done);

  const weekTasksByDay = {};
  if (filterMode === 'week' && !selectedDate) {
    activeTasks.forEach(task => {
      const key = task.due.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (!weekTasksByDay[key]) weekTasksByDay[key] = [];
      weekTasksByDay[key].push(task);
    });
  }

  if (loading) return <div className="container"><p>Loading tasks...</p></div>;
  if (error) return <div className="container"><p className="error-text">{error}</p></div>;

  // --- RENDER ---
  return (
    <div className="tasks-container">
      <h2 className="tasks-header">
        <span className="calendar-icon" onClick={() => setShowCalendarModal(true)}>
          <FontAwesomeIcon icon={faCalendarAlt} />
        </span>
        Tasks
      </h2>

      <div className="filter-bar">
        {['today', 'week', 'all', 'before', 'after'].map(mode => (
          <button
            key={mode}
            onClick={() => {
              setSelectedDate(null);
              setFilterMode(mode);
              setShowOverview(mode === 'all');
            }}
            className={`filter-option ${selectedDate ? '' : (filterMode === mode ? 'active' : '')}`}
          >
            {mode === 'today' && 'Today'}
            {mode === 'week' && 'This Week'}
            {mode === 'all' && 'All Tasks'}
            {mode === 'before' && 'Before Today'}
            {mode === 'after' && 'After Today'}
          </button>
        ))}
      </div>

      {showCalendarModal && (
        <div className="calendar-modal-overlay">
          <div className="calendar-modal">
            <button className="close-btn" onClick={() => setShowCalendarModal(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <Calendar
              onChange={date => {
                setSelectedDate(date);
                setShowCalendarModal(false);
                setFilterMode('');
                setShowOverview(false);
              }}
              value={selectedDate || new Date()}
            />
          </div>
        </div>
      )}

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
          <button type="button" className="btn" onClick={createTask}>
            Create
          </button>
        </div>
      </div>

      {filterMode === 'week' && !selectedDate ? (
        Object.keys(weekTasksByDay).map(day => (
          <div key={day} className="day-group">
            <h3 className="day-header">{day}</h3>
            {weekTasksByDay[day].map(task => (
              <TaskItem
                key={task.id}
                task={task}
                editingTask={editingTask}
                setEditingTask={setEditingTask}
                updateTask={updateTask}
                toggleDone={toggleDone}
                deleteTask={deleteTask}
              />
            ))}
          </div>
        ))
      ) : filterMode === 'all' ? (
        // --- All Tasks stays the same ---
        sortedWeekKeys.map(weekKey => {
          const { displayKey, tasks: weekTasks } = weeks[weekKey];
          const incomplete = weekTasks.filter(t => !t.is_done);
          const complete = weekTasks.filter(t => t.is_done);
          return (
            <div key={weekKey} className="week-group">
              <h3 className="week-header">{displayKey}</h3>
              {incomplete.length > 0 ? (
                incomplete.map(task => (
                  <TaskItem key={task.id} task={task} editingTask={editingTask} setEditingTask={setEditingTask} updateTask={updateTask} toggleDone={toggleDone} deleteTask={deleteTask} />
                ))
              ) : (
                <p className="no-tasks">No pending tasks</p>
              )}
              {complete.length > 0 && (
                <div className="completed-section">
                  <h4>Completed</h4>
                  {complete.map(task => (
                    <TaskItem key={task.id} task={task} editingTask={editingTask} setEditingTask={setEditingTask} updateTask={updateTask} toggleDone={toggleDone} deleteTask={deleteTask} />
                  ))}
                </div>
              )}
            </div>
          );
        })
      ) : filterMode === 'before' || filterMode === 'after' ? (
        // --- Group before/after today by week ---
        (() => {
          const filteredWeeks = Object.keys(weeks).filter(key => {
            const start = new Date(key.split('_')[0]);
            const end = new Date(key.split('_')[1]);
            return filterMode === 'before' ? end < today : start > today;
          });

          filteredWeeks.sort((a, b) => {
            const startA = new Date(a.split('_')[0]);
            const startB = new Date(b.split('_')[0]);
            return filterMode === 'before' ? startB - startA : startA - startB;
          });

          return filteredWeeks.map(weekKey => {
            const { displayKey, tasks: weekTasks } = weeks[weekKey];
            const incomplete = weekTasks.filter(t => !t.is_done);
            const complete = weekTasks.filter(t => t.is_done);
            return (
              <div key={weekKey} className="week-group">
                <h3 className="week-header">{displayKey}</h3>
                {incomplete.length > 0 ? (
                  incomplete.map(task => (
                    <TaskItem key={task.id} task={task} editingTask={editingTask} setEditingTask={setEditingTask} updateTask={updateTask} toggleDone={toggleDone} deleteTask={deleteTask} />
                  ))
                ) : (
                  <p className="no-tasks">No pending tasks</p>
                )}
                {complete.length > 0 && (
                  <div className="completed-section">
                    <h4>Completed</h4>
                    {complete.map(task => (
                      <TaskItem key={task.id} task={task} editingTask={editingTask} setEditingTask={setEditingTask} updateTask={updateTask} toggleDone={toggleDone} deleteTask={deleteTask} />
                    ))}
                  </div>
                )}
              </div>
            );
          });
        })()
      ) : (
        <>
          {incompleteTasks.length > 0 ? (
            incompleteTasks.map(task => (
              <TaskItem key={task.id} task={task} editingTask={editingTask} setEditingTask={setEditingTask} updateTask={updateTask} toggleDone={toggleDone} deleteTask={deleteTask} />
            ))
          ) : (
            <p className="no-tasks">No tasks found 🎉</p>
          )}
          {completedTasks.length > 0 && (
            <div className="completed-section">
              <h3>Completed</h3>
              {completedTasks.map(task => (
                <TaskItem key={task.id} task={task} editingTask={editingTask} setEditingTask={setEditingTask} updateTask={updateTask} toggleDone={toggleDone} deleteTask={deleteTask} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---- TaskItem ----
function TaskItem({ task, editingTask, setEditingTask, updateTask, toggleDone, deleteTask }) {
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    const loadSubtasks = async () => {
      setLoadingSubs(true);
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });
      if (!error) setSubtasks(data);
      setLoadingSubs(false);
    };
    loadSubtasks();
  }, [task.id]);

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    const { data, error } = await supabase
      .from('subtasks')
      .insert({
        task_id: task.id,
        title: newSubtaskTitle,
      })
      .select();
    if (!error && data.length) {
      setSubtasks([...subtasks, data[0]]);
      setNewSubtaskTitle('');
    }
  };

  const toggleSubtaskDone = async (id, done) => {
    await supabase.from('subtasks').update({ is_done: !done }).eq('id', id);
    setSubtasks(subtasks.map(st => (st.id === id ? { ...st, is_done: !done } : st)));
  };

  const deleteSubtask = async (id) => {
    await supabase.from('subtasks').delete().eq('id', id);
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const updateSubtaskTitle = async (id, newTitle) => {
    const { error } = await supabase
      .from('subtasks')
      .update({ title: newTitle })
      .eq('id', id);
    if (!error) {
      setSubtasks(subtasks.map(st => (st.id === id ? { ...st, title: newTitle } : st)));
    }
  };

  const isEditing = editingTask?.id === task.id;

  return (
    <div className="task-item card">
      {isEditing ? (
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
            value={editingTask.due_date}
            onChange={e =>
              setEditingTask({
                ...editingTask,
                due_date: e.target.value,
                due: new Date(e.target.value),
              })
            }
          />

          {/* Subtasks Editing Section */}
          <div className="subtasks-container editing">
            {loadingSubs ? (
              <div className="subtask-loading">Loading subtasks...</div>
            ) : subtasks.length > 0 && (
              <>
                <h4>Subtasks</h4>
                {subtasks.map(st => (
                  <div key={st.id} className="subtask-item edit-mode">
                    <input
                      type="checkbox"
                      checked={st.is_done}
                      onChange={() => toggleSubtaskDone(st.id, st.is_done)}
                    />
                    <input
                      type="text"
                      className="subtask-edit-input"
                      value={st.title}
                      onChange={e => updateSubtaskTitle(st.id, e.target.value)}
                    />
                    <button className="icon-btn small" onClick={() => deleteSubtask(st.id)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </>
            )}

            <div className="add-subtask">
              <input
                type="text"
                placeholder="New subtask..."
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
              />
              <button className="btn small-btn" onClick={addSubtask}>
                Add
              </button>
            </div>
          </div>

          <div className="task-buttons">
            <button type="button" className="icon-btn" onClick={() => updateTask(editingTask)}>
              <FontAwesomeIcon icon={faCheck} title="Save" />
            </button>
            <button type="button" className="icon-btn" onClick={() => setEditingTask(null)}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="task-details">
            <div className={`task-title ${task.is_done ? 'done' : ''}`}>{task.title}</div>
            <div className="task-notes-preview">{task.notes}</div>
            <div className="task-date-preview">
              {task.due.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div className="subtasks-container">
              {loadingSubs ? (
                <div className="subtask-loading">Loading subtasks...</div>
              ) : (
                subtasks.map(st => (
                  <div key={st.id} className="subtask-item">
                    <input
                      type="checkbox"
                      checked={st.is_done}
                      onChange={() => toggleSubtaskDone(st.id, st.is_done)}
                    />
                    <span className={st.is_done ? 'done' : ''}>{st.title}</span>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="task-buttons">
            <button type="button" className="icon-btn" onClick={() => toggleDone(task.id, task.is_done)}>
              <FontAwesomeIcon icon={faCheck} title="Done" />
            </button>
            <button type="button" className="icon-btn" onClick={() => setEditingTask({ ...task })}>
              <FontAwesomeIcon icon={faEdit} title="Edit" />
            </button>
            <button type="button" className="icon-btn" onClick={() => deleteTask(task.id)}>
              <FontAwesomeIcon icon={faTrash} title="Delete" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './css/Tasks.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTrash, faEdit, faFilter, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default today
  const [showOverview, setShowOverview] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadTasks();
  }, [user]);

  async function loadTasks() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error(err.message);
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }

  async function createTask() {
    if (!title.trim()) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title,
          notes,
          due_date: date
        })
        .select();
      if (error) throw error;

      setTasks([data[0], ...tasks]);
      setTitle('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
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
          due_date: task.due_date
        })
        .eq('id', task.id)
        .select();
      if (error) throw error;

      setTasks(tasks.map(t => (t.id === task.id ? data[0] : t)));
      setEditingTask(null);
    } catch (err) {
      console.error('Failed to update task:', err.message);
      alert('Failed to update task: ' + err.message);
    }
  }

  async function toggleDone(id, done) {
    try {
      await supabase.from('tasks').update({ is_done: !done }).eq('id', id);
      setTasks(tasks.map(t => (t.id === id ? { ...t, is_done: !done } : t)));
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteTask(id) {
    try {
      await supabase.from('tasks').delete().eq('id', id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  // Filter tasks by today unless overview mode
  const filteredTasks = showOverview ? tasks : tasks.filter(t => t.due_date === filterDate);


  // Group tasks by week (Sunday-Saturday)
// Group tasks by week (Sunday-Saturday) with year included
const weeks = {};
filteredTasks.forEach(task => {
  const taskDate = new Date(task.due_date);

  // Get Sunday of the week
  const sunday = new Date(taskDate);
  sunday.setDate(taskDate.getDate() - taskDate.getDay());

  // Get Saturday of the week
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  // Format as "Nov 24, 2025 - Nov 30, 2025"
  const key = `${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${saturday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  if (!weeks[key]) weeks[key] = [];
  weeks[key].push(task);
});

// Sort weeks by the Sunday date (most recent first)
const sortedWeekKeys = Object.keys(weeks).sort((a, b) => {
  const parseSunday = str => {
    // Take the first date in the string range, e.g., "Oct 26, 2025 - Nov 1, 2025"
    return new Date(str.split(' - ')[0]);
  };
  return parseSunday(b) - parseSunday(a); // descending
});


// Sort tasks inside each week by due_date ascending
sortedWeekKeys.forEach(week => {
  weeks[week].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
});


  if (loading) return <div className="container"><p>Loading tasks...</p></div>;
  if (error) return <div className="container"><p className="error-text">{error}</p></div>;

  return (
    <div className="tasks-container">
      <h2 className="tasks-header">
        Tasks
        <button
          type="button"
          className="icon-btn"
          onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}
          title="Today"
        >
          <FontAwesomeIcon icon={faCalendarAlt} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setShowOverview(!showOverview)}
          title="Overview"
        >
          <FontAwesomeIcon icon={faFilter} />
        </button>
      </h2>

      {/* New Task Card */}
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

      {/* Tasks List */}
      {showOverview ? (
  sortedWeekKeys.map(week => (
    <div key={week} className="week-group">
      <h3>{week}</h3>
      {weeks[week].map(task => (
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
) : (
  filteredTasks.map(task => (
    <TaskItem
      key={task.id}
      task={task}
      editingTask={editingTask}
      setEditingTask={setEditingTask}
      updateTask={updateTask}
      toggleDone={toggleDone}
      deleteTask={deleteTask}
    />
  ))
)}

    </div>
  );
}

// TaskItem component
function TaskItem({ task, editingTask, setEditingTask, updateTask, toggleDone, deleteTask }) {
  const isEditing = editingTask?.id === task.id;

  return (
    <div className="task-item">
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
            onChange={e => setEditingTask({ ...editingTask, due_date: e.target.value })}
          />
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
              {new Date(task.due_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
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

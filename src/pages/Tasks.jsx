import React, { useEffect, useState, useCallback } from 'react';
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
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [showOverview, setShowOverview] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;

      const tasksWithDates = (data || []).map(task => ({
        ...task,
        due: new Date(task.due_date)
      }));

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
          due_date: date
        })
        .select();
      if (error) throw error;

      const newTask = { ...data[0], due: new Date(data[0].due_date) };
      setTasks([newTask, ...tasks]);
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

      const updatedTask = { ...data[0], due: new Date(data[0].due_date) };
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

  // --- Overview: group tasks by week ---
  const weeks = {};
  tasks.forEach(task => {
    const taskDate = task.due;
    const sunday = new Date(taskDate);
    sunday.setDate(taskDate.getDate() - taskDate.getDay());
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    const weekKey = `${sunday.toISOString().split('T')[0]}_${saturday.toISOString().split('T')[0]}`;
    const displayKey = `${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${saturday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    if (!weeks[weekKey]) weeks[weekKey] = { displayKey, tasks: [] };
    weeks[weekKey].tasks.push(task);
  });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

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

  // --- Filtering logic ---
  const activeTasks = showOverview
    ? [...tasks].sort((a, b) => a.due - b.due)
    : tasks
        .filter(
          task =>
            !task.is_done && task.due.toISOString().split('T')[0] === todayStr
        )
        .sort((a, b) => a.due - b.due);

  const completedTasks = !showOverview
    ? tasks
        .filter(task => task.is_done)
        .sort((a, b) => b.due - a.due)
    : [];

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
        >
          <FontAwesomeIcon icon={faCalendarAlt} title="Today" />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setShowOverview(!showOverview)}
        >
          <FontAwesomeIcon icon={faFilter} title="Overview" />
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
          <button type="button" className="btn" onClick={createTask}>
            Create
          </button>
        </div>
      </div>

      {/* Task List */}
      {showOverview ? (
        sortedWeekKeys.map(weekKey => (
          <div key={weekKey} className="week-group">
            <h3
              className={(function () {
                const start = new Date(weekKey.split('_')[0]);
                const end = new Date(weekKey.split('_')[1]);
                return start <= today && today <= end ? 'current-week' : '';
              })()}
            >
              {weeks[weekKey].displayKey}
            </h3>
            {weeks[weekKey].tasks.map(task => (
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
        <>
          {activeTasks.length > 0 ? (
            activeTasks.map(task => (
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
          ) : (
            <p className="no-tasks">No tasks for today 🎉</p>
          )}

          {completedTasks.length > 0 && (
            <div className="completed-section">
              <h3>Completed</h3>
              {completedTasks.map(task => (
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
          )}
        </>
      )}
    </div>
  );
}

// TaskItem Card
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

  const isEditing = editingTask?.id === task.id;

  return (
    <div className={`task-item card ${task.is_done ? 'done-task' : ''}`}>
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
          <button type="button" className="btn small-btn" onClick={addSubtask}>
            + Add Subtask
          </button>
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

          <div className="subtasks-container">
            {loadingSubs ? (
              <div className="subtask-loading">Loading subtasks...</div>
            ) : subtasks.length === 0 ? (
              <div className="subtask-empty">No subtasks</div>
            ) : (
              subtasks.map(st => (
                <div key={st.id} className="subtask-item">
                  <input
                    type="checkbox"
                    checked={st.is_done}
                    onChange={() => toggleSubtaskDone(st.id, st.is_done)}
                  />
                  <span className={st.is_done ? 'done' : ''}>{st.title}</span>
                  <button className="icon-btn small" onClick={() => deleteSubtask(st.id)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))
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

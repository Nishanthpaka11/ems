import React, { useEffect, useState, useMemo } from 'react';
import { authFetch } from '../utils/authFetch';
import './TaskSection.css';

const API_BASE = process.env.REACT_APP_API_URL;

const StatCard = ({ value, label, tone = 'primary', index = 0 }) => (
  <div
    className={`stat-card tone-${tone} animate-fade-up`}
    style={{ animationDelay: `${index * 90}ms` }}
  >
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const StatusPill = ({ status }) => {
  const map = {
    Pending: 'pending',
    'In Progress': 'inprogress',
    Completed: 'completed',
  };

  return (
    <span
      className={`status-pill ${map[status] || 'pending'} animate-pulse-once`}
    >
      {status}
    </span>
  );
};

const TaskSection = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    project: '',
    title: '',
    description: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      if (!res.ok) throw new Error('Failed to add task');

      const addedTask = await res.json();
      setTasks((prev) => [addedTask, ...prev]);
      setNewTask({ project: '', title: '', description: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await authFetch(`${API_BASE}/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      const updatedTask = await res.json();
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updatedTask : t)));
    } catch (err) {
      console.error(err);
    }
  };

  // ---------- STATS ----------
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const pending = tasks.filter((t) => t.status === 'Pending').length;

  // ---------- FILTER + SEARCH ----------
  const filteredRows = useMemo(() => {
    return tasks.filter((t) => {
      const text = `${t.project || ''} ${t.title || ''} ${
        t.description || ''
      }`.toLowerCase();

      const matchesSearch = text.includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'All' ? true : t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  // ---------- EXPORT (CSV) ----------
  const handleExport = () => {
    if (!filteredRows.length) {
      alert('No tasks to export.');
      return;
    }

    const header = [
      'Project',
      'Title',
      'Description',
      'Status',
      'Start',
      'End',
    ];

    const rows = filteredRows.map((t) => [
      t.project || '',
      t.title || '',
      t.description || '',
      t.status || '',
      t.start_date
        ? new Date(t.start_date).toLocaleString()
        : '',
      t.end_date ? new Date(t.end_date).toLocaleString() : '',
    ]);

    const csvContent =
      [header, ...rows]
        .map((row) =>
          row
            .map((cell) =>
              `"${String(cell).replace(/"/g, '""')}"`
            )
            .join(',')
        )
        .join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'tasks-export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="main animate-page-in">
      {/* ---------- TOP BAR ---------- */}
      <header className="topbar">
        <h2 className="page-title">My Tasks</h2>
        <div className="search-actions">
          <div className="search">
            <span className="icon">🔎</span>
            <input
              placeholder="Search tasks"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* ---------- STATS ---------- */}
      <section className="stats-row">
        <StatCard value={total} label="Total Tasks" tone="primary" index={0} />
        <StatCard
          value={inProgress}
          label="In Progress"
          tone="info"
          index={1}
        />
        <StatCard value={pending} label="Pending" tone="warning" index={2} />
        <StatCard
          value={completed}
          label="Completed"
          tone="success"
          index={3}
        />
      </section>

      {/* ---------- CREATE TASK ---------- */}
      <section className="panel animate-rise">
        <div className="panel-header">
          <h3>Create task</h3>
        </div>
        <form onSubmit={handleAddTask} className="task-form premium">
          <div className="grid-3">
            <div className="field">
              <label>Project</label>
              <input
                type="text"
                value={newTask.project}
                onChange={(e) =>
                  setNewTask({ ...newTask, project: e.target.value })
                }
                placeholder="e.g., Drone FC App"
                required
              />
            </div>
            <div className="field">
              <label>Task Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                placeholder="Implement status API"
                required
              />
            </div>
            <div className="field">
              <label>Description</label>
              <input
                type="text"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                placeholder="Add PUT /status and validations"
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="primary-btn tap">
              Add Task
            </button>
          </div>
        </form>
      </section>

      {/* ---------- TASK TABLE ---------- */}
      <section className="panel animate-rise" style={{ animationDelay: '80ms' }}>
        <div className="panel-header">
          <h3>Tasks</h3>
          <div className="toolbar">
            <button
              type="button"
              className="ghost-btn tap"
              onClick={() => setShowFilters((v) => !v)}
            >
              Filters
            </button>
            <button
              type="button"
              className="ghost-btn tap"
              onClick={handleExport}
            >
              Export
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="filter-bar">
            <div className="field small">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table className="task-table premium">
            <thead>
              <tr>
                <th>Project</th>
                <th>Task</th>
                <th>Description</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr className="animate-fade-in">
                  <td colSpan="6" className="empty">
                    No tasks match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((task, i) => (
                  <tr
                    key={task._id}
                    className={`row-animate ${
                      task.status === 'Completed' ? 'completed-row' : ''
                    }`}
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    <td>
                      <div className="cell-title">
                        <span className="dot" />
                        {task.project}
                      </div>
                    </td>
                    <td className="strong">{task.title}</td>
                    <td className="muted">{task.description}</td>
                    <td>
                      {task.status === 'Completed' ? (
                        <StatusPill status="Completed" />
                      ) : (
                        <div className="status-editor">
                          <StatusPill status={task.status} />
                          <select
                            className="status-select"
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task._id, e.target.value)
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      )}
                    </td>
                    <td>
                      {task.start_date
                        ? new Date(task.start_date).toLocaleString()
                        : '-'}
                    </td>
                    <td>
                      {task.end_date
                        ? new Date(task.end_date).toLocaleString()
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="table-footer">
          <div className="rows">Rows per page: 6</div>
          <div className="pager">
            <button className="ghost-btn tap">{'<'}</button>
            <span className="page">
              1–6 of {Math.max(filteredRows.length, 6)}
            </span>
            <button className="ghost-btn tap">{'>'}</button>
          </div>
        </footer>
      </section>
    </main>
  );
};

export default TaskSection;

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '../utils/authFetch';
import './TaskOverviewSection.css';

const API_BASE = process.env.REACT_APP_API_URL;

/* Badge helper */
const badgeClass = (str) => {
  if (!str) return 'badge';
  const s = str.toLowerCase();
  if (s === 'pending') return 'badge pending';
  if (s === 'completed') return 'badge completed';
  if (s === 'overdue') return 'badge overdue';
  if (s === 'in progress') return 'badge progress';
  if (s === 'low') return 'badge badge-low';
  if (s === 'medium') return 'badge badge-medium';
  if (s === 'high') return 'badge badge-high';
  return 'badge';
};

const AdminTaskOverview = () => {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dueSort, setDueSort] = useState('');

  /* Fetch all tasks */
  const fetchTasks = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/tasks/all`);
      const data = await res.json();

      const formatted = data.map(task => ({
        ...task,
        employee_name: task.employee_ref?.name || 'Unknown',
        employee_id: task.employee_ref?.employee_id || task.employee_id,
        avatar_url: task.employee_ref?.photo || '',
        position: task.employee_ref?.position || ''
      }));

      setTasks(formatted);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /* Delete task (Admin only) */
  const handleDeleteTask = async (taskId) => {
    const ok = window.confirm('Are you sure you want to delete this task?');
    if (!ok) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        alert('Failed to delete task');
        return;
      }

      fetchTasks(); // refresh list
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Error deleting task');
    }
  };

  /* Summary counts */
  const total = tasks.length;
  const completed = tasks.filter(t => t.status?.toLowerCase() === 'completed').length;
  const pending = tasks.filter(t => t.status?.toLowerCase() === 'pending').length;

  /* Filters + sorting */
  const filteredTasks = tasks
    .filter(task =>
      (search === '' ||
        task.title?.toLowerCase().includes(search.toLowerCase()) ||
        task.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
        task.employee_id?.toLowerCase().includes(search.toLowerCase())
      ) &&
      (statusFilter === '' || task.status?.toLowerCase() === statusFilter.toLowerCase()) &&
      (priorityFilter === '' || task.priority?.toLowerCase() === priorityFilter.toLowerCase())
    )
    .sort((a, b) => {
      if (!dueSort) return 0;
      const aDate = a.end_date ? new Date(a.end_date) : 0;
      const bDate = b.end_date ? new Date(b.end_date) : 0;
      return dueSort === 'asc' ? aDate - bDate : bDate - aDate;
    });

  /* Employees list from tasks */
  const employees = Array.from(
    tasks.reduce((map, t) => {
      map.set(t.employee_id, {
        employee_id: t.employee_id,
        name: t.employee_name,
        avatar_url: t.avatar_url,
        position: t.position,
      });
      return map;
    }, new Map()).values()
  );

  const employeeProgress = (empId) => {
    const total = tasks.filter(t => t.employee_id === empId).length;
    const done = tasks.filter(t => t.employee_id === empId && t.status?.toLowerCase() === 'completed').length;
    return total ? Math.round((done / total) * 100) : 0;
  };

  return (
    <div className="admin-tasks-dashboard">

      {/* Header */}
      <div className="task-header">
        <h2>Task Overview</h2>
      </div>

      {/* Summary cards */}
      <div className="task-summary-cards">
        <div className="summary-card">
          <div>Total Tasks</div>
          <b>{total}</b>
        </div>
        <div className="summary-card pending-card">
          <div>Pending</div>
          <b>{pending}</b>
        </div>
        <div className="summary-card completed-card">
          <div>Completed</div>
          <b>{completed}</b>
        </div>
      </div>

      <div className="task-main-content">

        {/* Task table */}
        <div className="task-table-section">

          <div className="table-filters">
            <input
              className="search"
              placeholder="Search task or employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>

            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="">Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <select value={dueSort} onChange={e => setDueSort(e.target.value)}>
              <option value="">Due Date</option>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          <div className="responsive-task-table">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr key={task._id}>
                      <td>{task.title}</td>

                      <td>
                        {task.avatar_url ? (
                          <img src={task.avatar_url} className="avatar-sm" alt="" />
                        ) : (
                          <span className="avatar-sm-placeholder">
                            {task.employee_name[0]}
                          </span>
                        )}{' '}
                        {task.employee_name}
                      </td>

                      <td>
                        <span className={badgeClass(task.priority)}>
                          {task.priority}
                        </span>
                      </td>

                      <td>
                        {task.end_date
                          ? new Date(task.end_date).toLocaleDateString('en-IN')
                          : '-'}
                      </td>

                      <td>
                        <span className={badgeClass(task.status)}>
                          {task.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="btn-delete-task"
                          onClick={() => handleDeleteTask(task._id)}
                          title="Delete Task"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employee sidebar */}
        <div className="task-employee-list">
          <h4>Employees</h4>
          {employees.map(emp => (
            <div key={emp.employee_id} className="employee-card">
              <div className="emp-info">
                {emp.avatar_url ? (
                  <img src={emp.avatar_url} className="avatar" alt="" />
                ) : (
                  <div className="avatar avatar-placeholder">{emp.name[0]}</div>
                )}
                <div>
                  <b>{emp.name}</b>
                  <div className="emp-role">{emp.position || 'Employee'}</div>
                </div>
              </div>

              <div className="emp-progress-bar">
                <div
                  className="emp-progress"
                  style={{ width: employeeProgress(emp.employee_id) + '%' }}
                />
              </div>
              <div className="emp-progress-label">
                {employeeProgress(emp.employee_id)}%
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdminTaskOverview;

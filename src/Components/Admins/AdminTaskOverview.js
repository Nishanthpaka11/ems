import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '../utils/authFetch';
import './TaskOverviewSection.css';

const API_BASE = process.env.REACT_APP_API_URL;

const badgeClass = (str) => {
  if (!str) return '';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    project: '',
    description: '',
    priority: 'Medium',
    end_date: '',
    assign_to: '',
  });
  const [employees, setEmployees] = useState([]);
  const [modalMessage, setModalMessage] = useState('');

  // FETCH TASKS
  const fetchTasks = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/tasks/all`);
      const data = await res.json();
      const formattedData = data.map(task => ({
        ...task,
        employee_name: task.employee_ref?.name || 'Unknown',
        employee_id: task.employee_ref?.employee_id || task.employee_id,
        avatar_url: task.employee_ref?.photo || '',
        position: task.employee_ref?.position || ''
      }));
      setTasks(formattedData);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  }, []);

  // FETCH ALL EMPLOYEES DIRECTLY
  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/addemployee/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(
          data.map(emp => ({
            user_id: emp._id,
            employee_id: emp.employee_id,
            name: emp.name,
            avatar_url: emp.photo || '',
            position: emp.position || ''
          }))
        );
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Counts for summary cards
  const total = tasks.length;
  const completed = tasks.filter(t => t.status?.trim().toLowerCase() === 'completed').length;
  const pending = tasks.filter(t => t.status?.trim().toLowerCase() === 'pending').length;

  // Filtering/sorting
  const filteredTasks = tasks
    .filter(task =>
      (search === '' ||
        (task.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (task.employee_id || '').toLowerCase().includes(search.toLowerCase()) ||
        (task.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (task.status || '').toLowerCase().includes(search.toLowerCase())
      ) &&
      (statusFilter === '' || (task.status && task.status.toLowerCase() === statusFilter.toLowerCase())) &&
      (priorityFilter === '' || (task.priority && task.priority.toLowerCase() === priorityFilter.toLowerCase()))
    )
    .sort((a, b) => {
      if(!dueSort) return 0;
      const aDate = a.end_date ? new Date(a.end_date) : 0;
      const bDate = b.end_date ? new Date(b.end_date) : 0;
      return dueSort === 'asc' ? aDate - bDate : bDate - aDate;
    });

  // Priority/Status badge
  const showPriority = (prio) => (
    <span className={badgeClass(prio)}>{prio}</span>
  );
  const showStatus = (status) => (
    <span className={badgeClass(status)}>{status}</span>
  );

  // Employee progress - using employees from tasks only
  const tableEmployees = Array.from(
    tasks.reduce((m, t) => {
      m.set(t.employee_id, {
        employee_id: t.employee_id,
        name: t.employee_name,
        avatar_url: t.avatar_url,
        position: t.position || ''
      });
      return m;
    }, new Map()).values()
  );

  const employeeProgress = (empId) => {
    const total = tasks.filter(t => t.employee_id === empId).length;
    const done = tasks.filter(t => t.employee_id === empId && t.status?.toLowerCase() === 'completed').length;
    if (!total) return 0;
    return Math.round((done / total) * 100);
  };

  // --- Create Task Modal Logic ---
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setModalMessage('');
    if (!createForm.title || !createForm.assign_to) {
      setModalMessage('Please enter title and assign to an employee.');
      return;
    }
    try {
      // Find the assigned employee's doc
      const assignee = employees.find(emp => emp.user_id === createForm.assign_to);
      if (!assignee) throw new Error('Employee assignment error.');

      // Only send employee_id (not user_id or _id) to backend
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/tasks/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee_id: assignee.employee_id,
          project: createForm.project,
          title: createForm.title,
          description: createForm.description,
          end_date: createForm.end_date ? new Date(createForm.end_date) : undefined,
          priority: createForm.priority,
        })
      });
      if (!res.ok) {
        setModalMessage('Failed to create task');
        return;
      }
      setModalMessage('Task created!');
      setShowCreateModal(false);
      setCreateForm({ title: '', project: '', description: '', priority: 'Medium', end_date: '', assign_to: '' });
      fetchTasks();
    } catch (err) {
      setModalMessage('Error: ' + err.message);
    }
  };

  return (
    <div className="admin-tasks-dashboard">
      <div className="task-header">
        <h2>Tasks</h2>
        <button className="btn-primary-newtask" onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-plus"></i> New Task
        </button>
      </div>
      <div className="task-summary-cards">
        <div className="summary-card"><div>Total Tasks</div><b>{total}</b></div>
        <div className="summary-card pending-card"><div>Pending Tasks</div><b>{pending}</b></div>
        <div className="summary-card completed-card"><div>Completed Task</div><b>{completed}</b></div>
      </div>
      <div className="task-main-content">
        <div className="task-table-section">
          <div className="table-filters">
            <input
              type="text"
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
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{textAlign:'center'}}>No tasks found.</td>
                  </tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr key={task._id}>
                      <td>
                        <i className={`bi bi-${task.priority?.toLowerCase()==='high'?'exclamation-circle':'check2-square'}`}></i>
                        {' '}{task.title}
                      </td>
                      <td>
                        {task.avatar_url ? (
                          <img src={task.avatar_url} className="avatar-sm" alt={task.employee_name} />
                        ) : (
                          <span className="avatar-sm-placeholder">{task.employee_name[0]}</span>
                        )}{' '}
                        {task.employee_name}
                      </td>
                      <td>{showPriority(task.priority)}</td>
                      <td>{task.end_date ? new Date(task.end_date).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'2-digit' }) : '-'}</td>
                      <td>{showStatus(task.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* EMPLOYEE LIST SIDEBAR (only those with tasks) */}
        <div className="task-employee-list">
          <h4>Employees</h4>
          {tableEmployees.map(emp => (
            <div key={emp.employee_id} className="employee-card">
              <div className="emp-info">
                {emp.avatar_url ? (
                  <img src={emp.avatar_url} className="avatar" alt={emp.name}/>
                ) : (
                  <div className="avatar avatar-placeholder">{emp.name[0]}</div>
                )}
                <div>
                  <b>{emp.name}</b>
                  <div className="emp-role">{emp.position || 'Employee'}</div>
                </div>
              </div>
              <div className="emp-progress-bar">
                <div className="emp-progress" style={{width: employeeProgress(emp.employee_id)+'%'}}></div>
              </div>
              <div className="emp-progress-label">{employeeProgress(emp.employee_id)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* New Task Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{marginBottom:16}}>Create New Task</h3>
            <form onSubmit={handleCreateTask}>
              <input
                type="text"
                value={createForm.title}
                placeholder="Task Title"
                onChange={e => setCreateForm({...createForm, title: e.target.value})}
                required
              />
              <input
                type="text"
                value={createForm.project}
                placeholder="Project"
                onChange={e => setCreateForm({...createForm, project: e.target.value})}
              />
              <textarea
                value={createForm.description}
                placeholder="Description"
                rows={2}
                onChange={e => setCreateForm({...createForm, description: e.target.value})}
              />
              <select
                value={createForm.priority}
                onChange={e => setCreateForm({...createForm, priority: e.target.value})}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <input
                type="date"
                value={createForm.end_date}
                onChange={e => setCreateForm({...createForm, end_date: e.target.value})}
                placeholder="Due Date"
              />
              <select
                value={createForm.assign_to}
                onChange={e => setCreateForm({...createForm, assign_to: e.target.value})}
                required
              >
                <option value="">Assign To</option>
                {employees.map(emp => (
                  <option key={emp.user_id} value={emp.user_id}>
                    {emp.name} ({emp.employee_id})
                  </option>
                ))}
              </select>
              {modalMessage && <div style={{color:'red',margin:"6px 0"}}>{modalMessage}</div>}
              <div style={{display:'flex', gap:12, marginTop:14}}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{flex:1}}>Cancel</button>
                <button type="submit" className="btn-primary-newtask" style={{flex:2}}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminTaskOverview;

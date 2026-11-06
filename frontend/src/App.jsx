import { useState, useEffect, useCallback } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';

const API = '/api/tasks';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | active | done

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      setTasks(await res.json());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async ({ title, description }) => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) throw new Error('Failed to add task');
    const newTask = await res.json();
    setTasks((prev) => [newTask, ...prev]);
  };

  const toggleTask = async (id) => {
    const res = await fetch(`${API}/${id}`, { method: 'PATCH' });
    if (!res.ok) return;
    const updated = await res.json();
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
  };

  const deleteTask = async (id) => {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.completed).length,
    active: tasks.filter((t) => !t.completed).length,
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">TaskFlow</span>
          </div>
          <p className="header-sub">Stay organised. Get things done.</p>
        </div>
      </header>

      <main className="main">
        {/* ── Stats ── */}
        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-num">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card accent-active">
            <span className="stat-num">{stats.active}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-card accent-done">
            <span className="stat-num">{stats.done}</span>
            <span className="stat-label">Done</span>
          </div>
        </div>

        {/* ── Add Task Form ── */}
        <TaskForm onAdd={addTask} />

        {/* ── Filter Tabs ── */}
        <div className="filter-tabs" role="tablist">
          {['all', 'active', 'done'].map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={`tab-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
              id={`tab-${f}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Task List ── */}
        {error && <div className="error-banner">⚠️ {error}</div>}
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <TaskList tasks={filtered} onToggle={toggleTask} onDelete={deleteTask} />
        )}
      </main>

      <footer className="footer">
        <p>TaskFlow · Fullstack Demo · Docker + K8s + Jenkins + Grafana</p>
      </footer>
    </div>
  );
}

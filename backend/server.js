require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const client = require('prom-client');

const Task = require('./models/Task');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/taskflow';

// ─── Prometheus Metrics ────────────────────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1],
  registers: [register],
});

const tasksCreatedCounter = new client.Counter({
  name: 'tasks_created_total',
  help: 'Total tasks created',
  registers: [register],
});

const tasksCompletedCounter = new client.Counter({
  name: 'tasks_completed_total',
  help: 'Total tasks marked complete',
  registers: [register],
});

const tasksDeletedCounter = new client.Counter({
  name: 'tasks_deleted_total',
  help: 'Total tasks deleted',
  registers: [register],
});

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Request timing middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, route: req.path });
  res.on('finish', () => {
    httpRequestCounter.inc({ method: req.method, route: req.path, status: res.statusCode });
    end();
  });
  next();
});

// ─── Prometheus Metrics Endpoint ────────────────────────────────────────────
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Task Routes ─────────────────────────────────────────────────────────────

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const task = await Task.create({ title, description });
    tasksCreatedCounter.inc();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH toggle complete
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.completed = !task.completed;
    await task.save();
    if (task.completed) tasksCompletedCounter.inc();
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    tasksDeletedCounter.inc();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Connect & Start ─────────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Vercel Serverless Entry Point
// Express app exported as a serverless handler (no app.listen)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const client = require('prom-client');

const Task = require('../backend/models/Task');

const app = express();

// ─── MongoDB Connection (cached for serverless) ──────────────────────────────
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) throw new Error('MONGO_URI environment variable is not set');
  await mongoose.connect(MONGO_URI);
  isConnected = true;
}

// ─── Prometheus Metrics ──────────────────────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const tasksCreatedCounter  = new client.Counter({ name: 'tasks_created_total',   help: 'Total tasks created',   registers: [register] });
const tasksCompletedCounter= new client.Counter({ name: 'tasks_completed_total', help: 'Tasks marked complete',  registers: [register] });
const tasksDeletedCounter  = new client.Counter({ name: 'tasks_deleted_total',   help: 'Total tasks deleted',   registers: [register] });

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Ensure DB is connected on every request
app.use(async (req, res, next) => {
  try { await connectDB(); next(); }
  catch (e) { res.status(500).json({ error: 'Database connection failed' }); }
});

// ─── Endpoints ───────────────────────────────────────────────────────────────
app.get('/health',  (req, res) => res.json({ status: 'ok' }));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/api/tasks', async (req, res) => {
  try { res.json(await Task.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const task = await Task.create({ title, description });
    tasksCreatedCounter.inc();
    res.status(201).json(task);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.completed = !task.completed;
    await task.save();
    if (task.completed) tasksCompletedCounter.inc();
    res.json(task);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    tasksDeletedCounter.inc();
    res.json({ message: 'Task deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Export for Vercel serverless
module.exports = app;

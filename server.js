/**
 * Express backend for File Allocation Methods Simulation app.
 * Serves static frontend assets and provides APIs to store simulation logs.
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/file_allocation_sim';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data model for storing simulation history/logs.
const simulationSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['Contiguous Allocation', 'Linked Allocation', 'Indexed Allocation'],
      required: true,
    },
    blocks: { type: Number, required: true, min: 1 },
    files: { type: Number, required: true, min: 1 },
    allocations: { type: [Number], default: [] },
  },
  { timestamps: true }
);

const Simulation = mongoose.model('Simulation', simulationSchema);

/**
 * Save a simulation run.
 */
app.post('/api/simulations', async (req, res) => {
  try {
    const { method, blocks, files, allocations } = req.body;
    const simulation = await Simulation.create({ method, blocks, files, allocations });
    return res.status(201).json(simulation);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/**
 * Fetch recent simulation logs.
 */
app.get('/api/simulations', async (req, res) => {
  try {
    const simulations = await Simulation.find().sort({ createdAt: -1 }).limit(20);
    return res.json(simulations);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Fallback route for SPA behavior.
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed. App will still run without DB persistence.');
    console.warn(error.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();

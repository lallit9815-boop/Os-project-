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

const estimateSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true, trim: true },
    scope: {
      type: String,
      enum: ['Small', 'Medium', 'Large'],
      required: true,
    },
    complexity: {
      type: String,
      enum: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
      required: true,
    },
    teamSize: { type: Number, min: 1, max: 30, required: true },
    featureCount: { type: Number, min: 1, max: 200, required: true },
    timelineWeeks: { type: Number, required: true },
    estimatedHours: { type: Number, required: true },
    estimatedCostUsd: { type: Number, required: true },
  },
  { timestamps: true }
);

const Estimate = mongoose.model('Estimate', estimateSchema);
const volatileEstimates = [];

const SCOPE_MULTIPLIER = {
  Small: 1,
  Medium: 1.35,
  Large: 1.8,
};

const COMPLEXITY_MULTIPLIER = {
  'O(1)': 0.9,
  'O(log n)': 1,
  'O(n)': 1.2,
  'O(n log n)': 1.45,
  'O(n²)': 1.8,
};

function calculateEstimate(scope, complexity, featureCount, teamSize) {
  const baseHoursPerFeature = 12;
  const rawHours =
    featureCount *
    baseHoursPerFeature *
    (SCOPE_MULTIPLIER[scope] || 1) *
    (COMPLEXITY_MULTIPLIER[complexity] || 1);

  const estimatedHours = Math.round(rawHours);
  const productivityHoursPerWeek = Math.max(1, teamSize) * 24;
  const timelineWeeks = Math.max(1, Math.ceil(estimatedHours / productivityHoursPerWeek));
  const estimatedCostUsd = Math.round(estimatedHours * 40);

  return { estimatedHours, timelineWeeks, estimatedCostUsd };
}

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

app.post('/api/estimates', async (req, res) => {
  try {
    const { projectName, scope, complexity, teamSize, featureCount } = req.body;
    const computed = calculateEstimate(scope, complexity, Number(featureCount), Number(teamSize));
    const payload = {
      projectName,
      scope,
      complexity,
      teamSize,
      featureCount,
      ...computed,
    };

    if (mongoose.connection.readyState !== 1) {
      const estimate = {
        _id: `temp-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      volatileEstimates.unshift(estimate);
      if (volatileEstimates.length > 10) volatileEstimates.pop();
      return res.status(201).json(estimate);
    }

    const estimate = await Estimate.create(payload);
    return res.status(201).json(estimate);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/estimates', async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(volatileEstimates);
    }

    const estimates = await Estimate.find().sort({ createdAt: -1 }).limit(10);
    return res.json(estimates);
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

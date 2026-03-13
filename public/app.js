const { useEffect, useMemo, useState } = React;

const NAV_ITEMS = ['Home', 'Simulation', 'Estimator', 'Theory', 'About'];

/** Generate allocation order based on selected method. */
function generateAllocations(method, blocks, files) {
  const needed = Math.min(blocks, files);

  if (method === 'Contiguous Allocation') {
    const start = Math.max(0, Math.floor((blocks - needed) / 2));
    return Array.from({ length: needed }, (_, i) => start + i);
  }

  if (method === 'Linked Allocation') {
    const indices = [];
    let current = 0;
    for (let i = 0; i < needed; i += 1) {
      indices.push(current);
      current = (current + 3) % blocks;
      while (indices.includes(current)) current = (current + 1) % blocks;
    }
    return indices;
  }

  // Indexed Allocation (first block is index, rest are scattered)
  const set = new Set([0]);
  let candidate = 2;
  while (set.size < needed) {
    set.add(candidate % blocks);
    candidate += 2;
  }
  return Array.from(set);
}



const COMPLEXITY_DETAILS = {
  'O(1)': 'Constant time: ideal for direct lookups and hash-based cache hits.',
  'O(log n)': 'Logarithmic: very scalable for sorted datasets and tree-based search.',
  'O(n)': 'Linear: common for single-pass processing through lists or records.',
  'O(n log n)': 'Near-linear: often appears in efficient sorting and divide-and-conquer workflows.',
  'O(n²)': 'Quadratic: acceptable only for small inputs; optimize for large-scale systems.',
};

function Navbar({ current, setCurrent }) {
  return (
    <nav className="glass navbar container">
      <div className="brand">🧠 OS File Allocation</div>
      <div className="nav-links">
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            className={`nav-btn ${current === item ? 'active' : ''}`}
            onClick={() => setCurrent(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </nav>
  );
}

function HomePage({ setCurrent }) {
  return (
    <section className="container hero glass">
      <div>
        <h1>File Allocation Methods Simulation in Operating System</h1>
        <p className="small">
          Explore how operating systems map file data to disk blocks using Contiguous,
          Linked, and Indexed allocation with an intuitive iOS-inspired visual simulator.
        </p>
        <button className="button primary" onClick={() => setCurrent('Simulation')}>
          Start Simulation
        </button>
      </div>
      <div className="glass" style={{ padding: '22px' }}>
        <h3>What you can do</h3>
        <ul>
          <li>Visualize memory block allocation in real-time.</li>
          <li>Follow step-by-step allocation progress.</li>
          <li>Compare methods and understand tradeoffs quickly.</li>
        </ul>
      </div>
    </section>
  );
}

function SimulationPage() {
  const [blocks, setBlocks] = useState(16);
  const [files, setFiles] = useState(8);
  const [method, setMethod] = useState('Contiguous Allocation');
  const [allocated, setAllocated] = useState([]);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const allocationPlan = useMemo(() => generateAllocations(method, blocks, files), [method, blocks, files]);

  useEffect(() => {
    if (!isRunning || step >= allocationPlan.length) return;
    const timer = setTimeout(() => {
      setAllocated((prev) => [...prev, allocationPlan[step]]);
      setStep((prev) => prev + 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [isRunning, step, allocationPlan]);

  useEffect(() => {
    if (step === allocationPlan.length && allocationPlan.length > 0) {
      setIsRunning(false);
      saveSimulation();
    }
  }, [step, allocationPlan.length]);

  async function saveSimulation() {
    try {
      await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, blocks, files, allocations: allocationPlan }),
      });
    } catch (_e) {
      // Graceful fail: visualization still works even without DB.
    }
  }

  function handleStart() {
    if (blocks < 1 || files < 1) {
      setError('Blocks and files must be positive numbers.');
      return;
    }
    if (files > blocks) {
      setError('Files cannot exceed blocks for this simulation setup.');
      return;
    }

    setError('');
    setAllocated([]);
    setStep(0);
    setIsRunning(true);
  }

  function reset() {
    setIsRunning(false);
    setAllocated([]);
    setStep(0);
    setError('');
  }

  const progress = allocationPlan.length ? (allocated.length / allocationPlan.length) * 100 : 0;

  return (
    <section className="container section-card glass">
      <h2>Simulation</h2>
      <div className="grid">
        <div>
          <label>Number of Blocks</label>
          <input type="number" min="1" value={blocks} onChange={(e) => setBlocks(Number(e.target.value))} />
        </div>
        <div>
          <label>Number of Files</label>
          <input type="number" min="1" value={files} onChange={(e) => setFiles(Number(e.target.value))} />
        </div>
      </div>

      <div style={{ marginTop: '14px' }}>
        <label>Allocation Method</label>
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option>Contiguous Allocation</option>
          <option>Linked Allocation</option>
          <option>Indexed Allocation</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        <button className="button primary" onClick={handleStart}>Start</button>
        <button className="button ghost" onClick={reset}>Reset</button>
      </div>

      <p className="small">Step: {step} / {allocationPlan.length}</p>
      <div className="progress"><div style={{ width: `${progress}%` }} /></div>
      {error && <p className="error">{error}</p>}

      <div className="memory-grid">
        {Array.from({ length: blocks }, (_, index) => (
          <div key={index} className={`block ${allocated.includes(index) ? 'allocated' : ''}`}>
            {index}
          </div>
        ))}
      </div>
    </section>
  );
}



function EstimatorPage() {
  const [projectName, setProjectName] = useState('OS Allocation Portal');
  const [scope, setScope] = useState('Medium');
  const [complexity, setComplexity] = useState('O(n log n)');
  const [teamSize, setTeamSize] = useState(4);
  const [featureCount, setFeatureCount] = useState(18);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch('/api/estimates');
      if (!res.ok) return;
      const data = await res.json();
      setHistory(data);
    } catch (_e) {
      // optional DB feature
    }
  }

  async function handleEstimate() {
    setError('');
    if (!projectName.trim()) {
      setError('Project name is required.');
      return;
    }

    if (teamSize < 1 || featureCount < 1) {
      setError('Team size and feature count must be positive.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, scope, complexity, teamSize, featureCount }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to estimate project.');
      setResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 10));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container section-card glass">
      <h2>Full-Stack Project Time Complexity & Estimate Tool</h2>
      <p className="small">
        Choose the expected algorithmic complexity and project scope to estimate delivery timeline,
        effort hours, and budget for a full-stack web application.
      </p>

      <div className="grid">
        <div>
          <label>Project Name</label>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        </div>
        <div>
          <label>Scope</label>
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </select>
        </div>
      </div>

      <div className="grid" style={{ marginTop: '12px' }}>
        <div>
          <label>Expected Complexity Class</label>
          <select value={complexity} onChange={(e) => setComplexity(e.target.value)}>
            <option>O(1)</option>
            <option>O(log n)</option>
            <option>O(n)</option>
            <option>O(n log n)</option>
            <option>O(n²)</option>
          </select>
          <p className="small" style={{ marginTop: '8px' }}>{COMPLEXITY_DETAILS[complexity]}</p>
        </div>
        <div>
          <label>Team Size</label>
          <input type="number" min="1" max="30" value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} />
        </div>
      </div>

      <div style={{ marginTop: '12px', maxWidth: '340px' }}>
        <label>Feature Count</label>
        <input type="number" min="1" max="200" value={featureCount} onChange={(e) => setFeatureCount(Number(e.target.value))} />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        <button className="button primary" onClick={handleEstimate} disabled={loading}>
          {loading ? 'Estimating...' : 'Generate Estimate'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <article className="glass" style={{ marginTop: '16px', padding: '16px' }}>
          <h3>Latest Estimate</h3>
          <p><strong>Timeline:</strong> {result.timelineWeeks} week(s)</p>
          <p><strong>Effort:</strong> {result.estimatedHours} engineering hour(s)</p>
          <p><strong>Budget:</strong> ${result.estimatedCostUsd.toLocaleString()} USD</p>
        </article>
      )}

      <article className="glass" style={{ marginTop: '16px', padding: '16px' }}>
        <h3>Recent Estimates</h3>
        {history.length === 0 ? (
          <p className="small">No saved estimates yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {history.map((item) => (
              <div key={item._id} className="small" style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,.55)' }}>
                <strong>{item.projectName}</strong> · {item.scope} · {item.complexity} · {item.timelineWeeks}w · ${item.estimatedCostUsd}
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

function TheoryPage() {
  return (
    <section className="container section-card glass">
      <h2>Theory</h2>
      <div className="grid">
        <article className="glass" style={{ padding: '16px' }}>
          <h3>Contiguous Allocation</h3>
          <p>Each file occupies consecutive blocks. Fast sequential/direct access, but causes external fragmentation.</p>
          <p><strong>Pros:</strong> Simple, high performance.</p>
          <p><strong>Cons:</strong> Difficult file growth, fragmentation risk.</p>
        </article>

        <article className="glass" style={{ padding: '16px' }}>
          <h3>Linked Allocation</h3>
          <p>File blocks are linked by pointers. No external fragmentation but random access is slower.</p>
          <p><strong>Pros:</strong> Easy growth, flexible placement.</p>
          <p><strong>Cons:</strong> Pointer overhead, reliability concerns.</p>
        </article>
      </div>

      <article className="glass" style={{ padding: '16px', marginTop: '16px' }}>
        <h3>Indexed Allocation</h3>
        <p>An index block stores pointers to all data blocks of a file.</p>
        <p><strong>Pros:</strong> Efficient random access, minimal external fragmentation.</p>
        <p><strong>Cons:</strong> Extra space for index block.</p>
      </article>

      <article className="glass" style={{ padding: '16px', marginTop: '16px' }}>
        <h3>Simple Diagram</h3>
        <pre className="small" style={{ whiteSpace: 'pre-wrap' }}>
Contiguous: [3][4][5][6]
Linked:     [1]→[8]→[2]→[10]
Indexed:    [Index: 0] => [4][9][12][6]
        </pre>
      </article>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="container section-card glass">
      <h2>About Project</h2>
      <p>This project demonstrates classic Operating System file allocation methods through interactive simulation.</p>
      <h3>Tools Used</h3>
      <ul>
        <li>Frontend: React, CSS (glassmorphism, iOS-inspired UI)</li>
        <li>Backend: Node.js + Express</li>
        <li>Database: MongoDB + Mongoose</li>
      </ul>
      <h3>Developer</h3>
      <p>Built as an educational full-stack simulation platform.</p>
    </section>
  );
}

function App() {
  const [current, setCurrent] = useState('Home');

  return (
    <>
      <Navbar current={current} setCurrent={setCurrent} />
      {current === 'Home' && <HomePage setCurrent={setCurrent} />}
      {current === 'Simulation' && <SimulationPage />}
      {current === 'Estimator' && <EstimatorPage />}
      {current === 'Theory' && <TheoryPage />}
      {current === 'About' && <AboutPage />}
      <footer>Made with ❤️ for Operating System learning.</footer>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

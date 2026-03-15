const { useEffect, useMemo, useState } = React;

const NAV_ITEMS = ['Home', 'Simulation', 'Theory', 'About'];

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
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');

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

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const response = await fetch('/api/simulations');
      if (!response.ok) throw new Error('Unable to fetch simulation history.');
      const data = await response.json();
      setHistory(data);
      setHistoryError('');
    } catch (_error) {
      setHistoryError('History unavailable (MongoDB may be offline).');
    }
  }

  async function saveSimulation() {
    try {
      await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, blocks, files, allocations: allocationPlan }),
      });
      fetchHistory();
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

      <div className="history-card glass">
        <div className="history-head">
          <h3>Recent Simulation Logs</h3>
          <button className="button ghost" onClick={fetchHistory}>Refresh</button>
        </div>
        {historyError && <p className="small error">{historyError}</p>}
        {!historyError && history.length === 0 && <p className="small">No saved simulations yet.</p>}
        {history.length > 0 && (
          <div className="history-list">
            {history.map((item) => (
              <article key={item._id} className="history-item">
                <p><strong>{item.method}</strong></p>
                <p className="small">Blocks: {item.blocks} | Files: {item.files}</p>
                <p className="small">Allocated: {item.allocations.join(', ') || 'None'}</p>
              </article>
            ))}
          </div>
        )}
      </div>
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
      {current === 'Theory' && <TheoryPage />}
      {current === 'About' && <AboutPage />}
      <footer>Made with ❤️ for Operating System learning.</footer>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [mission, setMission] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [history, setHistory] = useState([]);
  const [isLightMode, setIsLightMode] = useState(false);

  // Toggle Theme
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLightMode]);

  const handleGenerate = async () => {
    if (!mission) return;
    
    setLoading(true);
    setResult('');

    // Simulate Agent Workflow Delay
    setTimeout(() => {
      const draft = `[MULTI-AGENT PIPELINE COMPLETE]

--- RESEARCH PHASE ---
Matched Grant: Global Education Fund ($50,000)

--- DRAFTING PHASE ---
Proposal Draft:
We are thrilled to submit this proposal. Our mission: "${mission.substring(0, 50)}..." aligns perfectly with the fund's objective. 

If you need to contact us directly regarding the financials, you can reach out to our primary contact at [REDACTED_EMAIL] or call our office line at [REDACTED_PHONE]. 

--- SECURITY REVIEW PHASE ---
✅ PII scrubbed successfully.`;
      
      setResult(draft);
      setLoading(false);
      
      // Save to history
      const newEntry = {
        id: Date.now(),
        query: mission,
        draft: draft,
        timestamp: new Date().toLocaleTimeString()
      };
      setHistory(prev => [newEntry, ...prev]);
      setMission(''); // Clear input after successful run
      
    }, 2500);
  };

  const loadHistoryItem = (item) => {
    setMission(item.query);
    setResult(item.draft);
  };

  return (
    <div className="app-layout">
      {/* Sidebar for History */}
      <aside className="sidebar">
        <div className="header-top">
          <h3>History</h3>
          <button 
            className="theme-toggle" 
            onClick={() => setIsLightMode(!isLightMode)}
          >
            {isLightMode ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
        
        <div className="history-list">
          {history.length === 0 ? (
            <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No previous queries yet.</p>
          ) : (
            history.map(item => (
              <div 
                key={item.id} 
                className="history-item"
                onClick={() => loadHistoryItem(item)}
              >
                <p>{item.query}</p>
                <small>{item.timestamp}</small>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header>
          <h1>GrantMatch AI</h1>
          <h2>Empowering Non-Profits with Autonomous Agentic Proposals</h2>
        </header>

        <div className="workspace">
          <div className="panel">
            <div className="input-group">
              <label htmlFor="mission">Non-Profit Mission Statement</label>
              <textarea 
                id="mission"
                placeholder="E.g., We provide free after-school tutoring for underprivileged students in urban areas..."
                value={mission}
                onChange={(e) => setMission(e.target.value)}
              />
              <button 
                onClick={handleGenerate} 
                disabled={loading || mission.length < 5}
              >
                {loading ? 'Agents are working...' : 'Find Grants & Draft Proposal'}
              </button>
            </div>
          </div>

          <div className="panel">
            <label>Agent Output</label>
            <div style={{ marginTop: '1rem' }}>
              {loading ? (
                <div className="status-indicator">
                  <span className="loading-pulse"></span>
                  Coordinating Researcher, Writer, and Reviewer Agents...
                </div>
              ) : null}
              
              <div className="result-area">
                {result ? result : 'Awaiting mission statement to begin the search...'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

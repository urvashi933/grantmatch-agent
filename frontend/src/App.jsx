import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

function App() {
  const [theme, setTheme] = useState('dark')
  const [mission, setMission] = useState('We provide after-school educational coding activities and STEM support to low-income children in downtown areas.')
  const [grants, setGrants] = useState([])
  const [selectedGrant, setSelectedGrant] = useState(null)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(false)
  
  const [agentSteps, setAgentSteps] = useState([])
  const [finalProposal, setFinalProposal] = useState('')
  const [compliance, setCompliance] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleSearchGrants = async () => {
    if (!mission.trim()) return
    setLoadingMatches(true)
    setGrants([])
    setSelectedGrant(null)
    setFinalProposal('')
    setAgentSteps([])
    setCompliance(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission })
      })
      const data = await response.json()
      setGrants(data.matched_grants || [])
      if (data.matched_grants && data.matched_grants.length > 0) {
        setSelectedGrant(data.matched_grants[0])
      }
    } catch (error) {
      console.error("Error matching grants:", error)
    } finally {
      setLoadingMatches(false)
    }
  }

  const handleGenerateProposal = async () => {
    if (!selectedGrant) return
    setLoadingDraft(true)
    setAgentSteps([])
    setFinalProposal('')
    setCompliance(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission,
          selected_grant: selectedGrant
        })
      })
      const data = await response.json()
      
      // Simulate stepped timeline for visual effect
      if (data.steps) {
        for (let i = 0; i < data.steps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 800))
          setAgentSteps(prev => [...prev, data.steps[i]])
        }
      }
      
      setFinalProposal(data.final_proposal || '')
      setCompliance(data.compliance_checks || null)
    } catch (error) {
      console.error("Error generating proposal:", error)
    } finally {
      setLoadingDraft(false)
    }
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([finalProposal], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${selectedGrant.title.replace(/\s+/g, '_')}_proposal.md`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="app-container">
      <header>
        <div>
          <h1>GrantMatch & Draft Assistant</h1>
          <p className="subtitle">Secure, Multi-Agent proposal generator with automatic compliance & PII shielding.</p>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </header>

      <div className="grid-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Mission Input Section */}
          <div className="card">
            <h2>1. Organization Mission</h2>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-light)' }}>
              Describe your non-profit's goals, focus audience, and planned operations to match against grant databases.
            </p>
            <textarea
              rows={4}
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="Enter non-profit mission statement..."
            />
            <button 
              className="btn" 
              onClick={handleSearchGrants}
              disabled={loadingMatches || !mission.trim()}
            >
              {loadingMatches ? 'Searching Database...' : 'Analyze & Match Grants'}
            </button>
          </div>

          {/* Matches Output Section */}
          {loadingMatches && (
            <div className="card">
              <h2>2. Select Matching Grant</h2>
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card"></div>
            </div>
          )}

          {!loadingMatches && grants.length > 0 && (
            <div className="card">
              <h2>2. Select Matching Grant</h2>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text-light)' }}>
                We found the following opportunities. Select one to prompt the multi-agent drafting workflow.
              </p>
              <div>
                {grants.map((grant) => (
                  <div 
                    key={grant.id} 
                    className={`grant-item ${selectedGrant?.id === grant.id ? 'selected' : ''}`}
                    onClick={() => setSelectedGrant(grant)}
                  >
                    <div className="grant-header">
                      <span className="grant-title">{grant.title}</span>
                      <span className="grant-amount">{grant.amount}</span>
                    </div>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <strong>Funder:</strong> {grant.funder}
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                      {grant.description}
                    </p>
                  </div>
                ))}
              </div>

              <button 
                className="btn" 
                style={{ backgroundColor: 'var(--success-accent)' }}
                onClick={handleGenerateProposal}
                disabled={loadingDraft || !selectedGrant}
              >
                {loadingDraft ? 'Orchestrating Agents...' : 'Trigger Multi-Agent Draft System'}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Agent Handoff / Steps Section */}
          {(loadingDraft || agentSteps.length > 0 || finalProposal) && (
            <div className="card">
              <h2>Agent Orchestration Status</h2>
              <div className="timeline">
                {loadingDraft && agentSteps.length === 0 && (
                  <div className="timeline-step">
                    <div className="timeline-node pulsing"></div>
                    <div className="timeline-content">
                      <span className="timeline-agent">System Orchestrator</span>
                      <span className="timeline-text">Spinning up agent pipeline and retrieving safety parameters...</span>
                    </div>
                  </div>
                )}
                {agentSteps.map((step, idx) => (
                  <div key={idx} className="timeline-step">
                    <div className={`timeline-node ${loadingDraft && idx === agentSteps.length - 1 && !finalProposal ? 'pulsing' : ''}`}></div>
                    <div className="timeline-content">
                      <span className="timeline-agent">🤖 {step.agent}</span>
                      <span className="timeline-text">{step.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Secure Output */}
          {finalProposal && (
            <div className="card">
              <h2>Sanitized Proposal Preview</h2>
              <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-light)' }}>
                The draft has been audited for security. Note the safe placeholder tokens where sensitive data was parsed.
              </p>
              
              <div className="proposal-preview">
                <ReactMarkdown>{finalProposal}</ReactMarkdown>
              </div>

              {compliance && (
                <div className="compliance-box">
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--success-accent)' }}>🛡️ Shield Verification Report</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    <span className="badge badge-success">✓ PII Sanitized</span>
                    <span className="badge badge-success">✓ Formatted (Markdown)</span>
                  </div>
                  <p style={{ margin: '1rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Scrubbed items from raw draft: <strong>{compliance.pii_redacted_count}</strong> occurrences (Tax ID, Phone Number).
                  </p>
                </div>
              )}

              <button className="btn" style={{ marginTop: '1.5rem' }} onClick={handleDownload}>
                Export Markdown Document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

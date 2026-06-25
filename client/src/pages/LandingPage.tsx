import React from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

export const LandingPage: React.FC = () => {
  const [activeDemoTab, setActiveDemoTab] = React.useState<'dashboard' | 'grants' | 'editor' | 'vault' | 'settings'>('dashboard')

  React.useEffect(() => {
    // Pre-warm backend to resolve Render cold start delays
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://seedling-node-server.onrender.com';
    fetch(`${API_BASE_URL}/health`).catch(() => {});

    const tabs: ('dashboard' | 'grants' | 'editor' | 'vault' | 'settings')[] = ['dashboard', 'grants', 'editor', 'vault', 'settings']
    const interval = setInterval(() => {
      setActiveDemoTab(current => {
        const idx = tabs.indexOf(current)
        return tabs[(idx + 1) % tabs.length]
      })
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  const getMockAddress = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'https://app.seedling.ngo/dashboard'
      case 'grants': return 'https://app.seedling.ngo/grants'
      case 'editor': return 'https://app.seedling.ngo/applications/dst-women-science'
      case 'vault': return 'https://app.seedling.ngo/vault'
      case 'settings': return 'https://app.seedling.ngo/settings'
      default: return 'https://app.seedling.ngo/dashboard'
    }
  }

  return (
    <div className="landing-page-container">
      {/* FLOATING NAVIGATION HEADER */}
      <header>
        <div className="max-width-container nav-flex">
          <div className="logo">
            <svg
              className="logo-sprout"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5B9330"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22V12"></path>
              <path d="M12 12C12 7.58172 8.41828 4 4 4"></path>
              <path d="M12 15C12 11.6863 14.6863 9 18 9"></path>
              <path d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6"></path>
            </svg>
            Seedling
          </div>
          <nav className="nav-links">
            <a href="#demo">Live Demo</a>
            <a href="#stats">Platform Impact</a>
            <a href="#features">Platform Features</a>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/login" className="btn btn-ghost" style={{ fontSize: '13px', fontWeight: 500 }}>
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-primary" style={{ fontSize: '13px', fontWeight: 500 }}>
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH ACTUAL CORE UI RECORDING */}
      <main className="max-width-container">
        <section className="hero-grid">
          <div className="hero-text">
            <h1>From scattered grants to funded missions.</h1>
            <p>
              Seedling finds every grant you qualify for, drafts your proposals, and tracks your pipeline — automatically.
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary">
                Get started free
              </Link>
              <a href="#stats" className="btn btn-secondary">
                See how it works →
              </a>
            </div>
          </div>

          {/* Interactive UI Simulator */}
          <div className="demo-video-wrapper" id="demo" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="video-chrome-header" style={{ borderBottom: '1px solid #3D524A' }}>
              <div className="chrome-dots">
                <span className="chrome-dot close"></span>
                <span className="chrome-dot min"></span>
                <span className="chrome-dot max"></span>
              </div>
              <div className="chrome-address-bar" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em', border: '1px solid #3D524A' }}>
                {getMockAddress(activeDemoTab)}
              </div>
              <span className="text-mono" style={{ fontSize: '9px', color: '#B4CCC1', background: 'rgba(61, 82, 74, 0.45)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                AUTOPLAY SIMULATOR
              </span>
            </div>

            <div className="video-viewport" style={{ padding: 0, overflow: 'hidden', height: '350px', backgroundColor: '#0d1f1a', display: 'grid', gridTemplateColumns: '56px 1fr' }}>
              {/* Mock Sidebar */}
              <div style={{
                width: '56px',
                backgroundColor: '#091410',
                borderRight: '1px solid #3D524A',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: '1rem',
                gap: '1.25rem'
              }}>
                <div style={{ color: '#5B9330', marginBottom: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22V12"></path>
                    <path d="M12 12C12 7.58172 8.41828 4 4 4"></path>
                    <path d="M12 15C12 11.6863 14.6863 9 18 9"></path>
                    <path d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6"></path>
                  </svg>
                </div>
                {[
                  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
                  { id: 'grants', icon: '🔍', label: 'Find Grants' },
                  { id: 'editor', icon: '✍️', label: 'Editor' },
                  { id: 'vault', icon: '🗄️', label: 'Vault' },
                  { id: 'settings', icon: '⚙️', label: 'Settings' }
                ].map(item => {
                  const isActive = activeDemoTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveDemoTab(item.id as any)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: isActive ? '1px solid rgba(91, 147, 48, 0.3)' : '1px solid transparent',
                        backgroundColor: isActive ? 'rgba(61, 82, 74, 0.45)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        cursor: 'pointer',
                        color: isActive ? '#f4f6f5' : '#b4ccc1',
                        transition: 'all 0.2s'
                      }}
                      title={item.label}
                    >
                      {item.icon}
                    </button>
                  )
                })}
              </div>

              {/* Main Content Area */}
              <div style={{ flex: 1, height: '100%', overflow: 'hidden', backgroundColor: '#0d1f1a' }}>
                {activeDemoTab === 'dashboard' && (
                  <div className="animate-[fadeIn_0.3s_ease-out]" style={{ padding: '1.25rem', color: '#f4f6f5', fontFamily: 'system-ui, sans-serif', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: 'Satoshi, sans-serif', color: '#f4f6f5' }}>Good morning, Earthcare Foundation</h3>
                        <p style={{ fontSize: '11px', color: '#b4ccc1', margin: '2px 0 0 0' }}>Here are your compliance matches for today.</p>
                      </div>
                      <span style={{ fontSize: '9px', background: 'rgba(91,147,48,0.2)', border: '1px solid #5B9330', color: '#f4f6f5', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>Mock API Connection: OK</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      {[
                        { label: 'Active Drafts', val: '3', color: '#b5dfcc' },
                        { label: 'Ingested Documents', val: '12', color: '#b5dfcc' },
                        { label: 'Overall Eligibility Score', val: '94%', color: '#5B9330' }
                      ].map((card, i) => (
                        <div key={i} style={{ backgroundColor: '#13241f', border: '1px solid #3D524A', borderRadius: '6px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontSize: '9px', color: '#b4ccc1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</span>
                          <span style={{ fontSize: '18px', fontWeight: 700, color: card.color }}>{card.val}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 650, color: '#b4ccc1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>High Match Grants (Compliance Verified)</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {[
                          { title: 'DST Women Scientists Scheme', budget: '₹15,00,000', score: '98%', status: 'Active Draft' },
                          { title: 'Tata Trusts Social Innovation Fund', budget: '₹25,00,000', score: '92%', status: 'Eligible' },
                          { title: 'Infosys CSR Environment Grant', budget: '₹50,00,000', score: '87%', status: 'Eligible' }
                        ].map((grant, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#13241f', border: '1px solid #3D524A', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '11px' }}>
                            <div>
                              <span style={{ fontWeight: 600, display: 'block', color: '#f4f6f5' }}>{grant.title}</span>
                              <span style={{ color: '#b4ccc1', fontSize: '10px' }}>Budget: {grant.budget}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: '#5B9330', fontWeight: 700 }}>{grant.score} Match</span>
                              <span style={{ background: grant.status === 'Active Draft' ? 'rgba(91,147,48,0.2)' : 'rgba(255,255,255,0.05)', color: grant.status === 'Active Draft' ? '#b5dfcc' : '#b4ccc1', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>{grant.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeDemoTab === 'grants' && (
                  <div className="animate-[fadeIn_0.3s_ease-out]" style={{ padding: '1.25rem', color: '#f4f6f5', fontFamily: 'system-ui, sans-serif', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: 'Satoshi, sans-serif', color: '#f4f6f5' }}>Two-Pass Eligibility Matches</h3>
                      <p style={{ fontSize: '11px', color: '#b4ccc1', margin: '2px 0 0 0' }}>Pass 1 excludes statutory barriers. Pass 2 runs semantic AI matching.</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#13241f', border: '1px solid #3D524A', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '11px' }}>
                      <span style={{ fontSize: '14px' }}>🛡️</span>
                      <div>
                        <span style={{ fontWeight: 600, display: 'block', color: '#b5dfcc' }}>Compliance Profile Verified</span>
                        <span style={{ color: '#b4ccc1', fontSize: '10px' }}>12A, 80G, NGO Darpan IDs confirmed. Max eligible budget ₹25L.</span>
                      </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #3D524A', color: '#b4ccc1', textAlign: 'left' }}>
                          <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600 }}>Grant Opportunity</th>
                          <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600 }}>Score</th>
                          <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { title: 'DST Science & Tech Scheme', score: '98%', status: 'Matches Core profile', color: '#5B9330' },
                          { title: 'UNDP Climate Resilience India', score: '91%', status: 'Matches Geography', color: '#5B9330' },
                          { title: 'BIRAC Biotech Startups Scheme', score: 'Filtered', status: 'Requires Turnover > ₹1Cr', color: '#ef4444' }
                        ].map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(61, 82, 74, 0.3)' }}>
                            <td style={{ padding: '0.6rem 0.2rem' }}>
                              <span style={{ fontWeight: 600, display: 'block', color: '#f4f6f5' }}>{row.title}</span>
                            </td>
                            <td style={{ padding: '0.6rem 0.2rem', color: row.color, fontWeight: 700 }}>{row.score}</td>
                            <td style={{ padding: '0.6rem 0.2rem', color: row.color === '#ef4444' ? '#ef4444' : '#b4ccc1' }}>{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeDemoTab === 'editor' && (
                  <div className="animate-[fadeIn_0.3s_ease-out]" style={{ padding: '1.25rem', color: '#f4f6f5', fontFamily: 'system-ui, sans-serif', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: 'Satoshi, sans-serif', color: '#f4f6f5' }}>Split-Screen AI Draft Editor</h3>
                      <p style={{ fontSize: '11px', color: '#b4ccc1', margin: '2px 0 0 0' }}>Generates contextually accurate sections powered by Gemini & Llama-3.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.75rem', flex: 1, minHeight: 0 }}>
                      <div style={{ backgroundColor: '#13241f', border: '1px solid #3D524A', borderRadius: '6px', padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' }}>
                        <span style={{ fontSize: '8px', color: '#5B9330', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Funder Guidelines</span>
                        <h4 style={{ fontSize: '11px', fontWeight: 600, margin: 0, color: '#f4f6f5' }}>Section 3: Sustainability Plan</h4>
                        <p style={{ fontSize: '10px', color: '#b4ccc1', margin: 0, lineHeight: '1.4' }}>
                          Demonstrate how activities will persist financially after the 12-month grant term expires. Avoid proposing continuous donor dependency.
                        </p>
                      </div>

                      <div style={{ backgroundColor: '#091410', border: '1px solid #3D524A', borderRadius: '6px', padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '8px', color: '#b5dfcc', textTransform: 'uppercase', fontWeight: 700 }}>AI Draft Generator</span>
                          <span style={{ fontSize: '8px', color: '#5B9330', background: 'rgba(91,147,48,0.15)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>Llama-3 Refined</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#f4f6f5', lineHeight: '1.4', fontFamily: 'monospace' }}>
                          "The Earthcare Foundation will launch a community-managed maintenance cooperative. Local water users will pay a progressive sliding fee structure, funding technical upkeep and replacement parts..."
                        </div>
                        <div style={{ borderTop: '1px solid #3D524A', paddingTop: '0.4rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '8px', color: '#b4ccc1' }}>142 words</span>
                          <span style={{ fontSize: '8px', color: '#5B9330' }}>⚡ Drafting compliance blocks...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeDemoTab === 'vault' && (
                  <div className="animate-[fadeIn_0.3s_ease-out]" style={{ padding: '1.25rem', color: '#f4f6f5', fontFamily: 'system-ui, sans-serif', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: 'Satoshi, sans-serif', color: '#f4f6f5' }}>Memory Vault</h3>
                      <p style={{ fontSize: '11px', color: '#b4ccc1', margin: '2px 0 0 0' }}>Institutional files processed into vector embeddings for contextual drafting.</p>
                    </div>

                    <div style={{ border: '1px dashed #3D524A', backgroundColor: '#13241f', borderRadius: '6px', padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '16px' }}>📄</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#f4f6f5' }}>Memory Vault Synced</span>
                      <span style={{ fontSize: '9px', color: '#b4ccc1' }}>All historical documents contextually available for the AI Writer.</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {[
                        { name: 'audited_financials_fy25.pdf', size: '45 KB' },
                        { name: 'trust_deed_and_bylaws.pdf', size: '128 KB' },
                        { name: 'previous_dst_water_grant.docx', size: '89 KB' }
                      ].map((doc, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#13241f', border: '1px solid #3D524A', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '11px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📂</span>
                            <span style={{ color: '#f4f6f5' }}>{doc.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#b4ccc1', fontSize: '10px' }}>{doc.size}</span>
                            <span style={{ color: '#5B9330', background: 'rgba(91,147,48,0.15)', fontSize: '8px', padding: '0.1rem 0.3rem', borderRadius: '3px', fontWeight: 700 }}>INGESTED</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDemoTab === 'settings' && (
                  <div className="animate-[fadeIn_0.3s_ease-out]" style={{ padding: '1.25rem', color: '#f4f6f5', fontFamily: 'system-ui, sans-serif', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: 'Satoshi, sans-serif', color: '#f4f6f5' }}>Compliance Dashboard Settings</h3>
                      <p style={{ fontSize: '11px', color: '#b4ccc1', margin: '2px 0 0 0' }}>Configure statutory attributes used by the eligibility crawler filtering system.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {[
                        { label: 'NGO Darpan ID Verification', val: 'Active (KA/2019/02419)' },
                        { label: 'Tax Exemption Status (80G/12A)', val: 'Verified & Active' },
                        { label: 'CSR-1 Registration Number', val: 'CSR00018592 (Approved)' },
                        { label: 'FCRA Registration Status', val: 'Inactive (Turnover filter auto-applied)' }
                      ].map((item, i) => (
                        <div key={i} style={{ backgroundColor: '#13241f', border: '1px solid #3D524A', borderRadius: '6px', padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                          <div>
                            <span style={{ color: '#b4ccc1', display: 'block', fontSize: '10px' }}>{item.label}</span>
                            <span style={{ fontWeight: 600, color: '#f4f6f5' }}>{item.val}</span>
                          </div>
                          <span style={{ color: '#5B9330', fontSize: '14px' }}>✓</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAR SECTION */}
        <section id="stats" className="stats-bar-section">
          <div className="stats-bar-grid">
            <div className="stat-card">
              <span className="stat-value">8+</span>
              <span className="stat-label">Major Portals Monitored Daily</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">3 wk → 3 min</span>
              <span className="stat-label">Statutory Clearance & Matching Time</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">Self-Healing</span>
              <span className="stat-label">Failover Pipeline scaling to 50+ Portals</span>
            </div>
          </div>
        </section>

        {/* THE PROBLEM SECTION */}
        <section className="problem-section">
          <div className="section-eyebrow">THE PROBLEM</div>
          <h2>Grant hunting is broken.</h2>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">🔍</div>
              <h3>Discovery Chaos</h3>
              <p>Searching 15+ government, foundation, and CSR websites manually. Taking weeks per funding cycle.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">📝</div>
              <h3>Written from Zero</h3>
              <p>Retyping the same mission, team details, and budgets repeatedly from scratch for every single proposal.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🧠</div>
              <h3>No Institutional Memory</h3>
              <p>Funder relationship histories, submission copies, and lessons learned leave when coordinators change.</p>
            </div>
          </div>
        </section>

        {/* SLEEK & MINIMAL FEATURES SECTION */}
        <section id="features" className="sleek-features-section">
          <div className="features-header">
            <h2>Sleek Architecture & Core Capabilities</h2>
            <p>
              A resilient pipeline system designed for non-profit operations, handling statutory checkpoints
              and resource constraints automatically.
            </p>
          </div>

          <div className="sleek-features-grid">
            {/* Feature 1 */}
            <div className="sleek-feature-cell">
              <span className="feature-num">01 / DISCOVERY AGGREGATOR</span>
              <h3>Global Grant Ingestion</h3>
              <p>
                Scrapes announcements from 8 targeted Indian government and CSR portals concurrently. Extracts
                dates, locations, and budgets via regex, doing non-destructive upserts with composite unique
                constraints.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="sleek-feature-cell">
              <span className="feature-num">02 / COMPLIANCE SORTING</span>
              <h3>Two-Pass Match Engine</h3>
              <p>
                Pass 1 instantly filters out grants requiring statutory credentials the NGO lacks (12A/80G,
                CSR-1, NGO Darpan, or turnover). Pass 2 runs semantic cosine vector scoring on the NGO's
                mission and projects.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="sleek-feature-cell">
              <span className="feature-num">03 / CONTEXTUAL LLM WRITER</span>
              <h3>Split-Screen Proposal Generator</h3>
              <p>
                Assembles proposal text across 6 required sections. Automatically matches the grant guidelines
                against the NGO's historical Memory Vault, generating drafts powered by Groq and Gemini.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="sleek-feature-cell">
              <span className="feature-num">04 / RATE-LIMIT RESILIENCE</span>
              <h3>Dual-Tier Fallback & Caching</h3>
              <p>
                Safeguards LLM API quotas by caching generated drafts using SHA256 hashes of the target
                organization and grant. Implements tenacity backoffs and falls back to Gemini Flash-Lite if
                Groq 429s persist.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* CTA BANNER SECTION */}
      <section className="cta-banner-section">
        <div className="max-width-container cta-banner-content">
          <h2>Ready to stop searching and start winning?</h2>
          <p>Set up your organization compliance profile in 5 minutes and see matched grants immediately.</p>
          <Link to="/signup" className="btn btn-cta">
            Get started free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="max-width-container">
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            🌱 Seedling — From scattered grants to funded missions.
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)' }}>
            Built using FastAPI Python Engine, Express API, React Vite Frontend, and Supabase DB.
          </p>

          <div className="footer-badge-list">
            <span className="badge">FastAPI</span>
            <span className="badge">Express Node.js</span>
            <span className="badge">React Vite</span>
            <span className="badge">Supabase DB</span>
            <span className="badge">Groq Llama-3</span>
            <span className="badge">Gemini Flash-Lite</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

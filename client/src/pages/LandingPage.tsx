import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

interface NgoProfile {
  name: string;
  type: string;
  legal_entity: string;
  turnover: string;
  darpan: string;
  has_12a_80g: string;
  has_fcra: string;
  has_csr1: string;
}

const NGO_PROFILES: Record<string, NgoProfile> = {
  seva: {
    name: "Seva Foundation",
    type: "NGO",
    legal_entity: "Trust",
    turnover: "₹45 Lakhs",
    darpan: "None (Not Registered)",
    has_12a_80g: "Yes (Valid)",
    has_fcra: "No",
    has_csr1: "Yes (Registered)"
  },
  vigyan: {
    name: "Vigyan Labs",
    type: "Research Group",
    legal_entity: "Society",
    turnover: "₹8 Lakhs",
    darpan: "DAR-98765",
    has_12a_80g: "Yes (Valid)",
    has_fcra: "No",
    has_csr1: "No"
  },
  nari: {
    name: "Nari Vikas Trust",
    type: "NGO",
    legal_entity: "Section 8 Company",
    turnover: "₹1.4 Crores",
    darpan: "DAR-12345",
    has_12a_80g: "Yes (Valid)",
    has_fcra: "Yes (Active)",
    has_csr1: "Yes (Registered)"
  }
};

interface LogLine {
  type: 'info' | 'warn' | 'error' | 'success';
  text: string;
}

export const LandingPage: React.FC = () => {
  // ── Simulated Video Player State ─────────────────────────────────────
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [videoTimelineSec, setVideoTimelineSec] = useState(0)
  const videoDurationSec = 24
  const sceneDuration = 6
  const videoTimerRef = useRef<any | null>(null)
  const proposalTextRef = useRef<HTMLDivElement>(null)

  // ── Sandbox Simulator State ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'ingest' | 'match' | 'draft'>('ingest')

  // Tab 1: Ingestion
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingestLogs, setIngestLogs] = useState<LogLine[]>([
    { type: 'info', text: '// System idle. Press "Execute Scrape Run" to start.' }
  ])
  const [showIngestTable, setShowIngestTable] = useState(false)

  // Tab 2: Two-Pass Matcher
  const [selectedNgoKey, setSelectedNgoKey] = useState<string>('seva')
  const [isMatching, setIsMatching] = useState(false)
  const [matchLogs, setMatchLogs] = useState<LogLine[]>([
    { type: 'info', text: '// System idle. Select an NGO and press "Run Two-Pass Matcher".' }
  ])
  const [showMatchResultTable, setShowMatchResultTable] = useState(false)

  // Tab 3: Writer
  const [draftGrantKey, setDraftGrantKey] = useState<string>('dst')
  const [draftLlmKey, setDraftLlmKey] = useState<string>('groq')
  const [isDrafting, setIsDrafting] = useState(false)
  const [draftLoadingStatus, setDraftLoadingStatus] = useState('')
  const [showDraftResult, setShowDraftResult] = useState(false)

  // ── Video Walkthrough Loop Effect ────────────────────────────────────
  useEffect(() => {
    if (isVideoPlaying) {
      videoTimerRef.current = setInterval(() => {
        setVideoTimelineSec((prev) => {
          if (prev >= videoDurationSec) {
            return 0
          }
          return prev + 0.5
        })
      }, 500)
    } else {
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current)
      }
    }
    return () => {
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current)
      }
    }
  }, [isVideoPlaying])

  // Scroll proposal editor text in Scene 3
  const activeScene = Math.min(Math.floor(videoTimelineSec / sceneDuration) + 1, 4)
  useEffect(() => {
    if (activeScene === 3 && proposalTextRef.current) {
      const sceneTime = videoTimelineSec - 12 // 0 to 6s
      if (sceneTime >= 0) {
        proposalTextRef.current.scrollTop = sceneTime * 35
      }
    }
  }, [videoTimelineSec, activeScene])

  const toggleSimulatedVideo = () => {
    setIsVideoPlaying(!isVideoPlaying)
  }

  // Calculate cursor translation
  let cursorPos = { x: -10, y: -10 }
  if (videoTimelineSec >= 0 && videoTimelineSec < 6) {
    cursorPos = { x: 220, y: 140 }
  } else if (videoTimelineSec >= 6 && videoTimelineSec < 12) {
    cursorPos = { x: 380, y: 290 }
  } else if (videoTimelineSec >= 12 && videoTimelineSec < 18) {
    cursorPos = { x: 420, y: 50 }
  } else if (videoTimelineSec >= 18 && videoTimelineSec <= 24) {
    cursorPos = { x: 250, y: 180 }
  }

  const isDraftBtnScaled = videoTimelineSec >= 8.0 && videoTimelineSec <= 9.0

  // ── Sandbox Pipeline Simulations ─────────────────────────────────────

  // 1. Ingestion Simulator
  const runIngestSim = async () => {
    setIsIngesting(true)
    setIngestLogs([])
    setShowIngestTable(false)

    const logLines: LogLine[] = [
      { type: 'info', text: '22:20:01 [INFO] POST /scrape/trigger authorized successfully via X-Webhook-Secret.' },
      { type: 'info', text: '22:20:01 [INFO] Background task queued. Returning 202 Accepted.' },
      { type: 'info', text: '22:20:02 [INFO] Starting web scraping pipeline run...' },
      { type: 'info', text: "22:20:03 [INFO] Scraper 'DST' successfully retrieved 3 grants." },
      { type: 'info', text: "22:20:03 [INFO] Scraper 'BIRAC' successfully retrieved 3 grants." },
      { type: 'info', text: "22:20:04 [INFO] Scraper 'MSJE' successfully retrieved 3 grants." },
      { type: 'info', text: "22:20:04 [INFO] Scraper 'Tata Trusts' successfully retrieved 3 grants." },
      { type: 'info', text: "22:20:04 [INFO] Scraper 'Ford Foundation' successfully retrieved 3 grants." },
      { type: 'info', text: "22:20:04 [INFO] Scraper 'Infosys Foundation' successfully retrieved 3 grants." },
      { type: 'info', text: "22:20:05 [INFO] Scraper 'UN Women' successfully retrieved 3 grants." },
      { type: 'info', text: "22:20:05 [INFO] Scraper 'UNDP' successfully retrieved 3 grants." },
      { type: 'info', text: '22:20:05 [INFO] Retrieved 24 total grants. Running heuristic parsing...' },
      { type: 'info', text: '22:20:06 [INFO] Attempting to upsert 24 grants to database...' },
      { type: 'success', text: '22:20:07 [SUCCESS] HTTP POST Supabase Gateway: 24 grants successfully upserted.' },
      { type: 'info', text: '22:20:07 [INFO] Checking for stale/closed grant deadlines...' },
      { type: 'success', text: '22:20:08 [SUCCESS] pipeline completed. Ingested: 24 | Soft-Deleted: 0' }
    ]

    for (const line of logLines) {
      setIngestLogs((prev) => [...prev, line])
      await new Promise((r) => setTimeout(r, 200))
    }
    setShowIngestTable(true)
    setIsIngesting(false)
  }

  // 2. Matching Simulator
  const runMatchSim = async () => {
    setIsMatching(true)
    setMatchLogs([])
    setShowMatchResultTable(false)

    const ngo = NGO_PROFILES[selectedNgoKey]
    const introLines: LogLine[] = [
      { type: 'info', text: `22:21:00 [INFO] Running Matching Engine for Org: "${ngo.name}"` },
      { type: 'info', text: '22:21:00 [INFO] Querying active grants from Supabase... Found 24 active grants.' },
      { type: 'info', text: '22:21:01 [INFO] Initiating Pass 1: Statutory Hard-Filtering...' }
    ]

    for (const line of introLines) {
      setMatchLogs((prev) => [...prev, line])
      await new Promise((r) => setTimeout(r, 200))
    }

    if (selectedNgoKey === 'seva') {
      setMatchLogs((prev) => [...prev, { type: 'info', text: "Checking 'DST Science Initiative' against compliance profile..." }])
      await new Promise((r) => setTimeout(r, 150))
      setMatchLogs((prev) => [...prev, { type: 'error', text: "  [FAIL] Grant requires 'NGO Darpan ID'. NGO lacks Darpan profile. Dropping grant." }])

      setMatchLogs((prev) => [...prev, { type: 'info', text: "Checking 'Tata Trusts Rural Health' against compliance profile..." }])
      await new Promise((r) => setTimeout(r, 150))
      setMatchLogs((prev) => [...prev, { type: 'success', text: '  [PASS] All statutory checkboxes met (12A/80G, CSR-1, Audited Financials).' }])

      setMatchLogs((prev) => [...prev, { type: 'info', text: "Checking 'Ford Foundation Empowerment' against compliance profile..." }])
      await new Promise((r) => setTimeout(r, 150))
      setMatchLogs((prev) => [...prev, { type: 'error', text: "  [FAIL] Grant requires 'FCRA Status' (Foreign funding). NGO lacks FCRA. Dropping grant." }])

      setMatchLogs((prev) => [...prev, { type: 'info', text: 'Initiating Pass 2: Semantic TF-IDF similarity on surviving grants...' }])
      await new Promise((r) => setTimeout(r, 300))
      setMatchLogs((prev) => [...prev, { type: 'success', text: 'Tata Trusts score: 86% (High overlap with Rural Development mission).' }])
    } else if (selectedNgoKey === 'vigyan') {
      setMatchLogs((prev) => [...prev, { type: 'info', text: "Checking 'DST Science Initiative' against compliance profile..." }])
      await new Promise((r) => setTimeout(r, 150))
      setMatchLogs((prev) => [...prev, { type: 'success', text: '  [PASS] All statutory checkboxes met (NGO Darpan ID, 12A/80G, Turnover under 10L).' }])

      setMatchLogs((prev) => [...prev, { type: 'info', text: "Checking 'Tata Trusts Rural Health' against compliance profile..." }])
      await new Promise((r) => setTimeout(r, 150))
      setMatchLogs((prev) => [...prev, { type: 'error', text: "  [FAIL] Grant requires 'CSR-1' registration. NGO lacks CSR-1. Dropping grant." }])

      setMatchLogs((prev) => [...prev, { type: 'info', text: "Checking 'Ford Foundation Empowerment' against compliance profile..." }])
      await new Promise((r) => setTimeout(r, 150))
      setMatchLogs((prev) => [...prev, { type: 'error', text: "  [FAIL] Grant requires 'FCRA Status'. NGO lacks FCRA. Dropping grant." }])

      setMatchLogs((prev) => [...prev, { type: 'info', text: 'Initiating Pass 2: Semantic TF-IDF similarity on surviving grants...' }])
      await new Promise((r) => setTimeout(r, 300))
      setMatchLogs((prev) => [...prev, { type: 'success', text: 'DST Science Initiative score: 94% (Very strong match on scientific research).' }])
    } else {
      setMatchLogs((prev) => [...prev, { type: 'info', text: 'Checking all grants against compliance profile...' }])
      await new Promise((r) => setTimeout(r, 200))
      setMatchLogs((prev) => [...prev, { type: 'success', text: '  [PASS] Cleared Pass 1 for all 3 grants.' }])

      setMatchLogs((prev) => [...prev, { type: 'info', text: 'Initiating Pass 2: Semantic TF-IDF similarity on surviving grants...' }])
      await new Promise((r) => setTimeout(r, 300))
    }

    setShowMatchResultTable(true)
    setIsMatching(false)
  }

  // 3. Proposal Writer Simulator
  const runDraftSim = async () => {
    setIsDrafting(true)
    setShowDraftResult(false)

    const steps = [
      'Checking TTL response cache...',
      'Cache miss. Fetching matched past projects...',
      `Pumping context to LLM: using ${draftLlmKey === 'groq' ? 'Llama-3.1-8b' : 'Gemini-2.5-Flash'}...`,
      'LLM generating structured sections (applying 6-section template)...'
    ]

    for (const step of steps) {
      setDraftLoadingStatus(step)
      await new Promise((r) => setTimeout(r, 350))
    }

    setShowDraftResult(true)
    setIsDrafting(false)
  }

  // Helper formatting for timer
  const minutes = Math.floor(videoTimelineSec / 60)
  const seconds = Math.floor(videoTimelineSec) % 60
  const timerText = `${minutes}:${seconds < 10 ? '0' + seconds : seconds} / 0:24`
  const progressPercent = (videoTimelineSec / videoDurationSec) * 100

  // ── Scoped Simulated Proposal Text ───────────────────────────────────
  let draftTitle = 'Proposal Draft for Research Initiative'
  let draftContent = null

  if (draftGrantKey === 'dst') {
    draftTitle = 'DST Science & Heritage Initiative Proposal'
    draftContent = (
      <>
        <div className="proposal-section-block">
          <h4>## About Our Organization</h4>
          <p>Our organization has been active in scientific research for rural advancement since 2018. Over the past years, we have built key research methodologies focusing on heritage conservation and traditional crafts using modern technical tools.</p>
        </div>
        <div className="proposal-section-block">
          <h4>## The Problem We Address</h4>
          <p>Traditional heritage objects and ancient craft practices in Southern India are rapidly deteriorating due to environmental exposure and lack of scientific conservation standards, threatening local artisan livelihoods.</p>
        </div>
        <div className="proposal-section-block">
          <h4>## Our Proposed Project</h4>
          <p>We propose installing advanced chemical analysis tools in our rural labs to help local artisan communities analyze, treat, and restore heritage terracotta objects using scientific preservation compounds.</p>
        </div>
        <div className="proposal-section-block">
          <h4>## Past Work & Evidence</h4>
          <p>Our organization previously successfully implemented the <strong>'Heritage Restoration Scheme'</strong> and <strong>'Artisan Digital Archiving Project'</strong>. These projects established our capacity to deploy equipment and manage government grant guidelines efficiently.</p>
        </div>
        <div className="proposal-section-block">
          <h4>## Budget Justification</h4>
          <p>Total Budget Requested: ₹45 Lakhs. This covers laboratory equipment calibration (₹25L), community training workshops (₹10L), and administrative compliance audits (₹10L).</p>
        </div>
        <div className="proposal-section-block">
          <h4>## Expected Outcomes</h4>
          <p>Empowerment of over 200 craft artisans, digital documentation of 50+ unique historical artifacts, and creation of a sustainable, scientific conservation protocol.</p>
        </div>
      </>
    )
  } else if (draftGrantKey === 'tata') {
    draftTitle = 'Tata Trusts Health Grant Proposal'
    draftContent = (
      <>
        <div className="proposal-section-block">
          <h4>## About Our Organization</h4>
          <p>We are a rural health advocacy NGO dedicated to providing preventive primary healthcare services to marginalized farming families across the rural districts of Maharashtra.</p>
        </div>
        <div className="proposal-section-block">
          <h4>## The Problem We Address</h4>
          <p>Grassroots communities lack basic primary health monitoring facilities, leading to preventable diagnostic delays and high healthcare debt when chronic issues develop.</p>
        </div>
        <div className="proposal-section-block">
          <h4>## Our Proposed Project</h4>
          <p>Establishing mobile diagnostic camps equipped with basic screening tools (blood pressure, diabetes, maternal health metrics) operating twice a week in 15 rural villages.</p>
        </div>
        <div className="proposal-section-block">
          <h4>## Past Work & Evidence</h4>
          <p>Our track record includes running the <strong>'Rural Health Camp Phase 1'</strong> which screened over 1,500 beneficiaries and successfully achieved a 92% patient compliance score.</p>
        </div>
        <div className="proposal-section-block">
          <h4>## Budget Justification</h4>
          <p>Requested: ₹25L. Covers mobile van maintenance (₹10L), medical supplies and diagnostics (₹10L), and reporting overheads (₹5L).</p>
        </div>
        <div className="proposal-section-block">
          <h4>## Expected Outcomes</h4>
          <p>Primary screening of 3,000 rural residents, early diagnosis of chronic cardiovascular issues in 400+ patients, and direct link to district government hospitals.</p>
        </div>
      </>
    )
  } else {
    draftTitle = 'UN Women Gender Equality Support Proposal'
    draftContent = (
      <>
        <div className="proposal-section-block">
          <h4>## About Our Organization</h4>
          <p>Our foundation works at the intersection of gender justice and digital literacy, building training and advocacy programs for marginalized women in low-income urban clusters.</p>
        </div>
        <div className="proposal-section-block">
          <h4>## The Problem We Address</h4>
          <p>The gender digital divide restricts women's access to modern job markets, digital banking, and government social benefit registries, perpetuating economic dependence.</p>
        </div>
        <div className="proposal-section-block">
          <h4>## Our Proposed Project</h4>
          <p>Creating community-managed digital literacy nodes ('DigiShakti Centers') offering training in banking, fundamental office tools, and remote work preparedness for young women.</p>
        </div>
        <div className="proposal-section-block">
          <h4>## Past Work & Evidence</h4>
          <p>Validated by our past program <strong>'Women Digital Empowerment 2024'</strong> which successfully graduated 450 women with a verified 70% employment/freelance placement rate.</p>
        </div>
        <div className="proposal-section-block">
          <h4>## Budget Justification</h4>
          <p>Requested: $80,000 USD. Covers center rental and laptop equipment (35%), educator and mentor stipends (40%), and project reporting/monitoring (25%).</p>
        </div>
        <div className="proposal-section-block">
          <h4>## Expected Outcomes</h4>
          <p>Establishment of 5 active center nodes, certification of 600 young women in digital tools, and alignment with SDG 5 (Gender Equality) and SDG 8 (Decent Work).</p>
        </div>
      </>
    )
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
            <a href="#demo">Live Walkthrough</a>
            <a href="#features">Platform Features</a>
            <a href="#playground">Interactive Sandbox</a>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/login" className="btn btn-ghost" style={{ fontSize: '13px', fontWeight: 500 }}>
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-primary" style={{ fontSize: '13px', fontWeight: 500 }}>
              Try Sandbox
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH INTEGRATED MOCK VIDEO PLAYER */}
      <main className="max-width-container">
        <section className="hero-grid">
          <div className="hero-text">
            <h1>Scrape. Match. Draft.</h1>
            <p>
              The automated grant discoverability and proposal writing engine built exclusively to navigate
              statutory checks and compliance filters for Indian grassroots NGOs.
            </p>
            <div className="hero-buttons">
              <a href="#playground" className="btn btn-primary">
                Open Sandbox
              </a>
              <a href="#features" className="btn btn-secondary">
                Explore Architecture
              </a>
            </div>
          </div>

          {/* Video Player UI */}
          <div className="demo-video-wrapper" id="demo">
            <div className="video-chrome-header">
              <div className="chrome-dots">
                <span className="chrome-dot close"></span>
                <span className="chrome-dot min"></span>
                <span className="chrome-dot max"></span>
              </div>
              <div className="chrome-address-bar">https://app.seedling.ngo/dashboard</div>
              <span className="text-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                DEMO
              </span>
            </div>

            <div className="video-viewport">
              {/* Play Overlay */}
              {!isVideoPlaying && videoTimelineSec === 0 && (
                <div className="video-play-overlay" onClick={toggleSimulatedVideo}>
                  <div className="play-icon-circle">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{ color: '#fff', marginLeft: '2px' }}
                    >
                      <polygon points="5 3 19 12 5 21"></polygon>
                    </svg>
                  </div>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '16px' }}>
                    Watch Walkthrough Demo
                  </span>
                  <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    (24 seconds)
                  </span>
                </div>
              )}

              {/* Mock Cursor */}
              {isVideoPlaying && (
                <svg
                  className="mock-cursor"
                  style={{
                    transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)`,
                  }}
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M4 3l12 9.5-4.5 1 4 7-2.5 1.5-4-7.5-5 4z" />
                </svg>
              )}

              {/* SCENE 1: Discovery Feed */}
              <div className={`video-frame ${activeScene === 1 ? 'active' : ''}`}>
                <div className="mock-video-bg">
                  <div className="mock-sidebar">
                    <span className="sidebar-icon active">🌱</span>
                    <span className="sidebar-icon">📁</span>
                    <span className="sidebar-icon">📝</span>
                  </div>
                  <div className="mock-content">
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', marginBottom: '0.25rem' }}>
                      Matched Discoveries
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Based on statutory NGO profile clearances
                    </p>

                    <div
                      className="mock-panel-box"
                      style={{
                        borderColor: 'var(--primary-brand)',
                        backgroundColor: 'var(--accent-tint)',
                      }}
                    >
                      <div className="video-timeline-grid">
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          Science & Heritage Grant
                        </span>
                        <span className="status-pill active" style={{ fontSize: '11px' }}>
                          96% FIT
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Funder: Dept of Science & Technology (DST)
                      </p>
                    </div>

                    <div className="mock-panel-box" style={{ opacity: 0.4 }}>
                      <div className="video-timeline-grid">
                        <span style={{ color: 'var(--text-primary)' }}>Tata Trusts Health Scheme</span>
                        <span style={{ color: 'var(--status-warning-text)', fontWeight: 500 }}>74% FIT</span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Funder: Tata Trusts</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SCENE 2: Statutory Check */}
              <div className={`video-frame ${activeScene === 2 ? 'active' : ''}`}>
                <div className="mock-video-bg">
                  <div className="mock-sidebar">
                    <span className="sidebar-icon active">🌱</span>
                    <span className="sidebar-icon">📁</span>
                    <span className="sidebar-icon">📝</span>
                  </div>
                  <div className="mock-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Grant Details
                      </span>
                      <span className="text-mono" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                        ID: DST-2026-08
                      </span>
                    </div>

                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      DST Science & Heritage Initiative
                    </h4>

                    <div className="mock-panel-box" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          display: 'block',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Pass 1: Statutory Check
                      </span>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--status-success-text)' }}>
                          <span>✓</span> <span>NGO Darpan Registered</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--status-success-text)' }}>
                          <span>✓</span> <span>Active 12A/80G Status</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--status-success-text)' }}>
                          <span>✓</span> <span>3 Years Audited Financials</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span style={{ fontSize: '13px' }}>
                        Fit Score:{' '}
                        <strong style={{ color: 'var(--status-success-text)' }}>96% Strong Match</strong>
                      </span>
                      <span
                        className="btn btn-primary"
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '11px',
                          borderRadius: '6px',
                          transform: isDraftBtnScaled ? 'scale(0.95)' : 'scale(1)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        Start Application
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SCENE 3: AI Proposal Drafting */}
              <div className={`video-frame ${activeScene === 3 ? 'active' : ''}`}>
                <div className="mock-video-bg">
                  <div className="mock-sidebar">
                    <span className="sidebar-icon">🌱</span>
                    <span className="sidebar-icon">📁</span>
                    <span className="sidebar-icon active">📝</span>
                  </div>
                  <div className="mock-content" style={{ padding: '1rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '0.4rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                        Split-Screen Proposal Editor
                      </span>
                      <span
                        className="text-mono"
                        style={{ fontSize: '10px', color: 'var(--status-success-text)', fontWeight: 700 }}
                      >
                        Compiling via Groq API...
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', height: '80%' }}>
                      {/* Left Side Context */}
                      <div style={{ fontSize: '11px', borderRight: '1px solid var(--border-color)', paddingRight: '0.5rem' }}>
                        <strong
                          style={{
                            display: 'block',
                            marginBottom: '0.25rem',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Memory Vault Projects:
                        </strong>
                        <div style={{ background: 'var(--bg-surface)', padding: '0.3rem', borderRadius: '4px', marginBottom: '0.25rem' }}>
                          • Artisan Digital Archival
                        </div>
                        <div style={{ background: 'var(--bg-surface)', padding: '0.3rem', borderRadius: '4px' }}>
                          • Heritage Restoration Camp
                        </div>
                      </div>
                      {/* Right Side Proposal text */}
                      <div
                        ref={proposalTextRef}
                        className="text-mono"
                        style={{
                          fontSize: '10px',
                          overflowY: 'hidden',
                          background: 'var(--bg-page)',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <strong>## About Our Organization</strong>
                        <br />
                        Our scientific advancements in cultural conservation allow artisans to restore ancient
                        heritage objects...
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SCENE 4: Submission Confirmation */}
              <div className={`video-frame ${activeScene === 4 ? 'active' : ''}`}>
                <div className="mock-video-bg">
                  <div className="mock-sidebar">
                    <span className="sidebar-icon">🌱</span>
                    <span className="sidebar-icon">📁</span>
                    <span className="sidebar-icon active">📝</span>
                  </div>
                  <div className="mock-content" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--status-success-bg)',
                        border: '1.5px solid var(--status-success-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                      }}
                    >
                      <span style={{ color: 'var(--status-success-text)', fontSize: '18px', fontWeight: 700 }}>✓</span>
                    </div>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Proposal Ingested
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '250px' }}>
                      Draft saved in application pipeline under status:{' '}
                      <strong style={{ color: 'var(--status-success-text)' }}>Drafting</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Controls */}
            <div className="video-controls text-mono">
              <button className="play-btn" onClick={toggleSimulatedVideo}>
                {isVideoPlaying ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21"></polygon>
                  </svg>
                )}
              </button>
              <span>{timerText}</span>
              <div className="progress-bar-container" onClick={() => setVideoTimelineSec(0)}>
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <span style={{ color: 'var(--status-success-text)' }}>1080p</span>
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

        {/* INTERACTIVE PLAYGROUND SANDBOX */}
        <section id="playground" className="playground-section">
          <div className="features-header" style={{ textAlign: 'center', marginInline: 'auto' }}>
            <h2>Interactive Sandbox Console</h2>
            <p>Examine the backend code logic by running live simulations inside our custom pipeline sandbox console.</p>
          </div>

          {/* Tab Controls */}
          <div className="tab-nav">
            <button className={`tab-btn ${activeTab === 'ingest' ? 'active' : ''}`} onClick={() => setActiveTab('ingest')}>
              1. Ingestion Pipeline
            </button>
            <button className={`tab-btn ${activeTab === 'match' ? 'active' : ''}`} onClick={() => setActiveTab('match')}>
              2. Two-Pass Matcher
            </button>
            <button className={`tab-btn ${activeTab === 'draft' ? 'active' : ''}`} onClick={() => setActiveTab('draft')}>
              3. AI Proposal Writer
            </button>
          </div>

          {/* TAB 1: INGESTION PIPELINE */}
          {activeTab === 'ingest' && (
            <div className="tab-content active">
              <div className="sandbox-grid">
                <div className="sim-config-panel">
                  <h3>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--status-success-text)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Ingest Webhook Trigger
                  </h3>
                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Trigger the daily webhook scraping pipeline via curl using a secure shared Webhook secret verification check.
                  </p>

                  <div className="form-group">
                    <label>Shared Webhook Secret Header</label>
                    <input
                      type="text"
                      className="form-input text-mono"
                      value="X-Webhook-Secret: test-webhook-secret"
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label>Portals List (8 portals)</label>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      DST, BIRAC, MSJE, Tata Trusts, Ford Foundation, Infosys Foundation, UN Women, UNDP
                    </p>
                  </div>

                  <button className="btn btn-primary" onClick={runIngestSim} disabled={isIngesting}>
                    {isIngesting ? 'Scraping...' : 'Execute Scrape Run'}
                  </button>
                </div>

                <div className="sim-display-panel">
                  <div className="console-header">
                    <div className="console-dots">
                      <span className="console-dot close"></span>
                      <span className="console-dot min"></span>
                      <span className="console-dot max"></span>
                    </div>
                    <span className="console-title text-mono">scraper_manager.log</span>
                  </div>
                  <div className="console-body">
                    {ingestLogs.map((log, idx) => (
                      <span key={idx} className={`console-line ${log.type}`}>
                        {log.text}
                      </span>
                    ))}

                    {showIngestTable && (
                      <div style={{ marginTop: '1rem' }} className="animate-[fadeIn_0.4s_ease]">
                        <div className="console-line success">// SUPABASE DB WRITES COMMITTED:</div>
                        <table className="grant-table">
                          <thead>
                            <tr>
                              <th>Grant Name</th>
                              <th>Funder</th>
                              <th>Budget</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Heritage Research (SHRI)</td>
                              <td>DST</td>
                              <td>₹10L - ₹50L</td>
                              <td>
                                <span className="status-pill active">Ingested</span>
                              </td>
                            </tr>
                            <tr>
                              <td>Social Security Program</td>
                              <td>MSJE</td>
                              <td>₹15L - ₹40L</td>
                              <td>
                                <span className="status-pill active">Ingested</span>
                              </td>
                            </tr>
                            <tr>
                              <td>Vigyan Innovation Support</td>
                              <td>BIRAC</td>
                              <td>₹25L - ₹90L</td>
                              <td>
                                <span className="status-pill active">Ingested</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TWO-PASS MATCHER */}
          {activeTab === 'match' && (
            <div className="tab-content active">
              <div className="sandbox-grid">
                <div className="sim-config-panel">
                  <h3>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--status-success-text)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    Two-Pass Match Engine
                  </h3>
                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Select an NGO profile below to simulate how the statutory filter (Pass 1) and semantic matching
                    (Pass 2) analyze legal items and calculate scores.
                  </p>

                  <div className="form-group">
                    <label>Select NGO Profile</label>
                    <select
                      className="form-select"
                      value={selectedNgoKey}
                      onChange={(e) => {
                        setSelectedNgoKey(e.target.value)
                        setMatchLogs([{ type: 'info', text: '// Configuration updated. Press Run Two-Pass Matcher.' }])
                        setShowMatchResultTable(false)
                      }}
                    >
                      <option value="seva">Seva Foundation (Rural Development NGO)</option>
                      <option value="vigyan">Vigyan Labs (Academic Research & Science Group)</option>
                      <option value="nari">Nari Vikas Trust (Foreign-Funded Advocacy Group)</option>
                    </select>
                  </div>

                  <div className="profile-card">
                    <div className="profile-grid-item">
                      <span>Entity Name:</span>
                      <strong>{NGO_PROFILES[selectedNgoKey].name}</strong>
                    </div>
                    <div className="profile-grid-item">
                      <span>Legal Entity Type:</span>
                      <span>{NGO_PROFILES[selectedNgoKey].legal_entity}</span>
                    </div>
                    <div className="profile-grid-item">
                      <span>Annual Turnover:</span>
                      <span>{NGO_PROFILES[selectedNgoKey].turnover}</span>
                    </div>
                    <div className="profile-grid-item">
                      <span>NGO Darpan ID:</span>
                      <span>{NGO_PROFILES[selectedNgoKey].darpan}</span>
                    </div>
                    <div className="profile-grid-item">
                      <span>12A/80G Certs:</span>
                      <span>{NGO_PROFILES[selectedNgoKey].has_12a_80g}</span>
                    </div>
                    <div className="profile-grid-item">
                      <span>CSR-1 MCA Reg:</span>
                      <span>{NGO_PROFILES[selectedNgoKey].has_csr1}</span>
                    </div>
                    <div className="profile-grid-item">
                      <span>FCRA Status (Foreign):</span>
                      <span>{NGO_PROFILES[selectedNgoKey].has_fcra}</span>
                    </div>
                  </div>

                  <button className="btn btn-primary" onClick={runMatchSim} disabled={isMatching}>
                    {isMatching ? 'Matching...' : 'Run Two-Pass Matcher'}
                  </button>
                </div>

                <div className="sim-display-panel">
                  <div className="console-header">
                    <div className="console-dots">
                      <span className="console-dot close"></span>
                      <span className="console-dot min"></span>
                      <span className="console-dot max"></span>
                    </div>
                    <span className="console-title text-mono">matching_engine.log</span>
                  </div>
                  <div className="console-body">
                    {matchLogs.map((log, idx) => (
                      <span key={idx} className={`console-line ${log.type}`}>
                        {log.text}
                      </span>
                    ))}

                    {showMatchResultTable && (
                      <div className="animate-[fadeIn_0.4s_ease]">
                        {selectedNgoKey === 'seva' && (
                          <table className="grant-table" style={{ marginTop: '1rem' }}>
                            <thead>
                              <tr>
                                <th>Funder</th>
                                <th>Grant Name</th>
                                <th>Pass 1</th>
                                <th>Pass 2 Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ opacity: 0.6 }}>
                                <td>DST</td>
                                <td>Science Initiative</td>
                                <td>
                                  <span className="status-pill filtered">Blocked (Darpan)</span>
                                </td>
                                <td>--</td>
                              </tr>
                              <tr>
                                <td>Tata Trusts</td>
                                <td>Rural Health</td>
                                <td>
                                  <span className="status-pill active">Pass</span>
                                </td>
                                <td>
                                  <strong>86% Good Match</strong>
                                </td>
                              </tr>
                              <tr style={{ opacity: 0.6 }}>
                                <td>Ford Foundation</td>
                                <td>Empowerment</td>
                                <td>
                                  <span className="status-pill filtered">Blocked (FCRA)</span>
                                </td>
                                <td>--</td>
                              </tr>
                            </tbody>
                          </table>
                        )}

                        {selectedNgoKey === 'vigyan' && (
                          <table className="grant-table" style={{ marginTop: '1rem' }}>
                            <thead>
                              <tr>
                                <th>Funder</th>
                                <th>Grant Name</th>
                                <th>Pass 1</th>
                                <th>Pass 2 Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>DST</td>
                                <td>Science Initiative</td>
                                <td>
                                  <span className="status-pill active">Pass</span>
                                </td>
                                <td>
                                  <strong>94% Strong Match</strong>
                                </td>
                              </tr>
                              <tr style={{ opacity: 0.6 }}>
                                <td>Tata Trusts</td>
                                <td>Rural Health</td>
                                <td>
                                  <span className="status-pill filtered">Blocked (CSR-1)</span>
                                </td>
                                <td>--</td>
                              </tr>
                              <tr style={{ opacity: 0.6 }}>
                                <td>Ford Foundation</td>
                                <td>Empowerment</td>
                                <td>
                                  <span className="status-pill filtered">Blocked (FCRA)</span>
                                </td>
                                <td>--</td>
                              </tr>
                            </tbody>
                          </table>
                        )}

                        {selectedNgoKey === 'nari' && (
                          <table className="grant-table" style={{ marginTop: '1rem' }}>
                            <thead>
                              <tr>
                                <th>Funder</th>
                                <th>Grant Name</th>
                                <th>Pass 1</th>
                                <th>Pass 2 Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>DST</td>
                                <td>Science Initiative</td>
                                <td>
                                  <span className="status-pill active">Pass</span>
                                </td>
                                <td>
                                  <strong>62% Partial Match</strong>
                                </td>
                              </tr>
                              <tr>
                                <td>Tata Trusts</td>
                                <td>Rural Health</td>
                                <td>
                                  <span className="status-pill active">Pass</span>
                                </td>
                                <td>
                                  <strong>74% Good Match</strong>
                                </td>
                              </tr>
                              <tr>
                                <td>Ford Foundation</td>
                                <td>Empowerment</td>
                                <td>
                                  <span className="status-pill active">Pass</span>
                                </td>
                                <td>
                                  <strong>91% Strong Match</strong>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI PROPOSAL WRITER */}
          {activeTab === 'draft' && (
            <div className="tab-content active">
              <div className="sandbox-grid">
                <div className="sim-config-panel">
                  <h3>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--status-success-text)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    Generate Proposal Draft
                  </h3>
                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    When a user clicks "Generate", the Python Engine feeds matched past projects and grant guidelines
                    into the LLM chain to write a complete proposal.
                  </p>

                  <div className="form-group">
                    <label>Target Grant</label>
                    <select
                      className="form-select"
                      value={draftGrantKey}
                      onChange={(e) => {
                        setDraftGrantKey(e.target.value)
                        setShowDraftResult(false)
                      }}
                    >
                      <option value="dst">DST Science & Heritage Initiative (₹50L)</option>
                      <option value="tata">Tata Trusts Rural Health Grant (₹25L)</option>
                      <option value="un">UN Women Gender Equality Support ($80K)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>LLM Selection</label>
                    <select className="form-select" value={draftLlmKey} onChange={(e) => setDraftLlmKey(e.target.value)}>
                      <option value="groq">Groq Llama-3.1-8b-instant (Primary - Fast)</option>
                      <option value="gemini">Gemini 2.5 Flash-Lite (Backup on Groq 429)</option>
                    </select>
                  </div>

                  <button className="btn btn-primary" onClick={runDraftSim} disabled={isDrafting}>
                    {isDrafting ? 'Drafting...' : 'Generate Proposal Draft'}
                  </button>
                </div>

                <div className="sim-display-panel">
                  <div className="console-header">
                    <div className="console-dots">
                      <span className="console-dot close"></span>
                      <span className="console-dot min"></span>
                      <span className="console-dot max"></span>
                    </div>
                    <span className="console-title text-mono">draft_proposal.md</span>
                  </div>

                  <div className="proposal-editor">
                    {!isDrafting && !showDraftResult && (
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        // Click "Generate Proposal Draft" to run the LLM compiler and view the structured output.
                      </span>
                    )}

                    {isDrafting && (
                      <div className="sprout-container animate-[fadeIn_0.3s_ease]">
                        <svg
                          className="sprout-animation"
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 22V12"></path>
                          <path d="M12 12C12 7.58172 8.41828 4 4 4"></path>
                          <path d="M12 15C12 11.6863 14.6863 9 18 9"></path>
                        </svg>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{draftLoadingStatus}</div>
                      </div>
                    )}

                    {!isDrafting && showDraftResult && (
                      <div className="animate-[fadeIn_0.5s_ease]">
                        <div
                          style={{
                            backgroundColor: 'rgba(108,193,49,0.06)',
                            border: '1px solid var(--border-color)',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>✦ Compiled from profile + 2 Memory Vault projects</span>
                          <strong style={{ color: 'var(--status-success-text)' }}>
                            Engine: {draftLlmKey === 'groq' ? 'Groq Llama-3.1' : 'Gemini 2.5'}
                          </strong>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '1.25rem' }}>
                          {draftTitle}
                        </h3>
                        {draftContent}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer>
        <div className="max-width-container">
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            🌱 Seedling App Stack - Prepared for HackOrbit '26
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

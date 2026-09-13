import React, { useState } from 'react'
import { SearchBar } from '../components/SearchBar'
import type { RepositoryItem, RepositoryAnalysisResponse } from '../components/SearchBar'
import './HomePage.css'

export const HomePage: React.FC = () => {
  const [selectedRepo, setSelectedRepo] = useState<RepositoryItem | null>({
    id: 'fluxpay-server',
    name: 'FluxPay-server',
    owner: 'GauthamSalian',
    full_name: 'GauthamSalian/FluxPay-server',
    url: 'https://github.com/GauthamSalian/FluxPay-server.git',
    description: 'Scalable payment orchestration and transaction gateway server',
    default_branch: 'main',
    language: 'TypeScript',
    stars: 142,
    forks: 18,
    topics: ['fintech', 'payments', 'orchestrator', 'typescript', 'microservices'],
  })

  const [analysisData, setAnalysisData] = useState<RepositoryAnalysisResponse | null>({
    status: 'success',
    message: 'Dependency tree parsed from repository manifest',
    repo: {
      id: 'fluxpay-server',
      name: 'FluxPay-server',
      owner: 'GauthamSalian',
      full_name: 'GauthamSalian/FluxPay-server',
      url: 'https://github.com/GauthamSalian/FluxPay-server.git',
      description: 'Scalable payment orchestration and transaction gateway server',
      default_branch: 'main',
      language: 'TypeScript',
      stars: 142,
      forks: 18,
      topics: ['fintech', 'payments', 'orchestrator', 'typescript'],
    },
    analysis_id: 'analysis_fluxpay-server_main',
    dependencies: {
      total: 48,
      direct: 14,
      transitive: 34,
      outdated: 6,
      vulnerabilities: 2,
    },
    default_branch: 'main',
    available_branches: ['main', 'dev', 'release-v1.2'],
  })

  const [copiedUrl, setCopiedUrl] = useState(false)

  const handleSelectRepo = (repo: RepositoryItem) => {
    setSelectedRepo(repo)
  }

  const handleAnalysisComplete = (result: RepositoryAnalysisResponse) => {
    setSelectedRepo(result.repo)
    setAnalysisData(result)
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  return (
    <div className="homepage-root">
      {/* Background ambient glow effects */}
      <div className="ambient-glow glow-top" />
      <div className="ambient-glow glow-bottom" />

      {/* Top Navigation */}
      <header className="home-navbar">
        <div className="brand-group">
          <div className="logo-icon-wrap">
            <svg className="logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v18" />
              <path d="M3 12h18" />
              <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.3" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">DepLens</span>
            <span className="brand-tag">Intelligence</span>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="https://github.com/GauthamSalian/DepLens" target="_blank" rel="noreferrer" className="nav-link nav-github">
            <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
        </nav>
      </header>

      {/* Main Hero Section */}
      <main className="home-main">
        <section className="hero-section">
          <div className="badge-pill">
            <span className="badge-dot" />
            <span className="badge-text">DepLens Engine v1.0 • Dependency & Security Radar</span>
          </div>

          <h1 className="hero-heading">
            Inspect, Visualize & Secure <br />
            <span className="gradient-text">Repository Dependencies</span>
          </h1>

          <p className="hero-subtext">
            Gain complete visibility into your software supply chain. Analyze package trees, detect outdated modules, and audit security vulnerabilities directly from GitHub.
          </p>

          {/* Connected Search Bar */}
          <div className="search-section-wrap">
            <SearchBar
              onSelectRepo={handleSelectRepo}
              onAnalyze={handleAnalysisComplete}
            />
          </div>
        </section>

        {/* Selected Repository Card / Live Analysis Overview */}
        {selectedRepo && (
          <section className="repo-showcase-section animate-fade-in">
            <div className="showcase-card">
              <div className="showcase-header">
                <div className="showcase-identity">
                  <div className="repo-avatar-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="repo-brand-icon">
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                      <path d="M9 18c-4.51 2-5-2-7-2" />
                    </svg>
                  </div>
                  <div className="repo-meta-titles">
                    <div className="title-row">
                      <h2 className="selected-repo-title">{selectedRepo.full_name}</h2>
                      {selectedRepo.language && (
                        <span className="pill-language">{selectedRepo.language}</span>
                      )}
                      <span className="pill-status">Active Selection</span>
                    </div>
                    {selectedRepo.description && (
                      <p className="selected-repo-desc">{selectedRepo.description}</p>
                    )}
                  </div>
                </div>

                <div className="showcase-actions">
                  <button
                    type="button"
                    className="copy-url-btn"
                    onClick={() => handleCopyUrl(selectedRepo.url)}
                    title="Copy Git URL"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="action-icon">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>{copiedUrl ? 'Copied!' : 'Copy Clone URL'}</span>
                  </button>
                  <a
                    href={selectedRepo.url.replace(/\.git$/, '')}
                    target="_blank"
                    rel="noreferrer"
                    className="external-link-btn"
                  >
                    <span>View on GitHub</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="action-icon">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Dependency Metrics Summary */}
              {analysisData && (
                <div className="metrics-grid">
                  <div className="metric-box">
                    <span className="metric-label">Total Dependencies</span>
                    <span className="metric-number text-white">{analysisData.dependencies.total}</span>
                    <span className="metric-sub">Direct & transitive</span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-label">Direct Modules</span>
                    <span className="metric-number text-cyan">{analysisData.dependencies.direct}</span>
                    <span className="metric-sub">Declared in manifest</span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-label">Transitive Tree</span>
                    <span className="metric-number text-purple">{analysisData.dependencies.transitive}</span>
                    <span className="metric-sub">Sub-dependencies</span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-label">Outdated Packages</span>
                    <span className="metric-number text-amber">{analysisData.dependencies.outdated}</span>
                    <span className="metric-sub">Updates recommended</span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-label">Security Alerts</span>
                    <span className="metric-number text-rose">{analysisData.dependencies.vulnerabilities}</span>
                    <span className="metric-sub">Audit flags found</span>
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="showcase-footer">
                <div className="branch-selector">
                  <span className="branch-label">Target Branch:</span>
                  <span className="branch-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="branch-icon">
                      <line x1="6" y1="3" x2="6" y2="15" />
                      <circle cx="18" cy="6" r="3" />
                      <circle cx="6" cy="18" r="3" />
                      <path d="M18 9a9 9 0 0 1-9 9" />
                    </svg>
                    {selectedRepo.default_branch || 'main'}
                  </span>
                </div>

                <div className="footer-actions">
                  <button type="button" className="btn-secondary">
                    Export SBOM
                  </button>
                  <button type="button" className="btn-primary">
                    Launch Dependency Graph
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Feature Highlights Grid */}
        <section id="features" className="features-section">
          <div className="feature-card">
            <div className="feature-icon-wrap icon-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M3 12h6m6 0h6M12 3v6m0 6v6" />
              </svg>
            </div>
            <h3 className="feature-title">Dependency Graphing</h3>
            <p className="feature-desc">
              Interactive visual hierarchy of direct and transitive package trees with instant depth filtering.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap icon-rose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <h3 className="feature-title">Security & CVE Audits</h3>
            <p className="feature-desc">
              Automated correlation against national vulnerability databases with remediation and patch recommendations.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap icon-amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </div>
            <h3 className="feature-title">Outdated Version Lens</h3>
            <p className="feature-desc">
              Track major, minor, and patch drifts across dependencies with breaking change impact risk scores.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2026 DepLens. Built for modern software supply chain transparency.</p>
      </footer>
    </div>
  )
}

export default HomePage

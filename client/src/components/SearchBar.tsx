import React, { useState, useEffect, useRef } from 'react'
import './SearchBar.css'

export interface RepositoryItem {
  id: string
  name: string
  owner: string
  full_name: string
  url: string
  description?: string
  default_branch?: string
  language?: string
  stars?: number
  forks?: number
  topics?: string[]
}

export interface DependencySummary {
  total: number
  direct: number
  transitive: number
  outdated: number
  vulnerabilities: number
}

export interface RepositoryAnalysisResponse {
  status: string
  message: string
  repo: RepositoryItem
  analysis_id: string
  dependencies: DependencySummary
  default_branch: string
  available_branches: string[]
}

interface SearchBarProps {
  onSelectRepo?: (repo: RepositoryItem) => void
  onAnalyze?: (result: RepositoryAnalysisResponse) => void
  onError?: (errorMessage: string) => void
  className?: string
}

// Fallback hardcoded list in case backend is unreachable during initial load
const FALLBACK_REPOSITORIES: RepositoryItem[] = [
  {
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
]

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectRepo,
  onAnalyze,
  onError,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<RepositoryItem[]>(FALLBACK_REPOSITORIES)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [apiError, setApiError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch repositories from get_all_repositories API endpoint
  const fetchRepositories = async (query: string = '') => {
    setIsLoadingSuggestions(true)
    setApiError(null)
    try {
      const url = query.trim()
        ? `/api/repositories?q=${encodeURIComponent(query.trim())}`
        : '/api/repositories'

      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`)
      }
      const data: RepositoryItem[] = await res.json()
      setSuggestions(data.length > 0 ? data : [])
    } catch (err) {
      console.warn('Could not fetch from backend API, using local fallback:', err)
      // Filter fallback repositories locally
      if (!query.trim()) {
        setSuggestions(FALLBACK_REPOSITORIES)
      } else {
        const q = query.toLowerCase()
        const filtered = FALLBACK_REPOSITORIES.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.full_name.toLowerCase().includes(q) ||
            r.url.toLowerCase().includes(q) ||
            (r.description && r.description.toLowerCase().includes(q)),
        )
        setSuggestions(filtered)
      }
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  // Sync initial repositories from API in background on mount
  useEffect(() => {
    let isCancelled = false
    const syncInitialRepos = async () => {
      try {
        const res = await fetch('/api/repositories')
        if (res.ok) {
          const data = await res.json()
          if (!isCancelled && Array.isArray(data) && data.length > 0) {
            setSuggestions(data)
          }
        }
      } catch {
        // Fallback already pre-populated
      }
    }
    syncInitialRepos()
    return () => {
      isCancelled = true
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsOpen(true)
    setSelectedIndex(-1)
    fetchRepositories(value)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    fetchRepositories(searchTerm)
  }

  // Trigger analysis API call
  const triggerAnalyze = async (repoUrl: string) => {
    const targetUrl = repoUrl.trim()
    if (!targetUrl) return

    setIsAnalyzing(true)
    setApiError(null)
    setIsOpen(false)

    try {
      const res = await fetch('/api/repositories/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repo_url: targetUrl }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `Analysis failed with status ${res.status}`)
      }

      const data: RepositoryAnalysisResponse = await res.json()
      if (onSelectRepo) onSelectRepo(data.repo)
      if (onAnalyze) onAnalyze(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze repository'
      setApiError(msg)
      if (onError) onError(msg)

      // Graceful fallback response when backend is offline
      const matchedFallback = FALLBACK_REPOSITORIES.find(
        (r) => r.url.toLowerCase() === targetUrl.toLowerCase() || r.full_name.toLowerCase() === targetUrl.toLowerCase()
      )
      const fallbackRepo: RepositoryItem = matchedFallback || {
        id: 'custom-repo',
        name: targetUrl.split('/').pop()?.replace('.git', '') || 'repository',
        owner: 'github',
        full_name: targetUrl.replace('https://github.com/', '').replace('.git', ''),
        url: targetUrl,
        description: 'Target GitHub Repository for DepLens analysis',
        default_branch: 'main',
        language: 'TypeScript',
      }

      const fallbackAnalysis: RepositoryAnalysisResponse = {
        status: 'simulated',
        message: `Offline mode: Analyzed ${fallbackRepo.full_name}`,
        repo: fallbackRepo,
        analysis_id: `analysis_${fallbackRepo.id}_main`,
        dependencies: {
          total: 48,
          direct: 14,
          transitive: 34,
          outdated: 6,
          vulnerabilities: 2,
        },
        default_branch: 'main',
        available_branches: ['main', 'dev', 'v1.0.0'],
      }

      if (onSelectRepo) onSelectRepo(fallbackRepo)
      if (onAnalyze) onAnalyze(fallbackAnalysis)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSelectSuggestion = (repo: RepositoryItem) => {
    setSearchTerm(repo.url)
    setIsOpen(false)
    if (onSelectRepo) onSelectRepo(repo)
    triggerAnalyze(repo.url)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex])
      } else if (searchTerm.trim()) {
        triggerAnalyze(searchTerm.trim())
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setSearchTerm('')
    setIsOpen(false)
    setSelectedIndex(-1)
    fetchRepositories('')
    if (inputRef.current) inputRef.current.focus()
  }

  const isCustomUrl =
    searchTerm.trim() &&
    !suggestions.some(
      (s) => s.url.toLowerCase() === searchTerm.trim().toLowerCase() || s.full_name.toLowerCase() === searchTerm.trim().toLowerCase()
    )

  return (
    <div className={`search-bar-container ${className}`} ref={containerRef}>
      {/* Search Input Bar */}
      <div className={`search-bar-wrapper ${isOpen ? 'is-focused' : ''} ${isAnalyzing ? 'is-loading' : ''}`}>
        <div className="search-icon-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search repository or paste GitHub URL (e.g. https://github.com/...)"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck="false"
        />

        {searchTerm && !isAnalyzing && (
          <button
            type="button"
            className="clear-button"
            onClick={handleClear}
            title="Clear search"
            aria-label="Clear input"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <button
          type="button"
          className="analyze-button"
          onClick={() => triggerAnalyze(searchTerm || 'https://github.com/GauthamSalian/FluxPay-server.git')}
          disabled={isAnalyzing || (!searchTerm.trim() && suggestions.length === 0)}
        >
          {isAnalyzing ? (
            <>
              <span className="spinner" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <svg className="analyze-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <span>Analyze</span>
            </>
          )}
        </button>
      </div>

      {/* Suggested & Filtered Dropdown */}
      {isOpen && (
        <div className="search-dropdown animate-fade-in">
          <div className="dropdown-header">
            <div className="dropdown-title">
              <svg className="git-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="18" r="3" />
                <circle cx="6" cy="6" r="3" />
                <path d="M13 6h3a2 2 0 0 1 2 2v7" />
                <line x1="6" y1="9" x2="6" y2="21" />
              </svg>
              <span>{searchTerm.trim() ? 'Matching Repositories' : 'Available Repositories (from API)'}</span>
            </div>
            {isLoadingSuggestions && <span className="dropdown-loading-tag">Updating...</span>}
          </div>

          <div className="dropdown-list">
            {suggestions.map((repo, idx) => (
              <div
                key={repo.id || repo.url}
                className={`dropdown-item ${selectedIndex === idx ? 'is-selected' : ''}`}
                onClick={() => handleSelectSuggestion(repo)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="item-icon-container">
                  <svg className="repo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>

                <div className="item-content">
                  <div className="item-heading">
                    <span className="repo-full-name">{repo.full_name}</span>
                    {repo.language && <span className="language-badge">{repo.language}</span>}
                    {repo.stars !== undefined && repo.stars > 0 && (
                      <span className="stars-badge">★ {repo.stars}</span>
                    )}
                  </div>
                  {repo.description && <p className="item-desc">{repo.description}</p>}
                  <span className="item-url">{repo.url}</span>
                </div>

                <div className="item-action">
                  <span className="select-hint">Enter ↵</span>
                </div>
              </div>
            ))}

            {isCustomUrl && (
              <div
                className="dropdown-item custom-url-item"
                onClick={() => triggerAnalyze(searchTerm.trim())}
              >
                <div className="item-icon-container custom-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="item-content">
                  <div className="item-heading">
                    <span className="repo-full-name">Scan Custom Repository</span>
                    <span className="custom-badge">Direct URL</span>
                  </div>
                  <p className="item-desc">Analyze dependencies for: <code className="url-code">{searchTerm}</code></p>
                </div>
                <div className="item-action">
                  <span className="select-hint">Press Enter ↵</span>
                </div>
              </div>
            )}

            {suggestions.length === 0 && !isCustomUrl && (
              <div className="dropdown-empty">
                <p>No matching repositories found in database.</p>
                <span className="empty-hint">Type full GitHub repository URL and press Enter.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Pick Chips */}
      <div className="quick-picks">
        <span className="quick-pick-label">Quick Pick:</span>
        <button
          type="button"
          className="quick-pick-chip"
          onClick={() => {
            const fluxPay = suggestions.find((s) => s.id === 'fluxpay-server') || FALLBACK_REPOSITORIES[0]
            handleSelectSuggestion(fluxPay)
          }}
        >
          <svg className="chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span className="chip-title">GauthamSalian/FluxPay-server</span>
          <span className="chip-tag">TypeScript</span>
        </button>
      </div>

      {apiError && (
        <div className="api-notice">
          <svg className="notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Note: {apiError}. Simulated results are displayed.</span>
        </div>
      )}
    </div>
  )
}

export default SearchBar

import React, { useState, useEffect, useRef, useMemo } from 'react'
import './DependencyGraphDrawer.css'

export interface BlastRadiusDetail {
  affected_dependencies: number
  total_dependencies: number
  dependency_impact: number
  affected_modules: number
  total_modules: number
  module_impact: number
  propagation_depth: number
  max_graph_depth: number
  depth_ratio: number
  blast_radius_score: number
  affected_nodes: string[]
}

export interface RemediationOption {
  action: string
  target_version?: string
  description: string
  residual_risk: number
  risk_reduction_percent: number
  estimated_effort_hours: number
  estimated_cost_inr: number
  recommended: boolean
  details?: Record<string, unknown>
}

export interface FunctionUsage {
  name: string
  type: string
  line_start: number
  line_end: number
  snippet: string
  imported_symbols_used: string[]
}

export interface ImportUsage {
  statement: string
  line: number
  symbols: string[]
}

export interface FileUsage {
  file_path: string
  imports: ImportUsage[]
  functions: FunctionUsage[]
  total_usages_count: number
}

export interface VulnerabilityDetail {
  id: string
  summary: string
  details?: string
  cvss: number
  severity_score: number
  affected_package: string
  affected_version_range: string
  fixed_version?: string
  references?: string[]
}

export interface PackageUsageDetail {
  package: string
  version: string
  vulnerable: boolean
  severity_score: number
  total_occurrences: number
  affected_files_count: number
  vulnerabilities?: VulnerabilityDetail[]
  files: FileUsage[]
}

export interface UsagesResponse {
  status: string
  repository: string
  timestamp: string
  from_cache: boolean
  total_vulnerable_packages: number
  total_affected_files: number
  usages: Record<string, PackageUsageDetail>
}

export interface GraphNode {
  id: string
  name: string
  version: string
  ecosystem: string
  type: string
  direct: boolean
  dev: boolean
  vulnerable: boolean
  cvss?: number
  severity: number
  dependents: number
  dependencies: number
  centrality: number
  code_usage: number
  affected_files_count: number
  affected_files: string[]
  blast_radius: number
  blast_radius_detail?: BlastRadiusDetail
  risk_score: number
  risk_level: string
  vulnerabilities?: VulnerabilityDetail[]
  remediation_options?: RemediationOption[]
  recommended_action?: string
  x?: number
  y?: number
  vx?: number
  vy?: number
}

export interface GraphEdge {
  source: string
  target: string
  relation: string
  propagation_strength?: number
}

export interface GraphSummary {
  total_nodes: number
  direct_nodes: number
  transitive_nodes: number
  total_edges: number
  vulnerable_nodes_count: number
  average_risk_score: number
  max_risk_score: number
  max_depth: number
}

export interface GraphData {
  status: string
  analysis_id: string
  summary: GraphSummary
  nodes: GraphNode[]
  edges: GraphEdge[]
  vulnerabilities?: VulnerabilityDetail[]
}

interface DependencyGraphDrawerProps {
  isOpen: boolean
  onClose: () => void
  repoUrl?: string
  repoName?: string
}

export const DependencyGraphDrawer: React.FC<DependencyGraphDrawerProps> = ({
  isOpen,
  onClose,
  repoUrl = 'https://github.com/GauthamSalian/FluxPay-server.git',
  repoName = 'GauthamSalian/FluxPay-server',
}) => {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [usagesData, setUsagesData] = useState<UsagesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'metrics' | 'usages' | 'vulnerabilities'>('metrics')
  const [filterMode, setFilterMode] = useState<'all' | 'vulnerable' | 'direct' | 'high_risk'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightBlastRadius, setHighlightBlastRadius] = useState(true)
  const [activeMetricHelp, setActiveMetricHelp] = useState<string | null>(null)
  const [showAllFormulasModal, setShowAllFormulasModal] = useState<boolean>(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleMetricHelp = (metricKey: string) => {
    setActiveMetricHelp((prev) => (prev === metricKey ? null : metricKey))
  }

  const svgRef = useRef<SVGSVGElement>(null)

  // Fetch complete graph analysis & code usages from backend APIs
  useEffect(() => {
    if (!isOpen) return

    let isCancelled = false
    const loadAll = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [graphRes, usagesRes] = await Promise.all([
          fetch(`/api/analysis/graph?repo_url=${encodeURIComponent(repoUrl)}`),
          fetch(`/api/usages?repo_url=${encodeURIComponent(repoUrl)}`),
        ])

        if (!graphRes.ok) throw new Error(`Graph API returned status ${graphRes.status}`)
        const gData: GraphData = await graphRes.json()

        let uData: UsagesResponse | null = null
        if (usagesRes.ok) {
          uData = await usagesRes.json()
        }

        if (!isCancelled) {
          setGraphData(gData)
          setUsagesData(uData)
          const defaultSelect = gData.nodes.find((n) => n.vulnerable) || gData.nodes[0]
          if (defaultSelect) {
            setSelectedNodeId(defaultSelect.id)
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load graph analysis')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadAll()
    return () => {
      isCancelled = true
    }
  }, [isOpen, repoUrl])

  // Compute 2D node layout positions
  const layoutNodes = useMemo(() => {
    if (!graphData) return []

    const nodes = [...graphData.nodes]
    const directNodes = nodes.filter((n) => n.direct)
    const transitiveNodes = nodes.filter((n) => !n.direct)

    const width = 1100
    const height = 750
    const centerX = width / 2
    const centerY = height / 2

    // Direct nodes in an inner circle
    const directRadius = 220
    directNodes.forEach((node, i) => {
      const angle = (i / Math.max(directNodes.length, 1)) * 2 * Math.PI - Math.PI / 2
      node.x = centerX + directRadius * Math.cos(angle)
      node.y = centerY + directRadius * Math.sin(angle) * 0.85
    })

    // Transitive nodes in an outer ring
    const transitiveRadius = 380
    transitiveNodes.forEach((node, i) => {
      const angle = (i / Math.max(transitiveNodes.length, 1)) * 2 * Math.PI - Math.PI / 2
      const r = transitiveRadius + (i % 3 === 0 ? 30 : i % 3 === 1 ? -25 : 0)
      node.x = centerX + r * Math.cos(angle)
      node.y = centerY + r * Math.sin(angle) * 0.88
    })

    return nodes
  }, [graphData])

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>()
    layoutNodes.forEach((n) => map.set(n.id, n))
    return map
  }, [layoutNodes])

  // Filter visible nodes based on filterMode & search
  const visibleNodeIds = useMemo(() => {
    if (!graphData) return new Set<string>()

    return new Set(
      graphData.nodes
        .filter((n) => {
          if (searchQuery.trim() && !n.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false
          }
          if (filterMode === 'vulnerable') return n.vulnerable
          if (filterMode === 'direct') return n.direct
          if (filterMode === 'high_risk') return n.risk_score >= 50
          return true
        })
        .map((n) => n.id)
    )
  }, [graphData, filterMode, searchQuery])

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    return nodeMap.get(selectedNodeId) || null
  }, [selectedNodeId, nodeMap])

  // Get AST code usage details for selected package
  const selectedNodeUsages = useMemo(() => {
    if (!selectedNode || !usagesData) return null
    const clean = selectedNode.name.toLowerCase().split('[')[0]
    return usagesData.usages[clean] || null
  }, [selectedNode, usagesData])

  // Compute blast radius affected set for currently selected node
  const blastRadiusAffectedSet = useMemo(() => {
    if (!selectedNode || !highlightBlastRadius) return new Set<string>()
    const set = new Set<string>([selectedNode.id])
    if (selectedNode.blast_radius_detail?.affected_nodes) {
      selectedNode.blast_radius_detail.affected_nodes.forEach((id) => set.add(id))
    }
    return set
  }, [selectedNode, highlightBlastRadius])

  // Pan and drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.4), 2.5))
  }

  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  if (!isOpen) return null

  return (
    <div className={`graph-drawer-overlay ${isFullscreen ? 'is-fullscreen' : ''}`}>
      <div className="graph-drawer-backdrop" onClick={onClose} />

      <div className="graph-drawer-container">
        {/* Top Action Header */}
        <div className="drawer-header">
          <div className="header-identity">
            <div className="drawer-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M3 12h6m6 0h6M12 3v6m0 6v6" />
              </svg>
            </div>
            <div>
              <div className="header-title-row">
                <h2 className="drawer-title">Dependency Architecture & Blast Radius Lens</h2>
                <span className="repo-pill">{repoName}</span>
                {graphData?.summary && (
                  <span className="nodes-count-pill">
                    {graphData.summary.total_nodes} Nodes • {graphData.summary.total_edges} Edges
                  </span>
                )}
                {usagesData && (
                  <span className="cache-pill">
                    {usagesData.from_cache ? '⚡ Cached Usages' : '🔍 AST Parsed'}
                  </span>
                )}
              </div>
              <p className="drawer-sub">
                Interactive betweenness centrality, blast radius propagation, code usage, and residual risk engine.
              </p>
            </div>
          </div>

          <div className="header-controls">
            <button
              type="button"
              className="ctrl-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isFullscreen ? (
                  <>
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                ) : (
                  <>
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                )}
              </svg>
            </button>

            <button type="button" className="close-btn" onClick={onClose} title="Close Drawer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="drawer-toolbar">
          <div className="filter-group">
            <span className="filter-label">Filter:</span>
            <button
              type="button"
              className={`filter-chip ${filterMode === 'all' ? 'is-active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              All Packages ({graphData?.summary.total_nodes || 0})
            </button>
            <button
              type="button"
              className={`filter-chip chip-vuln ${filterMode === 'vulnerable' ? 'is-active' : ''}`}
              onClick={() => setFilterMode('vulnerable')}
            >
              <span className="dot-red" />
              Vulnerabilities ({graphData?.summary.vulnerable_nodes_count || 0})
            </button>
            <button
              type="button"
              className={`filter-chip ${filterMode === 'direct' ? 'is-active' : ''}`}
              onClick={() => setFilterMode('direct')}
            >
              Direct ({graphData?.summary.direct_nodes || 0})
            </button>
            <button
              type="button"
              className={`filter-chip chip-high ${filterMode === 'high_risk' ? 'is-active' : ''}`}
              onClick={() => setFilterMode('high_risk')}
            >
              High/Critical Risk
            </button>
          </div>

          <div className="search-and-toggles">
            <div className="graph-search-wrap">
              <svg className="graph-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Find package in graph..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="graph-search-input"
              />
              {searchQuery && (
                <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>
                  ×
                </button>
              )}
            </div>

            <label className="blast-toggle-label" title="Highlight reverse propagation paths for selected node">
              <input
                type="checkbox"
                checked={highlightBlastRadius}
                onChange={(e) => setHighlightBlastRadius(e.target.checked)}
              />
              <span>Blast Radius Highlighting</span>
            </label>
          </div>
        </div>

        {/* Main Canvas & Inspector View */}
        <div className="drawer-main">
          {/* Graph Visual Canvas */}
          <div
            className="graph-canvas-area"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {isLoading ? (
              <div className="graph-loading">
                <div className="graph-spinner" />
                <p>Computing dependency graph topology, centrality & blast radius...</p>
              </div>
            ) : error ? (
              <div className="graph-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>{error}</p>
                <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            ) : (
              <svg
                ref={svgRef}
                className="graph-svg"
                viewBox="0 0 1100 750"
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    viewBox="0 0 10 10"
                    refX="16"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#cbd5e1" />
                  </marker>
                  <marker
                    id="arrowhead-highlight"
                    viewBox="0 0 10 10"
                    refX="16"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                  </marker>
                </defs>

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Edges */}
                  {graphData?.edges.map((edge, idx) => {
                    const sourceNode = nodeMap.get(edge.source)
                    const targetNode = nodeMap.get(edge.target)
                    if (!sourceNode || !targetNode) return null

                    const isHighlighted =
                      highlightBlastRadius &&
                      blastRadiusAffectedSet.has(edge.source) &&
                      blastRadiusAffectedSet.has(edge.target)

                    const isDimmed =
                      (highlightBlastRadius && blastRadiusAffectedSet.size > 1 && !isHighlighted) ||
                      (!visibleNodeIds.has(edge.source) && !visibleNodeIds.has(edge.target))

                    return (
                      <line
                        key={`edge-${idx}-${edge.source}-${edge.target}`}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={isHighlighted ? '#f43f5e' : '#cbd5e1'}
                        strokeWidth={isHighlighted ? 2.5 : 1.2}
                        strokeDasharray={isHighlighted ? '4,4' : undefined}
                        opacity={isDimmed ? 0.15 : isHighlighted ? 1 : 0.6}
                        markerEnd={isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                        className={isHighlighted ? 'edge-pulse' : ''}
                      />
                    )
                  })}

                  {/* Nodes */}
                  {layoutNodes.map((node) => {
                    const isSelected = selectedNodeId === node.id
                    const isBlastAffected = highlightBlastRadius && blastRadiusAffectedSet.has(node.id)
                    const isVisible = visibleNodeIds.has(node.id)

                    let nodeFill = '#ffffff'
                    let nodeStroke = '#cbd5e1'

                    if (node.vulnerable) {
                      nodeFill = '#ffe4e6'
                      nodeStroke = '#f43f5e'
                    } else if (node.risk_score >= 50) {
                      nodeFill = '#fef3c7'
                      nodeStroke = '#f59e0b'
                    } else if (node.direct) {
                      nodeFill = '#ede9fe'
                      nodeStroke = '#7c3aed'
                    }

                    if (isSelected) {
                      nodeStroke = '#7c3aed'
                    }

                    const opacity = !isVisible
                      ? 0.2
                      : highlightBlastRadius && blastRadiusAffectedSet.size > 1 && !isBlastAffected
                      ? 0.3
                      : 1

                    return (
                      <g
                        key={`node-${node.id}`}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`graph-node-group ${isSelected ? 'is-selected' : ''}`}
                        style={{ cursor: 'pointer', opacity }}
                      >
                        {/* Glow halo */}
                        {(isSelected || (node.vulnerable && highlightBlastRadius)) && (
                          <circle
                            r="28"
                            fill="none"
                            stroke={node.vulnerable ? '#f43f5e' : '#7c3aed'}
                            strokeWidth="2"
                            strokeDasharray="4,4"
                            className="halo-pulse"
                          />
                        )}

                        {/* Node circle */}
                        <circle
                          r={node.direct ? 18 : 14}
                          fill={nodeFill}
                          stroke={nodeStroke}
                          strokeWidth={isSelected ? 3 : 2}
                        />

                        {/* Node Center Icon */}
                        {node.vulnerable ? (
                          <text
                            textAnchor="middle"
                            dy="4"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#e11d48"
                          >
                            !
                          </text>
                        ) : (
                          <circle r="3" fill={node.direct ? '#7c3aed' : '#94a3b8'} />
                        )}

                        {/* Label */}
                        <text
                          y={node.direct ? 30 : 26}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight={isSelected || node.direct ? '700' : '500'}
                          fill={isSelected ? '#0f172a' : node.vulnerable ? '#e11d48' : '#334155'}
                          className="node-label-text"
                        >
                          {node.name}
                        </text>

                        <text
                          y={node.direct ? 42 : 38}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#64748b"
                          fontFamily="var(--mono, monospace)"
                        >
                          v{node.version}
                        </text>
                      </g>
                    )
                  })}
                </g>
              </svg>
            )}

            {/* Canvas Zoom Controls */}
            <div className="canvas-zoom-toolbar">
              <button type="button" onClick={() => handleZoom(0.2)} title="Zoom In">
                +
              </button>
              <button type="button" onClick={() => handleZoom(-0.2)} title="Zoom Out">
                -
              </button>
              <button type="button" onClick={handleResetView} title="Reset View">
                ↺
              </button>
            </div>

            {/* Canvas Legend */}
            <div className="canvas-legend">
              <div className="legend-item">
                <span className="legend-dot dot-vuln" />
                <span>Vulnerable (OSV/NVD)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-direct" />
                <span>Direct Package</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-transitive" />
                <span>Transitive Node</span>
              </div>
              <div className="legend-item">
                <span className="legend-line" />
                <span>Dependency Link</span>
              </div>
            </div>
          </div>

          {/* Node Analytics Inspector Sidebar */}
          <aside className="node-inspector-sidebar">
            {selectedNode ? (
              <div className="inspector-content">
                {/* Node Identity Card */}
                <div className="inspector-card node-header-card">
                  <div className="inspector-title-row">
                    <div>
                      <span className="inspector-type-tag">
                        {selectedNode.direct ? 'Direct Dependency' : 'Transitive Dependency'}
                      </span>
                      <h3 className="inspector-node-name">{selectedNode.name}</h3>
                      <span className="inspector-version-badge">v{selectedNode.version}</span>
                    </div>

                    <div className="risk-score-badge-wrap">
                      <div className="risk-score-head-row">
                        <div className={`risk-score-circle risk-${selectedNode.risk_level.toLowerCase()}`}>
                          <span className="risk-num">{selectedNode.risk_score}</span>
                          <span className="risk-scale">/100</span>
                        </div>
                        <button
                          type="button"
                          className={`q-icon-btn ${activeMetricHelp === 'risk' ? 'is-active' : ''}`}
                          onClick={() => toggleMetricHelp('risk')}
                          title="How is Risk Score calculated?"
                        >
                          ?
                        </button>
                      </div>
                      <span className="risk-category-label">{selectedNode.risk_level} Risk</span>
                    </div>
                  </div>

                  {/* Inline Risk Help */}
                  {activeMetricHelp === 'risk' && (
                    <div className="metric-inline-help-box animate-fade-in">
                      <div className="help-box-head">
                        <span className="help-title">Composite Risk Score Calculation</span>
                        <button type="button" className="help-close-btn" onClick={() => setActiveMetricHelp(null)}>×</button>
                      </div>
                      <div className="help-formula-pill">
                        Risk = 35%×Severity + 30%×BlastRadius + 20%×Centrality + 15%×CodeUsage
                      </div>
                      <p className="help-desc">
                        Combines active CVE vulnerability severity (CVSS×10), cascading impact across downstream packages, betweenness centrality in the graph, and direct usage across repository source files.
                      </p>
                      <div className="help-scale-grid">
                        <span className="scale-pill scale-low">0–29: Low</span>
                        <span className="scale-pill scale-mod">30–49: Moderate</span>
                        <span className="scale-pill scale-high">50–69: High</span>
                        <span className="scale-pill scale-crit">70–84: Critical</span>
                        <span className="scale-pill scale-sev">85–100: Severe</span>
                      </div>
                    </div>
                  )}

                  {/* Vulnerability Banner */}
                  {selectedNode.vulnerable && (
                    <div className="vulnerability-banner animate-fade-in">
                      <div className="vuln-head">
                        <div className="vuln-head-left">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="vuln-icon">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M12 8v4" />
                            <path d="M12 16h.01" />
                          </svg>
                          <span className="vuln-title">
                            {selectedNode.vulnerabilities && selectedNode.vulnerabilities.length > 0
                              ? selectedNode.vulnerabilities[0].id
                              : 'Active CVE Identified'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="vuln-tab-switch-btn"
                          onClick={() => setActiveTab('vulnerabilities')}
                        >
                          View Details →
                        </button>
                      </div>
                      <div className="vuln-details-grid">
                        <div>
                          <span className="v-label">CVSS Base:</span>
                          <span className="v-val">{selectedNode.cvss || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="v-label">Severity Score (CVSS×10):</span>
                          <span className="v-val highlight-red">{selectedNode.severity}/100</span>
                        </div>
                      </div>
                      {selectedNode.vulnerabilities && selectedNode.vulnerabilities[0]?.summary && (
                        <p className="vuln-quick-summary">{selectedNode.vulnerabilities[0].summary}</p>
                      )}
                    </div>
                  )}

                  {/* Inspector View Tabs */}
                  <div className="inspector-tabs-nav">
                    <button
                      type="button"
                      className={`tab-btn ${activeTab === 'metrics' ? 'is-active' : ''}`}
                      onClick={() => setActiveTab('metrics')}
                    >
                      Metrics & Risk
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${activeTab === 'usages' ? 'is-active' : ''}`}
                      onClick={() => setActiveTab('usages')}
                    >
                      AST Usages ({selectedNodeUsages?.total_occurrences || selectedNode.affected_files_count || 0})
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${activeTab === 'vulnerabilities' ? 'is-active' : ''} ${selectedNode.vulnerable ? 'tab-btn-alert' : ''}`}
                      onClick={() => setActiveTab('vulnerabilities')}
                    >
                      Vulnerabilities {selectedNode.vulnerabilities && selectedNode.vulnerabilities.length > 0 ? `(${selectedNode.vulnerabilities.length})` : selectedNode.vulnerable ? '(1)' : ''}
                    </button>
                  </div>
                </div>

                {activeTab === 'metrics' ? (
                  <>
                    {/* Mathematical Analytics Breakdown Grid */}
                    <div className="inspector-card">
                      <div className="card-head-with-action">
                        <h4 className="card-section-title">DepLens Metrics & Graph Analytics</h4>
                        <button
                          type="button"
                          className="metric-help-trigger-btn"
                          onClick={() => setShowAllFormulasModal(true)}
                          title="Learn how all DepLens metrics are mathematically calculated"
                        >
                          <span className="q-mark-circle">?</span>
                          <span className="q-mark-text">How it's calculated</span>
                        </button>
                      </div>

                      <div className="metrics-bars-list">
                        {/* 1. Betweenness Centrality */}
                        <div className="metric-bar-item">
                          <div className="metric-bar-head">
                            <div className="metric-title-with-q">
                              <span className="m-title">Betweenness Centrality (C_B)</span>
                              <button
                                type="button"
                                className={`q-icon-btn ${activeMetricHelp === 'centrality' ? 'is-active' : ''}`}
                                onClick={() => toggleMetricHelp('centrality')}
                                title="How is Betweenness Centrality calculated?"
                              >
                                ?
                              </button>
                            </div>
                            <span className="m-score text-purple">{selectedNode.centrality}/100</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill fill-purple" style={{ width: `${selectedNode.centrality}%` }} />
                          </div>
                          <span className="m-hint">NetworkX normalized shortest path bridge index</span>

                          {activeMetricHelp === 'centrality' && (
                            <div className="metric-inline-help-box animate-fade-in">
                              <div className="help-box-head">
                                <span className="help-title">Betweenness Centrality C_B(v)</span>
                                <button type="button" className="help-close-btn" onClick={() => setActiveMetricHelp(null)}>×</button>
                              </div>
                              <div className="help-formula-pill">
                                C_B(v) = ∑ [σ_st(v) / σ_st] × 100
                              </div>
                              <p className="help-desc">
                                Measures how often this package acts as a critical bridge on the shortest dependency path between all other package pairs (s, t). High centrality modules are architectural choke points.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 2. Code Usage Score */}
                        <div className="metric-bar-item">
                          <div className="metric-bar-head">
                            <div className="metric-title-with-q">
                              <span className="m-title">Code Usage Score</span>
                              <button
                                type="button"
                                className={`q-icon-btn ${activeMetricHelp === 'usage' ? 'is-active' : ''}`}
                                onClick={() => toggleMetricHelp('usage')}
                                title="How is Code Usage Score calculated?"
                              >
                                ?
                              </button>
                            </div>
                            <span className="m-score text-cyan">{selectedNode.code_usage}/100</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill fill-cyan" style={{ width: `${selectedNode.code_usage}%` }} />
                          </div>
                          <div className="m-hint-row">
                            <span>Referenced in {selectedNode.affected_files_count} project files</span>
                            {selectedNode.affected_files_count > 0 && (
                              <button
                                type="button"
                                className="view-usages-link-btn"
                                onClick={() => setActiveTab('usages')}
                              >
                                View Usages →
                              </button>
                            )}
                          </div>

                          {activeMetricHelp === 'usage' && (
                            <div className="metric-inline-help-box animate-fade-in">
                              <div className="help-box-head">
                                <span className="help-title">Code Usage Scoring Buckets</span>
                                <button type="button" className="help-close-btn" onClick={() => setActiveMetricHelp(null)}>×</button>
                              </div>
                              <p className="help-desc">
                                Abstract Syntax Tree (AST) scanner parses all Python files in the repository to measure real code imports and function calls:
                              </p>
                              <div className="help-buckets-grid">
                                <div className="bucket-item"><span className="b-files">0 files:</span> <strong>10</strong> (transitive/not called)</div>
                                <div className="bucket-item"><span className="b-files">1–2 files:</span> <strong>30</strong> (isolated)</div>
                                <div className="bucket-item"><span className="b-files">3–5 files:</span> <strong>60</strong> (moderate)</div>
                                <div className="bucket-item"><span className="b-files">6–10 files:</span> <strong>80</strong> (wide usage)</div>
                                <div className="bucket-item"><span className="b-files">&gt;10 files:</span> <strong>100</strong> (core framework)</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. Blast Radius */}
                        <div className="metric-bar-item">
                          <div className="metric-bar-head">
                            <div className="metric-title-with-q">
                              <span className="m-title">Blast Radius (BR = 50%D + 30%M + 20%P)</span>
                              <button
                                type="button"
                                className={`q-icon-btn ${activeMetricHelp === 'blast' ? 'is-active' : ''}`}
                                onClick={() => toggleMetricHelp('blast')}
                                title="How is Blast Radius calculated?"
                              >
                                ?
                              </button>
                            </div>
                            <span className="m-score text-rose">{selectedNode.blast_radius}/100</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill fill-rose" style={{ width: `${selectedNode.blast_radius}%` }} />
                          </div>
                          {selectedNode.blast_radius_detail && (
                            <div className="blast-breakdown-box">
                              <div>
                                <span className="b-label">Dep Impact (D):</span>
                                <span className="b-val">{selectedNode.blast_radius_detail.dependency_impact}%</span>
                              </div>
                              <div>
                                <span className="b-label">Module Impact (M):</span>
                                <span className="b-val">{selectedNode.blast_radius_detail.module_impact}%</span>
                              </div>
                              <div>
                                <span className="b-label">Depth (P):</span>
                                <span className="b-val">{selectedNode.blast_radius_detail.depth_ratio}%</span>
                              </div>
                            </div>
                          )}

                          {activeMetricHelp === 'blast' && (
                            <div className="metric-inline-help-box animate-fade-in">
                              <div className="help-box-head">
                                <span className="help-title">Cascading Blast Radius (BR)</span>
                                <button type="button" className="help-close-btn" onClick={() => setActiveMetricHelp(null)}>×</button>
                              </div>
                              <div className="help-formula-pill">
                                BR = 50%×D + 30%×M + 20%×P
                              </div>
                              <div className="help-params-list">
                                <div><strong>D (Dependency Impact):</strong> ({selectedNode.blast_radius_detail?.affected_dependencies || 0} / {selectedNode.blast_radius_detail?.total_dependencies || 1}) × 100</div>
                                <div><strong>M (Module Impact):</strong> ({selectedNode.blast_radius_detail?.affected_modules || 0} / {selectedNode.blast_radius_detail?.total_modules || 12}) × 100</div>
                                <div><strong>P (Depth Ratio):</strong> (Depth {selectedNode.blast_radius_detail?.propagation_depth || 1} / Max {selectedNode.blast_radius_detail?.max_graph_depth || 4}) × 100</div>
                              </div>
                              <p className="help-desc">
                                Reverse Breadth-First Search (BFS) measures downstream propagation reach across the tree if this package is compromised.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Graph Topology Summary */}
                    <div className="inspector-card">
                      <h4 className="card-section-title">Graph Topology</h4>
                      <div className="topology-stats-grid">
                        <div className="stat-pill">
                          <span className="s-label">Dependents (In-Degree)</span>
                          <span className="s-val">{selectedNode.dependents}</span>
                        </div>
                        <div className="stat-pill">
                          <span className="s-label">Dependencies (Out-Degree)</span>
                          <span className="s-val">{selectedNode.dependencies}</span>
                        </div>
                      </div>
                    </div>

                    {/* Remediation & Cost Recommendation */}
                    {selectedNode.remediation_options && selectedNode.remediation_options.length > 0 && (
                      <div className="inspector-card remediation-card">
                        <div className="remediation-header">
                          <div className="metric-title-with-q">
                            <h4 className="card-section-title">Remediation & Cost Optimization</h4>
                            <button
                              type="button"
                              className={`q-icon-btn ${activeMetricHelp === 'remediation' ? 'is-active' : ''}`}
                              onClick={() => toggleMetricHelp('remediation')}
                              title="How is remediation cost calculated?"
                            >
                              ?
                            </button>
                          </div>
                          <span className="rec-badge">
                            Recommended: {selectedNode.recommended_action || 'UPDATE'}
                          </span>
                        </div>

                        {activeMetricHelp === 'remediation' && (
                          <div className="metric-inline-help-box animate-fade-in">
                            <div className="help-box-head">
                              <span className="help-title">Remediation Optimization Algorithm</span>
                              <button type="button" className="help-close-btn" onClick={() => setActiveMetricHelp(null)}>×</button>
                            </div>
                            <div className="help-formula-pill">
                              argmin(Cost) subject to ResidualRisk = OriginalRisk × (1 - F) ≤ 30
                            </div>
                            <p className="help-desc">
                              Cost is estimated at ₹1,000 / engineer hour. Actions evaluate UPDATE (F=85% reduction), MITIGATE (F=55% reduction with minimal effort), and REPLACE (F=94% reduction with high effort).
                            </p>
                          </div>
                        )}

                        <div className="remediation-options-list">
                          {selectedNode.remediation_options.map((opt, idx) => (
                            <div
                              key={`rem-${idx}`}
                              className={`remediation-opt-box ${opt.recommended ? 'is-recommended' : ''}`}
                            >
                              <div className="opt-title-row">
                                <span className="opt-action">{opt.action}</span>
                                {opt.recommended && <span className="opt-best-tag">Lowest Cost ≤ 30 Residual</span>}
                              </div>
                              <p className="opt-desc">{opt.description}</p>
                              <div className="opt-metrics-row">
                                <div>
                                  <span className="opt-label">Residual Risk:</span>
                                  <span className="opt-val">{opt.residual_risk}/100</span>
                                </div>
                                <div>
                                  <span className="opt-label">Estimated Effort:</span>
                                  <span className="opt-val">{opt.estimated_effort_hours} hrs</span>
                                </div>
                                <div>
                                  <span className="opt-label">Estimated Cost:</span>
                                  <span className="opt-val font-semibold">₹{opt.estimated_cost_inr.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : activeTab === 'usages' ? (
                  /* Code Usages & AST Functions Tab */
                  <div className="inspector-card usages-panel-card animate-fade-in">
                    <div className="usages-panel-header">
                      <h4 className="card-section-title">AST Code Usage Scanner</h4>
                      <span className="usage-count-tag">
                        {selectedNodeUsages ? `${selectedNodeUsages.total_occurrences} Usages across ${selectedNodeUsages.affected_files_count} Files` : 'No Usages Detected'}
                      </span>
                    </div>

                    {selectedNodeUsages && selectedNodeUsages.files.length > 0 ? (
                      <div className="files-usage-list">
                        {selectedNodeUsages.files.map((fUsage, fIdx) => (
                          <div key={`file-u-${fIdx}`} className="file-usage-item">
                            <div className="file-item-header">
                              <div className="file-path-row">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="file-icon">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span className="file-path-text">{fUsage.file_path}</span>
                              </div>
                              <span className="file-usage-badge">{fUsage.total_usages_count} calls</span>
                            </div>

                            {/* Imports in this file */}
                            {fUsage.imports.length > 0 && (
                              <div className="file-imports-box">
                                <span className="imports-label">Import Statement:</span>
                                {fUsage.imports.map((imp, impIdx) => (
                                  <code key={`imp-${impIdx}`} className="code-import-block">
                                    <span className="code-lineno">L{imp.line}:</span> {imp.statement}
                                  </code>
                                ))}
                              </div>
                            )}

                            {/* Functions / Endpoints calling this package */}
                            {fUsage.functions.length > 0 && (
                              <div className="functions-sublist">
                                <span className="func-subhead">Referenced Functions & Endpoints ({fUsage.functions.length}):</span>
                                {fUsage.functions.map((fn, fnIdx) => (
                                  <div key={`fn-${fnIdx}`} className="function-entry">
                                    <div className="function-entry-head">
                                      <span className={`fn-type-badge type-${fn.type}`}>{fn.type}</span>
                                      <span className="fn-name">{fn.name}</span>
                                      <span className="fn-lines">L{fn.line_start}-{fn.line_end}</span>
                                    </div>
                                    <pre className="fn-snippet-preview">
                                      <code>{fn.snippet}</code>
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-usages-box">
                        <p>No direct source code imports found in active Python files for <code>{selectedNode.name}</code>.</p>
                        <span className="no-usages-hint">This may be a transitive dependency invoked through parent modules.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Dedicated Vulnerabilities Tab */
                  <div className="inspector-card vulnerabilities-panel-card animate-fade-in">
                    <div className="usages-panel-header">
                      <h4 className="card-section-title">Vulnerability Intelligence & CVEs</h4>
                      <span className={`usage-count-tag ${selectedNode.vulnerable ? 'tag-alert-red' : ''}`}>
                        {selectedNode.vulnerabilities && selectedNode.vulnerabilities.length > 0
                          ? `${selectedNode.vulnerabilities.length} Known CVE`
                          : selectedNode.vulnerable
                          ? '1 Known CVE'
                          : '0 CVEs (Clean)'}
                      </span>
                    </div>

                    {/* Selected Node Vulnerabilities Details */}
                    {selectedNode.vulnerabilities && selectedNode.vulnerabilities.length > 0 ? (
                      <div className="cve-cards-list">
                        {selectedNode.vulnerabilities.map((vuln, vIdx) => (
                          <div key={`vuln-card-${vIdx}`} className="cve-detail-card">
                            <div className="cve-card-header">
                              <div className="cve-badge-group">
                                <span className="cve-id-badge">{vuln.id}</span>
                                <span className="cve-severity-badge">
                                  CVSS {vuln.cvss} • {vuln.severity_score >= 80 ? 'Critical' : vuln.severity_score >= 70 ? 'High' : 'Moderate'} ({vuln.severity_score}/100)
                                </span>
                              </div>
                              {vuln.references && vuln.references.length > 0 && (
                                <a
                                  href={vuln.references[0]}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="cve-external-link"
                                  title="View official NVD advisory"
                                >
                                  NVD Advisory ↗
                                </a>
                              )}
                            </div>

                            <h5 className="cve-summary-title">{vuln.summary}</h5>

                            {vuln.details && (
                              <p className="cve-details-text">{vuln.details}</p>
                            )}

                            <div className="cve-spec-grid">
                              <div className="cve-spec-item">
                                <span className="spec-label">Affected Package</span>
                                <span className="spec-val font-mono">{vuln.affected_package}</span>
                              </div>
                              <div className="cve-spec-item">
                                <span className="spec-label">Installed Version</span>
                                <span className="spec-val font-mono">v{selectedNode.version}</span>
                              </div>
                              <div className="cve-spec-item">
                                <span className="spec-label">Vulnerable Range</span>
                                <span className="spec-val font-mono text-rose">{vuln.affected_version_range}</span>
                              </div>
                              <div className="cve-spec-item">
                                <span className="spec-label">Patched / Fixed Version</span>
                                <span className="spec-val font-mono text-emerald">
                                  {vuln.fixed_version ? `v${vuln.fixed_version} (Safe)` : 'Patch in progress'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : selectedNode.vulnerable ? (
                      <div className="cve-detail-card">
                        <div className="cve-card-header">
                          <span className="cve-id-badge">CVE Security Flag</span>
                          <span className="cve-severity-badge">
                            CVSS {selectedNode.cvss || 7.0} • Severity {selectedNode.severity}/100
                          </span>
                        </div>
                        <h5 className="cve-summary-title">Security advisory detected in {selectedNode.name}</h5>
                        <p className="cve-details-text">
                          This version (v{selectedNode.version}) is identified as vulnerable in upstream OSV and NIST databases.
                        </p>
                      </div>
                    ) : (
                      <div className="no-cve-clean-box">
                        <div className="clean-icon-wrap">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="clean-check-icon">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        </div>
                        <h5>No Known CVEs for {selectedNode.name}</h5>
                        <p>Version {selectedNode.version} has zero reported vulnerabilities in the active OSV/NVD database index.</p>
                      </div>
                    )}

                    {/* Repository-Wide Vulnerability List & Fast Selector */}
                    {graphData?.vulnerabilities && graphData.vulnerabilities.length > 0 && (
                      <div className="all-repo-cves-section">
                        <div className="all-cves-header">
                          <h5 className="all-cves-title">All Repository CVEs ({graphData.vulnerabilities.length})</h5>
                          <span className="all-cves-sub">Click to inspect in graph:</span>
                        </div>
                        <div className="all-cves-list">
                          {graphData.vulnerabilities.map((v, idx) => {
                            const isCurrent = selectedNode.name.toLowerCase() === v.affected_package.toLowerCase()
                            return (
                              <button
                                key={`all-v-${idx}`}
                                type="button"
                                className={`repo-cve-pill-item ${isCurrent ? 'is-active' : ''}`}
                                onClick={() => setSelectedNodeId(v.affected_package.toLowerCase())}
                              >
                                <div className="cve-pill-head">
                                  <span className="cve-pill-id">{v.id}</span>
                                  <span className="cve-pill-pkg">{v.affected_package}</span>
                                  <span className="cve-pill-score">CVSS {v.cvss}</span>
                                </div>
                                <span className="cve-pill-summary">{v.summary}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="inspector-empty">
                <p>Click on any package node in the graph to inspect its complete analytics, betweenness centrality, blast radius, and code usages.</p>
              </div>
            )}
          </aside>
        </div>

        {/* DepLens Mathematical Metric Guide Modal */}
        {showAllFormulasModal && (
          <div className="metrics-modal-overlay animate-fade-in">
            <div className="metrics-modal-backdrop" onClick={() => setShowAllFormulasModal(false)} />
            <div className="metrics-modal-content">
              <div className="metrics-modal-header">
                <div className="modal-header-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="modal-header-text">
                  <h3 className="modal-title">DepLens Mathematical Engine & Metric Guide</h3>
                  <p className="modal-subtitle">Formal mathematical formulas, scoring weights, and algorithmic methodologies used in DepLens.</p>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => setShowAllFormulasModal(false)} title="Close Guide">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="metrics-modal-body">
                {/* 1. Betweenness Centrality */}
                <div className="formula-guide-card">
                  <div className="formula-guide-head">
                    <span className="formula-num-badge">1</span>
                    <h4 className="formula-card-title">Betweenness Centrality (C_B)</h4>
                    <span className="formula-tag tag-purple">Graph Topology</span>
                  </div>
                  <div className="formula-math-display">
                    <code>C_B(v) = ∑ [σ_st(v) / σ_st] × 100</code>
                  </div>
                  <p className="formula-explanation">
                    Calculated using NetworkX directed shortest paths. Measures the proportion of shortest dependency paths between all node pairs (s, t) that traverse node v. Packages with high centrality represent structural bottlenecks where failures disrupt multiple independent dependency chains.
                  </p>
                </div>

                {/* 2. Code Usage Score */}
                <div className="formula-guide-card">
                  <div className="formula-guide-head">
                    <span className="formula-num-badge">2</span>
                    <h4 className="formula-card-title">Code Usage Scoring</h4>
                    <span className="formula-tag tag-cyan">Static AST Analysis</span>
                  </div>
                  <div className="formula-math-display">
                    <code>Score = f(Affected Python Source Files)</code>
                  </div>
                  <p className="formula-explanation">
                    AST parser inspects imports (<code>import x</code>, <code>from x import y</code>) and symbol usages across repository source files to prevent treating unused transitive packages with the same urgency as core imported frameworks:
                  </p>
                  <div className="formula-buckets-table">
                    <div className="bucket-row"><span className="b-label">0 Files:</span> <span className="b-val">10</span> (Transitive / Unreferenced)</div>
                    <div className="bucket-row"><span className="b-label">1–2 Files:</span> <span className="b-val">30</span> (Isolated usage)</div>
                    <div className="bucket-row"><span className="b-label">3–5 Files:</span> <span className="b-val">60</span> (Moderate usage)</div>
                    <div className="bucket-row"><span className="b-label">6–10 Files:</span> <span className="b-val">80</span> (Wide architectural footprint)</div>
                    <div className="bucket-row"><span className="b-label">&gt;10 Files:</span> <span className="b-val">100</span> (Critical foundation dependency)</div>
                  </div>
                </div>

                {/* 3. Blast Radius */}
                <div className="formula-guide-card">
                  <div className="formula-guide-head">
                    <span className="formula-num-badge">3</span>
                    <h4 className="formula-card-title">Cascading Blast Radius (BR)</h4>
                    <span className="formula-tag tag-rose">Reverse Propagation</span>
                  </div>
                  <div className="formula-math-display">
                    <code>BR = 50% × D + 30% × M + 20% × P</code>
                  </div>
                  <p className="formula-explanation">
                    Simulates reverse dependency propagation via breadth-first search (BFS) to measure full downstream cascading reach:
                  </p>
                  <ul className="formula-bullet-list">
                    <li><strong>D (Dependency Impact):</strong> (Affected Dependents / Total Dependents) × 100</li>
                    <li><strong>M (Module Impact):</strong> (Affected Code Files / Total Code Files) × 100</li>
                    <li><strong>P (Propagation Depth):</strong> (Traversal Depth d / Max Graph Depth d_max) × 100</li>
                  </ul>
                </div>

                {/* 4. Composite Risk Score */}
                <div className="formula-guide-card">
                  <div className="formula-guide-head">
                    <span className="formula-num-badge">4</span>
                    <h4 className="formula-card-title">DepLens Composite Risk Score</h4>
                    <span className="formula-tag tag-amber">Synthesis Engine</span>
                  </div>
                  <div className="formula-math-display">
                    <code>Risk = 35% × Severity + 30% × BlastRadius + 20% × Centrality + 15% × CodeUsage</code>
                  </div>
                  <p className="formula-explanation">
                    Severity is normalized from CVSS (Severity = CVSS × 10). The 4-factor composite ensures vulnerabilities in deeply embedded, high-blast-radius libraries receive higher remediation priority than isolated edge packages.
                  </p>
                  <div className="formula-scale-legend">
                    <span className="legend-chip l-low">0–29 Low</span>
                    <span className="legend-chip l-mod">30–49 Moderate</span>
                    <span className="legend-chip l-high">50–69 High</span>
                    <span className="legend-chip l-crit">70–84 Critical</span>
                    <span className="legend-chip l-sev">85–100 Severe</span>
                  </div>
                </div>

                {/* 5. Remediation Optimization */}
                <div className="formula-guide-card">
                  <div className="formula-guide-head">
                    <span className="formula-num-badge">5</span>
                    <h4 className="formula-card-title">Remediation Cost Optimization</h4>
                    <span className="formula-tag tag-green">Decision Matrix</span>
                  </div>
                  <div className="formula-math-display">
                    <code>argmin(Cost) subject to ResidualRisk = OriginalRisk × (1 - F) ≤ 30</code>
                  </div>
                  <p className="formula-explanation">
                    Selects the engineering action with minimal cost (estimated at ₹1,000 / engineer hour) that successfully reduces residual risk below the safe threshold (&le; 30):
                  </p>
                  <ul className="formula-bullet-list">
                    <li><strong>UPDATE:</strong> Patch/minor upgrade (Risk Reduction F = 85%, effort scaled by version drift).</li>
                    <li><strong>MITIGATE:</strong> Virtual patching / WAF / schema validation (Risk Reduction F = 55%, minimal effort).</li>
                    <li><strong>REPLACE:</strong> Library replacement (Risk Reduction F = 94%, substantial refactoring effort).</li>
                  </ul>
                </div>
              </div>

              <div className="metrics-modal-footer">
                <button type="button" className="btn-primary" onClick={() => setShowAllFormulasModal(false)}>
                  Got it, close guide
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DependencyGraphDrawer

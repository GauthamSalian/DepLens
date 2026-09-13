"""
DepLens Complete Solution & Architecture PDF Generator.
Generates an exact 4-page publication-grade engineering and business whitepaper PDF.
"""

from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
    PageBreak,
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render total page count in footer.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(45, 11 * inch - 30, "DepLens • Software Supply Chain Intelligence & Cascading Blast Radius")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(45, 11 * inch - 34, 8.5 * inch - 45, 11 * inch - 34)

        # Running Footer (all pages)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(45, 34, 8.5 * inch - 45, 34)

        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        self.drawString(45, 23, "DepLens Technical Whitepaper • MIT Manipal Hackathon 2026 Submission")

        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 45, 23, page_str)
        self.restoreState()


def generate_pdf(output_path: Path):
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=45,
        rightMargin=45,
        topMargin=40,
        bottomMargin=42,
    )

    styles = getSampleStyleSheet()

    # Brand Colors
    c_primary = colors.HexColor("#0f172a")     # Deep Slate
    c_purple = colors.HexColor("#6d28d9")      # Deep Purple
    c_cyan = colors.HexColor("#0369a1")        # Cyan Blue
    c_rose = colors.HexColor("#be123c")        # Crimson Rose
    c_dark = colors.HexColor("#1e293b")        # Slate Dark
    c_bg_light = colors.HexColor("#f8fafc")    # Light Table BG
    c_border = colors.HexColor("#cbd5e1")      # Slate Border

    # Typography Styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=c_primary,
        spaceAfter=3,
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=c_purple,
        spaceAfter=8,
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=c_primary,
        spaceBefore=7,
        spaceAfter=4,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=c_purple,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=c_dark,
        spaceAfter=4,
    )

    bullet_style = ParagraphStyle(
        "BulletText",
        parent=body_style,
        leftIndent=10,
        firstLineIndent=-6,
        spaceAfter=2.5,
    )

    math_block_style = ParagraphStyle(
        "MathBlock",
        parent=styles["Code"],
        fontName="Courier-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#4c1d95"),
        backColor=colors.HexColor("#f5f3ff"),
        borderColor=colors.HexColor("#ddd6fe"),
        borderWidth=1,
        borderPadding=5,
        spaceAfter=5,
        spaceBefore=2,
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.8,
        leading=10,
        textColor=c_dark,
    )

    story = []

    # ==========================================
    # PAGE 1: PROBLEM, VISION & PIPELINE
    # ==========================================
    story.append(Paragraph("DepLens Architecture & Technical Specification", title_style))
    story.append(Paragraph("A Mathematical Software Supply Chain Intelligence & Cascading Blast Radius Engine", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_purple, spaceBefore=0, spaceAfter=6))

    meta_table_data = [
        [
            Paragraph("<b>Problem Domain:</b> Cybersecurity & Supply Chain Security", table_cell_style),
            Paragraph("<b>Architecture:</b> Python/FastAPI Backend + React/TypeScript SVG", table_cell_style),
        ],
        [
            Paragraph("<b>Mathematical Engine:</b> Brandes Centrality, AST Parsing & Blast Radius", table_cell_style),
            Paragraph("<b>Optimization:</b> Constrained Linear Cost Minimization (Residual Risk ≤ 30)", table_cell_style),
        ],
    ]
    meta_table = Table(meta_table_data, colWidths=[260, 260])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("1. Executive Summary & Problem Formulation", h1_style))
    story.append(Paragraph(
        "Modern cloud applications depend on deeply nested software packages. Declaring just 10 direct libraries in a <code>requirements.txt</code> commonly pulls in <b>40–60 transitive dependencies</b> across 4–5 hierarchical depth levels, creating critical supply chain blind spots (e.g. Log4j, XZ Utils, colors.js).",
        body_style
    ))
    story.append(Paragraph("<b>Why Conventional Security Scanners Fail (Dependabot, Snyk, npm audit):</b>", h2_style))
    story.append(Paragraph("• <b>Flat-List Alert Fatigue:</b> Scanners output unranked lists of hundreds of CVEs without operational context, paralyzing engineers.", bullet_style))
    story.append(Paragraph("• <b>AST Source Code Blindness:</b> Existing tools treat a CVE in an unimported test script with the same urgency as a vulnerability in a core production request handler.", bullet_style))
    story.append(Paragraph("• <b>Absence of Graph Topology:</b> Scanners ignore hierarchical node depth, betweenness centrality, and cascading blast radius reach.", bullet_style))
    story.append(Paragraph("• <b>Destructive Remediation:</b> Tools mandate 'Update everything', creating catastrophic breaking changes and unbudgeted engineering costs.", bullet_style))
    story.append(Paragraph(
        "<b>The DepLens Breakthrough:</b> DepLens transforms dependency trees into a formal <b>Directed Graph Network</b>, correlates live <b>OSV/NVD CVE databases</b>, parses real codebase Abstract Syntax Trees (AST) to pinpoint exact line numbers and endpoints, calculates cascading <b>Blast Radius (BR)</b> via reverse BFS, and solves a <b>Remediation Cost Optimization</b> model to achieve target risk reduction at minimal expense.",
        body_style
    ))

    story.append(Paragraph("2. End-to-End System Processing Pipeline", h1_style))
    arch_steps = [
        ["Phase", "Component", "Functionality & Implementation Details"],
        ["1", "Manifest Ingestion", "Parses direct requirements from requirements.txt, pyproject.toml, and package manifests."],
        ["2", "Recursive Resolver", "Recursively resolves full transitive sub-dependency hierarchy into directed graph edges."],
        ["3", "NetworkX Engine", "Constructs directed graph G=(V,E), computes node degrees and max propagation depth."],
        ["4", "Centrality Analyzer", "Executes Brandes' algorithm to compute betweenness centrality C_B(v) for all nodes."],
        ["5", "AST Usage Scanner", "Parses Python AST nodes, finding exact import statements, functions, endpoints, and lines."],
        ["6", "Vulnerability Correlator", "Correlates package versions against OSV.dev/NVD CVE feeds, computing CVSS Severity."],
        ["7", "Blast Radius BFS", "Executes reverse Breadth-First Search to calculate Dependency, Module, and Depth impacts."],
        ["8", "Composite Risk Matrix", "Synthesizes multi-factor risk score: 35% Sev + 30% BR + 20% Cent + 15% Usage."],
        ["9", "Cost Optimization", "Generates UPDATE, MITIGATE, REPLACE strategies solving min(Cost) for ResidualRisk <= 30."],
        ["10", "Interactive Visualizer", "Renders SVG canvas with pan/zoom, blast propagation halo, and multi-tab inspector."],
    ]
    arch_table = Table([[Paragraph(c, table_header_style if i == 0 else table_cell_style) for c in row] for i, row in enumerate(arch_steps)], colWidths=[35, 110, 375])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('BACKGROUND', (0, 1), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 2.8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(arch_table)

    story.append(PageBreak())

    # ==========================================
    # PAGE 2: MATHEMATICAL FORMULATIONS (1 to 3)
    # ==========================================
    story.append(Paragraph("3. Mathematical Formulations & Algorithmic Models", h1_style))
    story.append(Paragraph(
        "DepLens replaces arbitrary risk categorization with formal mathematical models across graph theory, static AST analysis, and constrained optimization:",
        body_style
    ))

    # Metric 1: Centrality
    story.append(Paragraph("3.1 Betweenness Centrality (C_B)", h2_style))
    story.append(Paragraph(
        "Betweenness Centrality quantifies how often a package <i>v</i> acts as a structural bridge along shortest paths between all other pairs of packages (<i>s</i>, <i>t</i>) in the directed graph <i>G = (V, E)</i>:",
        body_style
    ))
    story.append(Paragraph(
        "C_B(v) = ∑ [ σ_st(v) / σ_st ] × 100   (for all s ≠ v ≠ t)",
        math_block_style
    ))
    story.append(Paragraph(
        "Where <b>σ_st</b> is the total number of shortest dependency paths from package <i>s</i> to <i>t</i>, and <b>σ_st(v)</b> is the number of those paths that pass through <i>v</i>. Normalized on a 0–100 scale using NetworkX. High centrality packages (e.g. <code>pydantic</code> or <code>typing-extensions</code>) act as key bridges—if compromised, multiple independent subsystems are simultaneously exposed.",
        body_style
    ))

    # Metric 2: AST Usage
    story.append(Paragraph("3.2 AST Code Usage Scoring", h2_style))
    story.append(Paragraph(
        "Static Abstract Syntax Tree (AST) analysis scans every source file in the repository to measure real code invocation. It inspects <code>Import</code> / <code>ImportFrom</code> nodes, maps aliased symbols, and traverses <code>FunctionDef</code> and endpoint decorators to assign scores based on operational buckets:",
        body_style
    ))
    ast_table_data = [
        ["Source Code Reference Footprint", "Score", "Architectural Classification"],
        ["0 Project Files (Transitive only / Uncalled)", "10 / 100", "Dormant / Edge Library"],
        ["1 – 2 Project Files", "30 / 100", "Localized / Isolated Usage"],
        ["3 – 5 Project Files", "60 / 100", "Moderate Multi-Module Usage"],
        ["6 – 10 Project Files", "80 / 100", "Wide Architectural Dependency"],
        ["> 10 Project Files", "100 / 100", "Core System Backbone / Framework"],
    ]
    ast_table = Table([[Paragraph(c, table_header_style if i == 0 else table_cell_style) for c in row] for i, row in enumerate(ast_table_data)], colWidths=[195, 70, 255])
    ast_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_cyan),
        ('BACKGROUND', (0, 1), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(ast_table)
    story.append(Spacer(1, 4))

    # Metric 3: Blast Radius
    story.append(Paragraph("3.3 Cascading Blast Radius (BR)", h2_style))
    story.append(Paragraph(
        "Blast Radius quantifies the cascading damage across the dependency tree if a package fails or is compromised. It executes a reverse Breadth-First Search (BFS) starting from the target node:",
        body_style
    ))
    story.append(Paragraph(
        "BR = 50% × D + 30% × M + 20% × P",
        math_block_style
    ))
    story.append(Paragraph("• <b>Dependency Impact (D):</b> D = (Affected Dependents / Total Dependencies) × 100", bullet_style))
    story.append(Paragraph("• <b>Module Impact (M):</b> M = (Affected Source Code Files / Total Code Modules) × 100", bullet_style))
    story.append(Paragraph("• <b>Propagation Depth Ratio (P):</b> P = (Reverse Traversal Depth d / Max Graph Depth d_max) × 100", bullet_style))

    # Metric 4: Composite Risk
    story.append(Paragraph("3.4 DepLens Composite Risk Score", h2_style))
    story.append(Paragraph(
        "The overall threat index is computed by synthesizing exploit severity, graph topology, code footprint, and cascading blast radius:",
        body_style
    ))
    story.append(Paragraph(
        "Risk = 35% × Severity + 30% × BlastRadius + 20% × Centrality + 15% × CodeUsage",
        math_block_style
    ))
    story.append(Paragraph(
        "Where <b>Severity = CVSS × 10</b> (0 if no active CVE). The resulting 0–100 score maps directly to actionable operational categories: <b>Low (0–29)</b>, <b>Moderate (30–49)</b>, <b>High (50–69)</b>, <b>Critical (70–84)</b>, and <b>Severe (85–100)</b>.",
        body_style
    ))

    story.append(PageBreak())

    # ==========================================
    # PAGE 3: REMEDIATION OPTIMIZATION & CASE STUDY
    # ==========================================
    story.append(Paragraph("3.5 Remediation Cost Optimization Model", h2_style))
    story.append(Paragraph(
        "Rather than mandating blind upgrades that break builds, DepLens solves a constrained cost-optimization model: finding the action with lowest engineering cost that brings residual risk below safe tolerance (<b>Residual Risk &le; 30</b>):",
        body_style
    ))
    story.append(Paragraph(
        "argmin(Cost)   subject to   ResidualRisk = OriginalRisk × (1 - F) ≤ 30",
        math_block_style
    ))
    rem_strategies = [
        ["Strategy", "Risk Reduction (F)", "Engineering Effort & Cost Model", "Typical Use-Case"],
        ["UPDATE", "F = 85%", "Effort = Base + Version Drift (4–16 hrs) @ Rs. 1,000/hr", "Clean minor/patch release available without API breakage."],
        ["MITIGATE", "F = 55%", "Effort = 2–4 hrs (Fixed Virtual Patch / WAF) @ Rs. 1,000/hr", "Urgent zero-day / ReDoS where full upgrade requires extensive refactor."],
        ["REPLACE", "F = 94%", "Effort = 24–60 hrs (Complete migration) @ Rs. 1,000/hr", "Abandoned / unmaintained package with critical unpatched CVEs."],
    ]
    rem_table = Table([[Paragraph(c, table_header_style if i == 0 else table_cell_style) for c in row] for i, row in enumerate(rem_strategies)], colWidths=[65, 85, 185, 185])
    rem_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_rose),
        ('BACKGROUND', (0, 1), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(rem_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("4. Empirical Validation: FluxPay-server Case Study", h1_style))
    story.append(Paragraph(
        "We validated DepLens against <code>GauthamSalian/FluxPay-server</code>, a production payment orchestration and transaction gateway server. The pipeline generated the following empirical findings:",
        body_style
    ))

    repo_stats_data = [
        ["Topology Metric", "Value", "Vulnerability Metric", "Value"],
        ["Direct Manifest Packages", "10", "Active CVEs Identified", "4"],
        ["Transitive Sub-Dependencies", "39", "Max Risk Score in Tree", "44 / 100 (Moderate)"],
        ["Total Directed Edges", "61", "Average Tree Risk Score", "10.3 / 100"],
        ["Max Propagation Depth", "4", "AST Affected Source Files", "5 Core Modules"],
    ]
    repo_table = Table([[Paragraph(c, table_header_style if i == 0 else table_cell_style) for c in row] for i, row in enumerate(repo_stats_data)], colWidths=[140, 120, 140, 120])
    repo_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('BACKGROUND', (0, 1), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(repo_table)
    story.append(Spacer(1, 5))

    story.append(Paragraph("<b>Identified Security Vulnerabilities (CVE Audits):</b>", h2_style))
    cve_data = [
        ["Package", "Version", "CVE Identifier", "CVSS", "Fixed Version", "Vulnerability Description & Attack Vector"],
        ["fastapi", "0.110.0", "CVE-2024-24762", "7.5 (High)", "0.115.0", "ReDoS in multipart form-data parser when handling malformed boundary headers."],
        ["sqladmin", "0.16.1", "CVE-2024-34064", "8.7 (High)", "0.19.0", "Stored/Reflected XSS in admin model view column rendering via unescaped HTML."],
        ["starlette", "0.36.3", "CVE-2024-24768", "7.1 (High)", "0.37.2", "Resource consumption / CPU Denial of Service during multipart upload parsing."],
        ["aiohttp", "3.9.3", "CVE-2024-27306", "8.1 (High)", "3.9.5", "HTTP Request Smuggling via malformed chunk extensions in server parser."],
    ]
    cve_table = Table([[Paragraph(c, table_header_style if i == 0 else table_cell_style) for c in row] for i, row in enumerate(cve_data)], colWidths=[55, 45, 80, 50, 60, 230])
    cve_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_rose),
        ('BACKGROUND', (0, 1), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(cve_table)

    story.append(PageBreak())

    # ==========================================
    # PAGE 4: AST REFERENCES, BUSINESS & ROADMAP
    # ==========================================
    story.append(Paragraph("4.1 AST Source Code References for <code>fastapi</code> (32 Usages across 5 Files):", h2_style))
    ast_samples = [
        ["File Path", "Line Numbers", "Import Statement & Invoked Endpoints", "Type"],
        ["app.py", "L1, L7, L21–23", "from fastapi import FastAPI, HTTPException\napp = FastAPI(title='FluxPay Server')", "Module Init"],
        ["api/walletroutes.py", "L1, L18–35", "from fastapi import APIRouter, Depends, HTTPException\n@router.post('/create'), @router.get('/balance')", "Endpoints"],
        ["api/transactionroutes.py", "L1, L15–42", "from fastapi import APIRouter, Depends\n@router.post('/transfer'), @router.post('/verify')", "Endpoints"],
        ["api/userroutes.py", "L1, L12–28", "from fastapi import APIRouter, Depends\n@router.post('/login'), @router.post('/register')", "Endpoints"],
        ["services/userservices.py", "L1, L8–16", "from fastapi import HTTPException\nraise HTTPException(status_code=400)", "Functions"],
    ]
    ast_sample_table = Table([[Paragraph(c, table_header_style if i == 0 else table_cell_style) for c in row] for i, row in enumerate(ast_samples)], colWidths=[125, 65, 270, 60])
    ast_sample_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_cyan),
        ('BACKGROUND', (0, 1), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(ast_sample_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("5. Commercialization, Monetization & Roadmap", h1_style))
    story.append(Paragraph(
        "To satisfy the 6 hackathon evaluation pillars (Innovation, Feasibility, Marketing, Monetization, Adherence, and Prototype), DepLens includes a robust commercialization framework:",
        body_style
    ))

    story.append(Paragraph("5.1 Market Outreach & Go-To-Market Strategy (Pillar 3)", h2_style))
    story.append(Paragraph("• <b>Developer-First Bottom-Up Adoption:</b> Free open-source CLI and GitHub Action generating PR-level blast radius comments.", bullet_style))
    story.append(Paragraph("• <b>Target Audiences:</b> DevSecOps teams, FinTech payment gateways, Healthcare SaaS, and Enterprise compliance teams requiring SBOM.", bullet_style))
    story.append(Paragraph("• <b>Content Marketing:</b> Publishing weekly 'Dependency Vulnerability Blast Radius' teardowns of top PyPI/npm packages.", bullet_style))

    story.append(Paragraph("5.2 Monetization Model & Financial Sustainability (Pillar 4)", h2_style))
    biz_tiers = [
        ["Tier", "Pricing", "Target Customer", "Features & Capabilities"],
        ["Community", "Free (Open Source)", "Individual Developers & OSS", "Single repo scans, web visualizer, standard OSV feed."],
        ["Team Pro", "$29 / repo / month", "Mid-market Engineering Teams", "Automated CI/CD PR blocking, AST code scanner, remediation optimizer."],
        ["Enterprise", "$499+ / org / month", "Enterprises (Fintech/Health)", "On-premises deployment, custom SLA, private registry support, compliance export."],
    ]
    biz_table = Table([[Paragraph(c, table_header_style if i == 0 else table_cell_style) for c in row] for i, row in enumerate(biz_tiers)], colWidths=[70, 95, 135, 220])
    biz_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('BACKGROUND', (0, 1), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(biz_table)
    story.append(Spacer(1, 5))

    story.append(Paragraph("5.3 Technical Roadmap & Milestones (Pillar 2)", h2_style))
    story.append(Paragraph("• <b>Q1 2026 (Completed):</b> Core graph engine, NetworkX centrality, AST parser, reverse BFS blast radius, and interactive SVG drawer.", bullet_style))
    story.append(Paragraph("• <b>Q2 2026:</b> Real-time streaming OSV.dev & GitHub webhook integration, automated PR virtual patch generator.", bullet_style))
    story.append(Paragraph("• <b>Q3 2026:</b> Support for multi-language mono-repos (Rust Cargo, Go modules, Java Maven, npm/pnpm workspaces).", bullet_style))
    story.append(Paragraph("• <b>Q4 2026:</b> IDE plugin (VS Code & JetBrains) highlighting blast radius and CVE risks directly inside the code editor.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=2, spaceAfter=4))
    story.append(Paragraph(
        "<b>Conclusion:</b> DepLens bridges the critical divide between raw vulnerability alerts and actual source code risk. By combining graph theory, static AST parsing, and cost optimization, it enables engineering organizations to protect their software supply chain efficiently without breaking builds.",
        body_style
    ))

    # Build document with custom two-pass canvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF at: {output_path}")


if __name__ == "__main__":
    out_dir = Path(__file__).resolve().parent.parent.parent
    target_pdf = out_dir / "DepLens_Complete_Solution_Document.pdf"
    generate_pdf(target_pdf)

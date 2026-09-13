# DepLens

> **A Mathematical Software Supply Chain Intelligence & Cascading Blast Radius Engine**  
> *Transforming opaque dependency trees into actionable graph topology, static AST code exposure metrics, and cost-optimized remediation.*

---

## 📌 Overview & Problem Statement

Modern cloud applications rely on deeply nested software package trees. Declaring just 10 direct libraries in a manifest commonly introduces **40–60 transitive dependencies** across multiple hierarchical levels. 

### Why Conventional Tools (Dependabot, Snyk, npm audit) Fail:
1. **Flat-List Alert Fatigue:** Existing scanners output overwhelming, unranked lists of CVEs without operational context.
2. **AST Source Code Blindness:** Traditional tools treat a CVE in an unimported/unused test script with the same urgency as a vulnerability in a core payment endpoint.
3. **Absence of Graph Topology:** Scanners fail to evaluate hierarchical node depth, betweenness centrality, and cascading ripple effects across downstream modules.
4. **Destructive Remediation:** Automated tools recommend blind updates that break production builds and cause unbudgeted engineering overhead.

---

## 🚀 The DepLens Solution

DepLens transforms package manifests into a formal **Directed Graph Network**, scans codebase **Abstract Syntax Trees (AST)** to pinpoint exact source line numbers and endpoints, calculates cascading **Blast Radius ($BR$)** via reverse BFS, and solves a **Remediation Cost Optimization** model to achieve safety at minimal expense.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Manifest Parser │ ────> │ NetworkX Engine │ ────> │ AST Code Parser │
│ (Direct & Trans)│       │ (DiGraph G=V,E) │       │ (Lines & Routes)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
┌─────────────────┐       ┌─────────────────┐                ▼
│ Interactive SVG │ <──── │ Cost Optimizer  │ <──── ┌─────────────────┐
│ Visualizer & UI │       │ (min Cost ≤ 30) │       │  Blast Radius & │
└─────────────────┘       └─────────────────┘       │ Composite Risk  │
                                                    └─────────────────┘
```

---

## 🧮 Mathematical Formulations & Algorithms

DepLens replaces arbitrary risk scoring with formal mathematical models:

| Metric | Formulation | Description |
| :--- | :--- | :--- |
| **Betweenness Centrality ($C_B$)** | $$C_B(v) = \sum_{s \ne v \ne t} \frac{\sigma_{st}(v)}{\sigma_{st}} \times 100$$ | Brandes algorithm measuring how often package $v$ acts as a structural bridge between all other pairs $(s, t)$. |
| **AST Code Usage Score** | $0\text{ files} \to \mathbf{10} \quad 1\text{--}2 \to \mathbf{30} \quad 3\text{--}5 \to \mathbf{60} \quad 6\text{--}10 \to \mathbf{80} \quad >10 \to \mathbf{100}$ | Static AST scanner measuring direct file imports, functions, and endpoint invocations. |
| **Cascading Blast Radius ($BR$)** | $$BR = 50\% D + 30\% M + 20\% P$$ | Reverse BFS measuring Dependency Impact ($D$), Module Impact ($M$), and Depth Ratio ($P$). |
| **DepLens Composite Risk** | $$\text{Risk} = 35\%\text{Sev} + 30\% BR + 20\% C_B + 15\%\text{Usage}$$ | Weighted multi-factor threat index where $\text{Severity} = \text{CVSS} \times 10$. |
| **Remediation Optimization** | $$\min(\text{Cost}) \quad \text{s.t.} \quad \text{ResidualRisk} = \text{Risk} \times (1 - F) \le 30$$ | Solves optimal action (**UPDATE**, **MITIGATE**, **REPLACE**) at $\text{Effort} \times \text{Rs. 1,000/hr}$. |

---

## 🔬 Benchmark Testbed: `FluxPay-server` Case Study

DepLens is empirically evaluated against [`FluxPay-server`](https://github.com/GauthamSalian/FluxPay-server.git), a production-grade payment orchestration and transaction gateway server.

### Key Empirical Findings:
- **Topology:** 10 Direct Packages $\to$ 49 Total Nodes, 61 Directed Edges, Max Depth: 4.
- **AST Code Footprint:** 32 exact references parsed across 5 core modules (`app.py`, `api/walletroutes.py`, `api/transactionroutes.py`, `api/userroutes.py`, `services/userservices.py`).
- **CVE Identification:**
  - `fastapi` (`0.110.0`) $\to$ **CVE-2024-24762** (CVSS 7.5 High, ReDoS)
  - `sqladmin` (`0.16.1`) $\to$ **CVE-2024-34064** (CVSS 8.7 High, XSS)
  - `starlette` (`0.36.3`) $\to$ **CVE-2024-24768** (CVSS 7.1 High, CPU DoS)
  - `aiohttp` (`3.9.3`) $\to$ **CVE-2024-27306** (CVSS 8.1 High, Request Smuggling)
- **Remediation Recommendation:** Recommends **MITIGATE** (Virtual WAF patch, Rs. 3,000, Residual Risk: 20) over high-cost breaking migration.

---

## 💻 Tech Stack & Architecture

- **Backend:** Python 3.11, FastAPI, NetworkX (Graph Theory), Python AST (Static Analysis), Uvicorn.
- **Frontend:** React 19, TypeScript, Vite, SVG Graph Engine, Vanilla CSS (Light Mode).
- **Security Correlator:** OSV.dev (Open Source Vulnerabilities) & NIST NVD database.
- **Caching Layer:** High-speed disk persistence for sub-millisecond graph and AST retrieval.

---

## ⚙️ Quick Start & Local Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to server directory
cd server

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI dev server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs on: `http://127.0.0.1:8000`*

### 3. Frontend Setup
```bash
# In a new terminal, navigate to client directory
cd client

# Install packages
npm install

# Start Vite development server
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## 📂 Repository Structure

```
DepLens/
├── client/                     # Frontend React + TypeScript App
│   ├── src/
│   │   ├── components/         # SearchBar, DependencyGraphDrawer
│   │   ├── pages/              # HomePage
│   │   └── App.tsx
│   └── package.json
│
├── server/                     # Backend FastAPI & Analytics Engine
│   ├── app/
│   │   ├── api/                # Repositories, Analysis, Usages, Vulnerabilities
│   │   ├── analyzers/          # NetworkX Graph, AST Code Usage, Blast Radius, Risk Score
│   │   ├── services/           # GitHub Ingestion, OSV.dev Correlator
│   │   └── models/             # Pydantic Schemas
│   ├── cache/                  # Persisted Analysis Payloads
│   ├── requirements.txt
│   └── main.py
│
├── repos/                      # Cloned / Benchmark Repositories
│   └── FluxPay-server/
│
├── DepLens_Complete_Solution_Document.pdf # 4-Page Architecture Whitepaper
└── README.md
```

---

## 🗺️ Commercialization & Technical Roadmap

- **Q1 2026 (Completed):** Core graph engine, NetworkX centrality, AST parser, reverse BFS blast radius, and interactive SVG visualizer.
- **Q2 2026:** Real-time streaming OSV.dev & GitHub webhook integration, automated PR virtual patch generator.
- **Q3 2026:** Multi-language mono-repo support (Rust Cargo, Go modules, Java Maven, npm workspaces).
- **Q4 2026:** IDE plugin (VS Code & JetBrains) highlighting blast radius and CVE risks directly in code editor.

---

## 📄 Documentation

For the complete formal technical whitepaper with proofs, mathematical formulas, and business evaluation matrices, see:
👉 **[DepLens_Complete_Solution_Document.pdf](./DepLens_Complete_Solution_Document.pdf)**

---

*Built with ❤️ for Modern Software Supply Chain Transparency.*
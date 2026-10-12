# Government Scheme Finder 🇮🇳

A database-first platform for discovering, filtering, comparing, and exploring **4,732 official Indian Central & State Government Welfare Schemes**.

---

## 📌 Project Overview

Navigating government welfare schemes in India is traditionally complex due to fragmented information, varied eligibility criteria, and lack of standardized categorization.

**Government Scheme Finder** solves this by providing:
1. **Centralized Verified Database:** 4,732 government schemes classified from official sources into a normalized PostgreSQL database on Supabase.
2. **Multi-Factor Citizen Eligibility Engine:** Dynamic filtering by age, income, state, occupation, education, gender, caste category, and rural/urban area.
3. **High-Speed REST API:** Built with Node.js & Express, supporting faceted search, keyword matching, full-text search, and pagination.
4. **Side-by-Side Scheme Comparison Matrix:** Allows citizens to compare 2–5 schemes concurrently across 17 attributes (benefits, eligibility, documentation, exclusions, application steps).
5. **Decoupled Future RAG Architecture:** A clean modular boundary prepared for future semantic search and grounded AI question answering.

---

## 🏛️ System Architecture

```
                                 [Citizen / Frontend]
                                          │
                                          ▼
                         [Express.js REST API Server]
                         (Port 5000 / Standard Envelopes)
                                   │            │
             ┌─────────────────────┘            └─────────────────────┐
             ▼                                                        ▼
[Deterministic Query Engine]                             [Future RAG Interface Layer]
   • /api/schemes                                           • /api/rag/status
   • /api/schemes/filter (8 factors)                        • /api/rag/ask (Stub)
   • /api/schemes/search (Full-Text)                        • /api/rag/semantic-search (Stub)
   • /api/schemes/compare                                   • /api/rag/context (Stub)
             │                                                        │
             ▼                                                        ▼
[Supabase PostgreSQL (17.11)]                             [pgvector & LLM Grounding]
   • public.schemes (4,732 records)                         • (Ready for future activation)
   • Row-Level Security (RLS) enabled
```

---

## 🚀 API Endpoints Reference

### Health & Connectivity
| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Service uptime and online status |
| `/api/health/db` | `GET` | Live Supabase database latency and row count check |

### Scheme Discovery & Eligibility
| Endpoint | Method | Description |
|---|---|---|
| `/api/schemes` | `GET` | Paginated scheme listing with category and state filters |
| `/api/schemes/search?q=scholarship` | `GET` | Full-text and keyword scheme search |
| `/api/schemes/filter` | `GET` | Multi-factor eligibility engine (`age`, `income`, `state`, `gender`, `occupation`, `education`, `category`, `area`) |
| `/api/schemes/:id` | `GET` | Detailed scheme view by numeric ID (e.g. `1`) or slug (e.g. `pmsby`) |
| `/api/schemes/compare?ids=1,14,527` | `GET` | Side-by-side comparison matrix (GET query params) |
| `/api/schemes/compare` | `POST` | Side-by-side comparison matrix (POST JSON body `{ "ids": [1, 14, 527] }`) |
| `/api/schemes/metadata/filters` | `GET` | Distinct dropdown metadata for UI filters |

### RAG & Semantic Interface (Future Prepared)
| Endpoint | Method | Description |
|---|---|---|
| `/api/rag/status` | `GET` | Readiness and configuration status of RAG subsystem |
| `/api/rag/ask` | `POST` | Grounded natural language Q&A (Interface boundary) |
| `/api/rag/semantic-search` | `POST` | Semantic vector search (Interface boundary) |
| `/api/rag/context` | `POST` | Context chunks retrieval for external LLMs (Interface boundary) |

---

## 🛠️ Setup & Installation

### Prerequisites
* **Node.js** (v18.x or higher)
* **npm** (v9.x or higher)
* **Supabase** account with PostgreSQL database

### 1. Clone the Repository
```bash
git clone https://github.com/srivastavarudra22-prog/government-scheme-finder.git
cd government-scheme-finder
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your credentials in `backend/.env`:
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-publishable-anon-key
```

### 4. Start the Backend API
```bash
npm start
```
The server will start at `http://localhost:5000`.

---

## 🧪 Running Automated Tests

Run the full end-to-end integration test suite against the live database:
```bash
cd backend
node tests/complete_read_only_test.js
```
All **19 test suites** (including multi-factor filtering, comparison matrix generation, and input validation) will run and output latency metrics.

---

## 📁 Repository Structure

```
government-scheme-finder/
├── .gitignore                                      # Excludes .env, node_modules, and logs
├── README.md                                       # Project documentation
├── government_schemes_classified_full_dataset.pdf  # Source classified dataset (4,732 schemes)
└── backend/
    ├── .env.example                                # Template for environment variables
    ├── README.md                                   # Backend-specific documentation
    ├── package.json                                # Node.js dependencies and scripts
    ├── package-lock.json
    ├── docs/
    │   └── RAG_INTEGRATION_ARCHITECTURE.md         # Future RAG & pgvector integration blueprint
    ├── src/
    │   ├── server.js                               # Express app entrypoint & route mounting
    │   ├── config/
    │   │   └── supabase.js                         # Supabase client & connectivity ping
    │   ├── controllers/
    │   │   ├── healthController.js                 # Health check handlers
    │   │   ├── schemeController.js                 # Scheme listing, filtering, search, comparison
    │   │   └── ragController.js                    # Future RAG interface handlers
    │   ├── middleware/
    │   │   ├── errorHandler.js                     # 404 & global error handling
    │   │   ├── logger.js                           # HTTP request logger
    │   │   └── validator.js                        # Request query & body sanitizers
    │   ├── routes/
    │   │   ├── healthRoutes.js                     # Health check routes
    │   │   ├── schemeRoutes.js                     # Scheme discovery routes
    │   │   └── ragRoutes.js                        # RAG interface routes
    │   ├── services/
    │   │   └── rag/
    │   │       └── ragService.js                   # Abstract RagServiceInterface & safe Stub
    │   └── utils/
    │       └── response.js                         # Standardized JSON response envelope
    └── tests/
        ├── test_api.js                             # API integration tests
        └── complete_read_only_test.js              # 19-suite read-only test runner
```

---

## 📄 License
This project is open-source and intended for academic and public welfare purposes.
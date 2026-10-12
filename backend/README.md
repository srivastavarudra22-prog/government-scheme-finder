# Government Scheme Finder - Backend API

Production-ready Node.js & Express REST API for the **Government Scheme Finder**, powered by a live PostgreSQL database on **Supabase** with 4,732 real government schemes.

---

## Features

- **Scheme Listing & Pagination:** Browse 4,732 schemes with page and limit controls, sorting, and category filters.
- **Full-Text & Keyword Search:** Search schemes by keyword (title, description, and full-text search).
- **Citizen Eligibility Engine:** Filter schemes using real criteria:
  - Age (with numeric min/max bounds)
  - Annual Income (with ceiling comparison & BPL flag)
  - State (Central schemes + state-specific schemes)
  - Occupation (`Farmer`, `Student`, `Entrepreneur`, etc.)
  - Education (`Undergraduate`, `ITI / Diploma`, etc.)
  - Gender (`Any`, `Female`, `Male`)
  - Social Category / Caste (`All`, `SC`, `ST`, `SC/ST`, `OBC`, `Minority`, `General`)
  - Area (`Rural`, `Urban`, `Both`)
  - Target Entity Type (`Individual`, `Organization / Institution`, etc.)
- **Scheme Details:** Single-record retrieval with complete narrative, legal prerequisites, benefits, required documents, and application steps.
- **Side-by-Side Comparison:** Compare 2 to 5 schemes concurrently via GET or POST with a structured side-by-side comparison matrix.
- **Health & DB Monitoring:** Live database latency check, table ping, and uptime monitoring.
- **Robust Security:** Zero service-role secrets exposed; uses standard Supabase publishable credentials with Row-Level Security (RLS).

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
A `.env` file is provided. To customize or duplicate:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://zimtkipchserutfmoaqd.supabase.co
SUPABASE_ANON_KEY=your-publishable-anon-key
```

### 3. Start the Server
```bash
npm start
```
The server will start on `http://localhost:5000`.

### 4. Run the Automated Test Suite
```bash
npm test
```
Runs 20 automated integration tests directly against the live Supabase database.

---

## API Endpoints Reference

### Health & Connectivity
- `GET /api/health` - Basic API status and uptime.
- `GET /api/health/db` - Live Supabase database ping and row count check.

### Schemes
- `GET /api/schemes` - List schemes with pagination (`page`, `limit`, `state`, `primary_category`, `govt_tier`, `sortBy`, `sortOrder`).
- `GET /api/schemes/search?q=tractor` - Search schemes by query string.
- `GET /api/schemes/filter` - Multi-factor citizen eligibility filtering (`age`, `income`, `state`, `occupation`, `education`, `gender`, `category`, `area`, `is_bpl`).
- `GET /api/schemes/:id` - Fetch complete scheme details by numeric ID (e.g., `1`) or slug (e.g., `pmsby`).
- `GET /api/schemes/compare?ids=1,2,3` - Side-by-side comparison matrix for 2–5 schemes.
- `POST /api/schemes/compare` - Same comparison via POST body `{ "ids": [1, 2, 3] }`.
- `GET /api/schemes/metadata/filters` - Distinct options for frontend dropdowns (states, occupations, categories, caste).

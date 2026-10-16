# Government Scheme Finder — Frontend 🇮🇳

Single-Page Application (SPA) built with **React 19**, **Vite 8**, and **Tailwind CSS v4** for exploring, filtering, comparing, and tracking government welfare schemes.

---

## 🛠️ Tech Stack & Architecture

- **React 19:** Modern functional component architecture with hooks and React Context.
- **Vite 8:** Lightning-fast build tooling and Hot Module Replacement (HMR).
- **Tailwind CSS v4:** Modern utility styling with custom responsive breakpoints.
- **React Router v7:** Dynamic declarative client-side routing.
- **Route-Level Code Splitting:** Dynamic `React.lazy()` and `React.Suspense` wrapping all pages, keeping initial main bundle under 285 kB.
- **Lucide Icons:** Clean, accessible SVG iconography.
- **Zero Frontend Secrets:** No Supabase service-role keys or database credentials; all communication passes through the Express REST API.

---

## 🧭 Page Routes & Views

### Public Routes (with Top Navbar & Footer)
- `/`: **Landing Page** — Hero banner, statistical counters, highlights, category shortcuts, search input.
- `/login`: **Citizen Login** — Email and password authentication with validation.
- `/signup`: **Citizen Registration** — Account creation with Supabase Auth.
- `*`: **Not Found Page** — Friendly 404 handler with redirection links.

### Protected Routes (with Dark Persistent Sidebar Shell)
- `/dashboard`: **Citizen Dashboard** — Quick stats, recommended schemes, tracked applications overview, recent activity.
- `/profile`: **Profile Management** — Citizen demographic editor (state, gender, age, occupation, education, caste, BPL status) synchronizing with PostgreSQL `public.profiles`.
- `/find-schemes`: **Eligibility Wizard** — Interactive form matching schemes against personal demographic criteria.
- `/results`: **Scheme Discovery & Results** — Paginated schemes grid, instant search, category filters, and comparison selector.
- `/schemes/:id`: **Scheme Details Page** — Narrative descriptions, eligibility criteria, benefits highlights, "Apply Officially" smart redirection, bookmarking, and tracking.
- `/saved-schemes`: **Saved Schemes** — Citizen bookmarked schemes with category filters, search, and removal controls.
- `/applications`: **Application Tracker** — Personal tracking dashboard with stages (`Interested`, `Applied`, `Under Review`, `Approved`, `Rejected`, `Completed`), reference IDs, and notes.
- `/chat`: **AI Chat Assistant UI** — Citizen conversational interface with suggestion chips and structured placeholder feedback.
- `/notifications`: **Notifications** — Citizen alerts, deadline reminders, and scheme updates.
- `/settings`: **Settings** — Profile settings, password management via Supabase Auth, notifications preferences, and session logout.

---

## 🚀 Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` from template:
```bash
cp .env.example .env
```

Default configuration for local development:
```env
# Uses Vite reverse proxy configured in vite.config.js to forward to http://localhost:5000
VITE_API_URL=/api
```

### 3. Start Development Server
```bash
npm run dev
```
Access the application at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
Production assets are generated in `dist/`.

---

## 📱 Responsive Support

The frontend is verified across:
- **Desktop (1280px+)**: Multi-column grids, persistent 64-column dark sidebar, desktop navbar.
- **Laptop (1024px)**: Fluid layouts adapting cleanly at the `lg` breakpoint.
- **Tablet (768px)**: Flexible search toolbars, collapsible cards, and touch-ready buttons.
- **Mobile (375px - 640px)**: Slide-over drawer navigation overlay, sticky mobile header, single-column forms, touch targets exceeding 44px.

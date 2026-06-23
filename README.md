# Dispatch Schedule - Route Planner

A single-page React app for optimizing trip assignments to drivers using greedy nearest-neighbor routing algorithms. Visualizes routes on a map and shift timelines in real-time.

## Features

- **Supabase Integration**: Real-time driver & trip data from PostgreSQL
- **Three Optimization Strategies**: Minimize deadhead miles, minimize idle time, or balance workload
- **Shift Timeline Visualization**: Gantt chart showing service, deadhead, and idle blocks
- **Interactive SVG Map**: Click drivers to highlight their assigned routes
- **Nominatim Geocoding**: Automatically fetch coordinates for pickup/dropoff locations
- **Driver Hours Respect**: Enforces shift windows; defaults to 8h shifts when end time missing
- **Selective Routing**: Only routes unassigned trips; locks pre-assigned ones (driver_name/vehicle_ref already set)
- **KPI Dashboard**: Real-time metrics (assigned, unrouted, deadhead hours, idle hours)
- **Date Picker**: Plan any date's trips, defaults to today

## Setup

### Prerequisites
- Node.js 18+
- Supabase project with tables: `drivers`, `vehicles`, `trips`

### 1. Clone & Install

```bash
npm install
```

### 2. Configure Supabase Credentials

Create a `.env.local` file in the project root (copy from `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get credentials from your Supabase project's API settings:
- **URL**: Project Settings → API → Project URL
- **Anon Key**: Project Settings → API → anon/public key

### 3. Database Schema

Ensure these tables exist in your Supabase project:

```sql
-- drivers
-- Columns: id, name, origin_city, origin_lat, origin_lng

-- vehicles
-- Columns: id, [name, capacity, ...]

-- trips
-- Columns: id, date, time, vehicle_ref, pickup, dropoff, passenger, driver_name
```

**Notes:**
- `vehicle_ref` and `driver_name` indicate pre-assigned trips (these are locked and won't be re-routed)
- Pickup/dropoff are location names that will be geocoded via Nominatim (no coordinates in DB)
- `time` is in HH:MM format (e.g., "09:30")

### 4. Run Locally

```bash
npm run dev
```

App opens at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
npm run preview
```

Outputs optimized bundle to `dist/`

## Usage

1. **Log In**: Create account or sign in with email/password (Supabase Auth)
2. **Select Date**: Date picker defaults to today; choose any date to view trips
3. **Configure Generator**:
   - **Optimize for**: Choose strategy (least deadhead/idle, or balanced load)
   - **Respect driver hours**: Toggle to enforce shift windows
   - **Max idle per leg**: Adjust cap on wait time between trips (5-120 min)
4. **Generate Schedule**: Click "Generate Schedule" to run algorithm
5. **Inspect Results**:
   - Map highlights routes by driver; click driver pin to focus
   - Timeline shows shift utilization with service/deadhead/idle blocks
   - KPIs show assignment success, unrouted trips, and efficiency metrics
6. **Clear & Retry**: "Clear" button resets state to planning mode; adjust config and regenerate

## Architecture

```
src/
├── App.tsx                 # Auth routing & session management
├── pages/
│   ├── LoginPage.tsx       # Supabase email/password form
│   └── DispatchPage.tsx    # Main dispatch orchestrator
├── components/
│   ├── LeftPanel.tsx       # Generator config + trip queue
│   ├── MapViz.tsx          # SVG map rendering
│   ├── GanttTimeline.tsx   # Shift timeline viz
│   └── RightPanel.tsx      # Fleet cards + KPIs
├── services/
│   ├── supabase.ts         # Supabase client init
│   ├── driverService.ts    # Driver queries
│   ├── tripService.ts      # Trip queries & filtering
│   └── geocodingService.ts # Nominatim geocoding + caching
├── algorithm/
│   └── router.ts           # Greedy routing algorithm
├── types/
│   └── index.ts            # TypeScript interfaces
└── styles/
    └── index.css           # Tailwind + custom utilities
```

## Algorithm Details

**Greedy Nearest-Driver Assignment:**

1. Sort trips by appointment time (earliest first)
2. For each trip, find the best driver by:
   - Calculating deadhead time (distance × 1.5 min/km)
   - Checking if driver can arrive in time
   - Respecting shift window (start + 8h default if missing end)
   - Applying idle cap threshold
   - Scoring by strategy (deadhead distance, idle time, or cumulative duty)
3. Assign to best-scoring driver or mark unrouted
4. Update driver state (position, free time, hours, idle)

**Time Calculations:**
- All times in minutes from midnight (00:00 = 0, 23:59 = 1439)
- Shift window defaults to signin + 8 hours if `end_time` is NULL
- Travel time = distance (km) × 1.5 (rough urban average)

## Limitations (v1)

- Preview-only: No writes to Supabase (no schedule persistence)
- No vehicle capacity checking
- Greedy single-pass algorithm (not globally optimal)
- No multi-stop optimization (each trip is independent)
- Mobile layout not designed (desktop-first flex layout)

## Future Enhancements (v2+)

- [ ] Save generated schedules to Supabase
- [ ] Vehicle capacity validation
- [ ] Dynamic trip filtering (by status, location, passenger)
- [ ] Manual drag-drop reassignment UI
- [ ] Export to PDF/email
- [ ] Mobile responsive redesign
- [ ] Historical schedule comparison
- [ ] Driver notes & communication

## Deployment

### Vercel (Recommended)

```bash
npm run build
# Connect repo to Vercel, select root as project root
vercel deploy
```

Add env vars in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Netlify

```bash
npm run build
# Drag dist/ folder to Netlify, or connect Git repo
```

Site settings → Environment → add VITE_* vars

### Self-Hosted

```bash
npm run build
# Serve dist/ folder with any static web server
# (nginx, Apache, or Node.js)
```

## Troubleshooting

**"Missing Supabase environment variables"**
- Ensure `.env.local` exists with correct VITE_* keys
- Restart dev server after changes

**Trips not loading**
- Check Supabase table has trips for selected date
- Verify date format in DB is YYYY-MM-DD
- Check browser console for error messages

**Geocoding stuck/slow**
- Nominatim has rate limits (1 req/sec); first run takes time
- Results are cached; subsequent runs are instant
- Check browser console for failed geocodes (location typos?)

**Routes not rendering**
- Ensure trips have valid pickup/dropoff location names
- Geocoding must succeed before algorithm runs
- Check "Unrouted" KPI—trips may not fit within driver shifts

## License

Internal Homehub project. All rights reserved.

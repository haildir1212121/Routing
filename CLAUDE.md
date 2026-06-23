# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server (http://localhost:5173)
npm run build                  # Build for production (outputs to dist/)
npm run preview               # Preview production build locally
```

Dev server auto-opens browser and hot-reloads on changes.

## Codebase Overview

**Dispatch Route Planner** is a single-page React app for optimizing trip-to-driver assignments. It fetches real data from Supabase, geocodes trip locations via Nominatim, runs a greedy routing algorithm, and visualizes results on a map + Gantt timeline.

### Architecture

**Data Flow:**
```
1. User logs in (Supabase Auth)
2. Select date in date picker
3. Load drivers & trips from Supabase
4. Geocode trip pickup/dropoff locations (Nominatim, cached)
5. User tweaks config (strategy, hours, idle cap)
6. Click "Generate Schedule" → run algorithm
7. Display results (map routes, timeline, KPIs)
```

**Core Layers:**

1. **Auth & Routing** (`src/App.tsx`)
   - Supabase session check
   - Routes to LoginPage or DispatchPage

2. **Main Dispatch UI** (`src/pages/DispatchPage.tsx`)
   - Orchestrates data loading, algorithm execution, and panel state
   - Manages selected driver highlight across all visualizations
   - Caches routing results to avoid re-computing on view changes

3. **Data Services** (`src/services/`)
   - `supabase.ts`: Client initialization with env var credentials
   - `driverService.ts`: Fetches all drivers (no filtering; shift windows added per-config)
   - `tripService.ts`: Fetches trips for date, filters to unassigned only (skips vehicle_ref/driver_name set)
   - `geocodingService.ts`: Nominatim API calls with in-memory LRU cache and 1 req/sec throttle

4. **Routing Algorithm** (`src/algorithm/router.ts`)
   - `generateRouting()`: Takes drivers, trips, config → returns RoutingResult
   - Greedy assignment: sort trips by time, for each trip find best driver by score
   - Score = deadhead (distance), idle (wait time), or balance (total duty)
   - Respects shift windows; if end_time missing, defaults to start + 8h

5. **UI Components** (`src/components/`)
   - `LeftPanel`: Generator config (strategy buttons, hour toggle, idle slider) + scrollable trip queue
   - `MapViz`: SVG canvas (~1000×620px) with grid, zones, trip pickups, driver routes
   - `GanttTimeline`: Shift timeline with sticky hour ruler, service/deadhead/idle blocks
   - `RightPanel`: Driver cards (utilization bars, shift, trip counts) + KPIs footer

### Key Design Decisions

- **React + Vite**: Fast dev loop, TypeScript support, minimal config
- **TailwindCSS**: Utility-first, consistent with design mockup spacing/colors
- **All client-side routing**: No backend API; Supabase client queries directly; Nominatim calls from browser
- **Preview-only v1**: Algorithm output not saved to DB (guards against dev mistakes)
- **Unassigned-trips-only**: Trips with `vehicle_ref` or `driver_name` already set are locked (enables partial re-planning)
- **Greedy algorithm**: Single-pass, O(n×m) complexity; fast enough for ~50 drivers × ~1000 trips

### Data Types & Schemas

All types in `src/types/index.ts`. Key shapes:

```typescript
Trip {
  id, date, time,                           // from Supabase
  vehicle_ref?, driver_name?,               // pre-assigned flags
  pickup, dropoff,                          // location names (not coordinates)
  pickup_lat?, pickup_lng?, ... (enriched)  // added by geocoding
}

Driver {
  id, name, origin_city, origin_lat, origin_lng  // from Supabase
  vehicle_name?, vehicle_id?  // optional enrichment
}

DriverState extends Driver {
  pos, free, shift, legs[], onDuty, idle, trips  // mutable state after routing
}

RoutingResult {
  drv: DriverState[],                      // updated drivers
  assign: { tripId → driverId },           // assignment map
  unrouted: tripId[]                       // trips that couldn't fit
}
```

### Nominatim Geocoding

- Called in `DispatchPage` after fetching trips, before user can generate
- Batches all pickup/dropoff location names, respects 1 req/sec rate limit
- Results cached in `geocodingService.ts` (in-memory Map)
- Bounding box set to Eugene/Springfield area (lat 43.5–44.2, lng -123.5 to -123.0)
- If geocode fails for a location, trips referencing it are marked unrouted

### Shift Windows & Hours

- Trips stored with `time` (HH:MM, e.g., "09:30")
- Drivers stored with `origin_lat/lng` and implicitly with shift (assumed 6am–5pm by default, i.e., 360–1020 min)
- **Real production data**: Shifts likely come from sign-in/sign-out times; if sign-out is NULL, algorithm assumes 8h
- Algorithm checks: `tripTime + serviceDuration <= shiftEnd` (respects full service completion within window)

### Styling & Tailwind

- Base config in `tailwind.config.js` with design colors/fonts (Inter, Inter Tight, JetBrains Mono)
- Global styles in `src/styles/index.css` (Tailwind directives + custom components)
- Component classes use Tailwind utilities; minimize custom CSS
- Color variables: `bg-primary` (#faf9f8), `bg-secondary` (#fff), `border` (#e5e7eb), `text-primary` (#1a1a1a), etc.

### SVG Map Rendering

- Coordinate system: lat/lng bounding box → screen pixels (simple linear transform in `MapViz.tsx`)
- Grid background + zone labels for reference
- Before generate: unassigned trip pickups shown as faint circles
- After generate: driver routes as solid/dashed lines, pins for pickup/dropoff
- Selected driver routes highlighted (thicker lines, different color)
- Driver origin pins clickable to select/deselect

## Common Tasks

### Adding a New Optimization Strategy

1. Add strategy ID to `RoutingConfig` type in `src/types/index.ts`
2. Add button in `LeftPanel` strategy selector
3. Update score calculation in `src/algorithm/router.ts` `generateRouting()` function
4. Re-run and test with sample data

### Changing Map Bounds or Geocoding Region

- Update `BOUNDS` object in `src/components/MapViz.tsx` (lat/lng extents)
- Update `viewbox` bounding box in `src/services/geocodingService.ts` (Nominatim search area)
- Both should match your service region

### Handling Pre-Assigned Trips

- Algorithm skips trips where `trip.vehicle_ref` or `trip.driver_name` is set
- To enable re-planning pre-assigned trips in future: modify `tripService.ts` `fetchTripsForDate()` filter

### Extending with Database Writes

- Currently all changes are in-memory (preview-only)
- To persist schedules: add `saveSchedule()` function in `tripService.ts` that calls `supabase.from('trips').update(...)`
- Add a "Save Schedule" button in `DispatchPage` that calls this after generation

## Environment Variables

Required in `.env.local`:
- `VITE_SUPABASE_URL` - Project URL (https://xxx.supabase.co)
- `VITE_SUPABASE_ANON_KEY` - Public anon key

Missing vars throw error on app load. See `.env.example` for template.

## Testing the App Locally

1. Set up Supabase project with `drivers`, `vehicles`, `trips` tables
2. Add sample data (or use existing production data filtered to small date)
3. Create `.env.local` with credentials
4. `npm run dev`
5. Log in with any email/password (Supabase will create account)
6. Pick a date with trips, click "Generate Schedule"
7. Inspect map, timeline, and KPIs

## v1 Constraints & Future Work

**What's NOT in v1:**
- No schedule persistence (preview-only)
- No vehicle capacity checking
- No vehicle availability window (assumes all available)
- No passenger preference or special handling
- No manual drag-drop reassignment (view-only)
- No export/email/PDF
- Not optimized for mobile (desktop-only layout)

**Likely v2 requests:**
- Save to Supabase + approval workflow
- Capacity & vehicle routing constraints
- Driver preferences / skill matching
- Manual tweaks before saving
- Bulk trip upload
- Historical comparison & analytics

## Debugging Tips

- **Geocoding failures**: Check browser DevTools Network tab for Nominatim 429 (rate limit) or 404 (location not found)
- **Algorithm producing unexpected results**: Add `console.log()` in `generateRouting()` to inspect scores & driver selection
- **Trips not loading**: Check Supabase console for trips with correct `date` (YYYY-MM-DD format)
- **Routes not rendering on map**: Verify geocoding succeeded (all trip.pickup_lat/lng should be set); check console for Nominatim errors
- **Auth stuck on login**: Supabase CORS or credentials wrong; check browser console for 403/401 errors

## Useful Links

- [Supabase Docs](https://supabase.com/docs) - Auth, PostgREST API, tables
- [React Docs](https://react.dev) - Hooks, effects, state management
- [Tailwind Docs](https://tailwindcss.com/docs) - Utility classes, responsive design
- [Nominatim API Docs](https://nominatim.org/release-docs/latest/api/Overview/) - Geocoding parameters
- [Vite Docs](https://vitejs.dev) - Build, env vars, dev server

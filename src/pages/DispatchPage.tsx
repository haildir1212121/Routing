import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { fetchDrivers } from '../services/driverService'
import { fetchTripsForDate } from '../services/tripService'
import { geocodeBatch } from '../services/geocodingService'
import { generateRouting } from '../algorithm/router'
import { Driver, Trip, RoutingConfig, RoutingResult } from '../types'
import LeftPanel from '../components/LeftPanel'
import MapViz from '../components/MapViz'
import GanttTimeline from '../components/GanttTimeline'
import RightPanel from '../components/RightPanel'

export default function DispatchPage() {
  // State management
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)

  // Routing config
  const [config, setConfig] = useState<RoutingConfig>({
    strategy: 'deadhead',
    respectHours: true,
    maxIdle: 45,
  })

  // Routing result
  const [result, setResult] = useState<RoutingResult | null>(null)

  // Load drivers and trips on component mount and date change
  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    setLoading(true)
    setGenerated(false)
    setResult(null)

    try {
      // Fetch drivers
      const driversData = await fetchDrivers()
      setDrivers(driversData)

      // Fetch trips for selected date
      const tripsData = await fetchTripsForDate(selectedDate)

      // Geocode trip locations
      const locationsToGeocode = new Set<string>()
      tripsData.forEach((trip) => {
        if (trip.pickup) locationsToGeocode.add(trip.pickup)
        if (trip.dropoff) locationsToGeocode.add(trip.dropoff)
      })

      console.log('Geocoding locations:', Array.from(locationsToGeocode))
      const geocoded = await geocodeBatch(Array.from(locationsToGeocode))

      // Enrich trips with coordinates
      const enrichedTrips = tripsData.map((trip) => ({
        ...trip,
        pickup_lat: geocoded.get(trip.pickup)?.lat,
        pickup_lng: geocoded.get(trip.pickup)?.lng,
        dropoff_lat: geocoded.get(trip.dropoff)?.lat,
        dropoff_lng: geocoded.get(trip.dropoff)?.lng,
      }))

      setTrips(enrichedTrips)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = useCallback(() => {
    if (drivers.length === 0 || trips.length === 0) {
      console.log('Cannot generate: missing drivers or trips')
      return
    }

    const routingResult = generateRouting(drivers, trips, config)
    setResult(routingResult)
    setGenerated(true)
    console.log('Routing result:', routingResult)
  }, [drivers, trips, config])

  const handleReset = () => {
    setGenerated(false)
    setResult(null)
    setSelectedDriver(null)
  }

  const handleStrategyChange = (strategy: 'deadhead' | 'idle' | 'balance') => {
    setConfig((c) => ({ ...c, strategy }))
  }

  const handleToggleHours = () => {
    setConfig((c) => ({ ...c, respectHours: !c.respectHours }))
  }

  const handleIdleChange = (delta: number) => {
    setConfig((c) => ({
      ...c,
      maxIdle: Math.max(5, c.maxIdle + delta),
    }))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // Status indicators
  const statusDot = generated ? '#10b981' : '#ef4444'
  const statusLabel = generated ? 'SCHEDULED' : 'PLANNING'

  return (
    <div className="flex h-screen w-screen bg-bg-primary overflow-hidden">
      {/* Icon Rail */}
      <div className="w-15 flex-none bg-bg-secondary border-r border-border flex flex-col items-center py-3.5 gap-1.5 shadow-sm">
        <div className="w-8 h-8 rounded bg-text-primary text-bg-secondary font-tight font-bold text-lg flex items-center justify-center mb-2.5">
          D
        </div>
        <div className="icon-btn text-text-tertiary hover:text-text-primary">
          <i className="ph-bold ph-squares-four text-base"></i>
        </div>
        <div className="icon-btn bg-text-primary text-bg-secondary">
          <i className="ph-bold ph-map-trifold text-base"></i>
        </div>
        <div className="icon-btn text-text-tertiary hover:text-text-primary">
          <i className="ph-bold ph-steering-wheel text-base"></i>
        </div>
        <div className="icon-btn text-text-tertiary hover:text-text-primary">
          <i className="ph-bold ph-chat-circle-text text-base"></i>
        </div>
        <div className="mt-auto icon-btn text-text-tertiary hover:text-text-primary cursor-pointer" onClick={handleLogout}>
          <i className="ph-bold ph-sign-out text-base"></i>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-none bg-bg-primary/85 backdrop-blur-md border-b border-border px-6 py-3.5 flex items-end justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-text-tertiary mb-1.5">
              Operations · Route Planner
            </div>
            <div className="font-tight text-3xl font-semibold -tracking-tighter text-text-primary">
              Dispatch Schedule.
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusDot }}></span>
              {statusLabel}
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-bg-secondary border border-border rounded text-text-secondary font-medium text-xs hover:bg-border transition-all flex items-center gap-1.5"
            >
              <i className="ph-bold ph-arrow-counter-clockwise text-sm"></i>
              Clear
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || trips.length === 0}
              className="px-4 py-2 bg-text-primary text-bg-secondary rounded font-medium text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <i className="ph-bold ph-sparkle text-sm"></i>
              Generate Schedule
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <LeftPanel
            config={config}
            trips={trips}
            result={generated ? result : null}
            selectedDriver={selectedDriver}
            onStrategyChange={handleStrategyChange}
            onToggleHours={handleToggleHours}
            onIdleChange={handleIdleChange}
            onDateChange={setSelectedDate}
            selectedDate={selectedDate}
            loading={loading}
          />

          <div className="flex-1 flex flex-col min-h-0">
            <MapViz
              drivers={drivers}
              trips={trips}
              result={generated ? result : null}
              selectedDriver={selectedDriver}
              onSelectDriver={setSelectedDriver}
            />
            <GanttTimeline
              result={generated ? result : null}
              selectedDriver={selectedDriver}
              onSelectDriver={setSelectedDriver}
            />
          </div>

          <RightPanel
            result={generated ? result : null}
            drivers={drivers}
            selectedDriver={selectedDriver}
            onSelectDriver={setSelectedDriver}
          />
        </div>
      </div>
    </div>
  )
}

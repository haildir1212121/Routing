import { Driver, Trip, RoutingResult } from '../types'

interface MapVizProps {
  drivers: Driver[]
  trips: Trip[]
  result: RoutingResult | null
  selectedDriver: string | null
  onSelectDriver: (id: string | null) => void
}

// Simple bounds for Eugene/Springfield area (lat/lng to screen coords)
const BOUNDS = {
  minLat: 43.5,
  maxLat: 44.2,
  minLng: -123.5,
  maxLng: -123.0,
}

const MAP_WIDTH = 1000
const MAP_HEIGHT = 620

function latLngToScreen(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * MAP_WIDTH
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * MAP_HEIGHT
  return { x, y }
}

export default function MapViz({
  drivers,
  trips,
  result,
  selectedDriver,
  onSelectDriver,
}: MapVizProps) {
  const renderMap = () => {
    const elements: JSX.Element[] = []

    // Grid lines
    for (let i = 1; i < 10; i++) {
      const x = (i * 100) / 10
      const y = (i * 100) / 10
      elements.push(
        <line
          key={`gridx-${i}`}
          x1={`${x}%`}
          y1="0"
          x2={`${x}%`}
          y2="100%"
          stroke="#f0efed"
          strokeWidth="1"
        />
      )
      elements.push(
        <line
          key={`gridy-${i}`}
          x1="0"
          y1={`${y}%`}
          x2="100%"
          y2={`${y}%`}
          stroke="#f0efed"
          strokeWidth="1"
        />
      )
    }

    // Zone labels (Eugene/Springfield zones)
    const zones = [
      { name: 'COBURG', lat: 43.95, lng: -123.25 },
      { name: 'GATEWAY', lat: 43.98, lng: -123.15 },
      { name: 'SPRINGFIELD', lat: 43.85, lng: -123.1 },
      { name: 'DOWNTOWN', lat: 43.88, lng: -123.3 },
      { name: 'WEST EUGENE', lat: 43.85, lng: -123.35 },
      { name: 'SOUTH EUGENE', lat: 43.78, lng: -123.25 },
    ]

    zones.forEach((zone, i) => {
      const { x, y } = latLngToScreen(zone.lat, zone.lng)
      elements.push(
        <text
          key={`zone-${i}`}
          x={x}
          y={y}
          fill="#c9c7c3"
          fontFamily="'JetBrains Mono',monospace"
          fontSize="10"
          letterSpacing="0.12em"
          textAnchor="middle"
        >
          {zone.name}
        </text>
      )
    })

    // Render trips or routes
    if (result) {
      // Routes after generation
      result.drv.forEach((driver) => {
        const isActive = !selectedDriver || selectedDriver === driver.id
        const svcColor = selectedDriver === driver.id ? '#D97757' : isActive ? '#1a1a1a' : '#e5e7eb'
        const deadColor = selectedDriver === driver.id ? '#D97757' : isActive ? '#9ca3af' : '#ececec'

        let prevPos = { lat: driver.origin_lat, lng: driver.origin_lng }

        driver.legs.forEach((leg, i) => {
          const pickupPos = latLngToScreen(leg.trip.pickup_lat!, leg.trip.pickup_lng!)
          const dropoffPos = latLngToScreen(leg.trip.dropoff_lat!, leg.trip.dropoff_lng!)
          const prevScreenPos = latLngToScreen(prevPos.lat, prevPos.lng)

          // Deadhead line (dashed)
          elements.push(
            <line
              key={`deadhead-${driver.id}-${i}`}
              x1={prevScreenPos.x}
              y1={prevScreenPos.y}
              x2={pickupPos.x}
              y2={pickupPos.y}
              stroke={deadColor}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          )

          // Service line
          elements.push(
            <line
              key={`service-${driver.id}-${i}`}
              x1={pickupPos.x}
              y1={pickupPos.y}
              x2={dropoffPos.x}
              y2={dropoffPos.y}
              stroke={svcColor}
              strokeWidth={selectedDriver === driver.id ? 2.5 : 1.8}
            />
          )

          // Pickup pin
          if (isActive) {
            elements.push(
              <circle
                key={`pickup-${driver.id}-${i}`}
                cx={pickupPos.x}
                cy={pickupPos.y}
                r={3.5}
                fill="#fff"
                stroke={svcColor}
                strokeWidth={1.5}
              />
            )
            // Dropoff pin
            elements.push(
              <circle
                key={`dropoff-${driver.id}-${i}`}
                cx={dropoffPos.x}
                cy={dropoffPos.y}
                r={2.5}
                fill={svcColor}
              />
            )
          }

          prevPos = { lat: leg.trip.dropoff_lat!, lng: leg.trip.dropoff_lng! }
        })
      })
    } else {
      // Unassigned trips before generation
      trips.forEach((trip, i) => {
        if (!trip.pickup_lat || !trip.pickup_lng) return
        const pos = latLngToScreen(trip.pickup_lat, trip.pickup_lng)
        elements.push(
          <circle
            key={`trip-${i}`}
            cx={pos.x}
            cy={pos.y}
            r={3}
            fill="#fff"
            stroke="#d1d5db"
            strokeWidth={1.5}
          />
        )
      })
    }

    // Driver origin pins (on top)
    drivers.forEach((driver, i) => {
      const isActive = !selectedDriver || selectedDriver === driver.id
      const fill = selectedDriver === driver.id ? '#D97757' : isActive ? '#000' : '#cfcdc9'
      const pos = latLngToScreen(driver.origin_lat, driver.origin_lng)

      elements.push(
        <circle
          key={`driver-origin-${i}`}
          cx={pos.x}
          cy={pos.y}
          r={7}
          fill={fill}
          onClick={() => onSelectDriver(selectedDriver === driver.id ? null : driver.id)}
          style={{ cursor: 'pointer' }}
        />
      )

      elements.push(
        <text
          key={`driver-label-${i}`}
          x={pos.x}
          y={pos.y + 3.2}
          fill="#fff"
          fontFamily="'JetBrains Mono',monospace"
          fontSize="8"
          fontWeight="600"
          textAnchor="middle"
          style={{ pointerEvents: 'none' }}
        >
          {driver.name.split(' ')[1]?.[0] || 'D'}
        </text>
      )
    })

    return elements
  }

  return (
    <div className="flex-1 relative bg-bg-primary overflow-hidden">
      <div className="absolute top-3.5 left-4 z-10 flex items-center gap-2">
        <span className="w-1 h-3.5 bg-text-primary rounded-sm"></span>
        <span className="font-mono text-xs tracking-wider text-text-tertiary">03</span>
        <span className="font-tight text-sm font-semibold text-text-primary">Service area.</span>
      </div>

      <div className="absolute top-3 right-4 z-10 flex items-center gap-3 bg-bg-secondary/80 border border-border rounded-lg p-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-0.5 bg-text-primary"></span>
          <span className="font-mono text-xs text-text-secondary uppercase tracking-tighter">Service</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-px border-t-2 border-dashed border-text-tertiary"></span>
          <span className="font-mono text-xs text-text-secondary uppercase tracking-tighter">Deadhead</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
      >
        {renderMap()}
      </svg>
    </div>
  )
}

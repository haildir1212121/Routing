import { Driver, Trip, RoutingConfig, DriverState, RoutingResult, DriverLeg } from '../types'

function distance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function travelTimeMinutes(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const distKm = distance(lat1, lng1, lat2, lng2)
  return Math.round(distKm * 1.5) // ~1.5 min/km average
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function generateRouting(
  drivers: Driver[],
  trips: Trip[],
  config: RoutingConfig
): RoutingResult {
  // Initialize driver state
  const driverStates: DriverState[] = drivers.map((d) => ({
    ...d,
    pos: { lat: d.origin_lat, lng: d.origin_lng },
    free: 360, // Default 6am start (in minutes from 00:00)
    legs: [],
    onDuty: 0,
    idle: 0,
    trips: 0,
    shift: [360, 1020], // Default 6am-5pm (6 hours = 360 mins from midnight to 360min-point, but need shift window like 6am-5pm = 360-1020)
  }))

  const assign: Record<string, string> = {}
  const unrouted: string[] = []

  // Sort trips by appointment time
  const sortedTrips = [...trips].sort((a, b) => {
    const timeA = timeToMinutes(a.time)
    const timeB = timeToMinutes(b.time)
    return timeA - timeB
  })

  // Greedy assignment
  for (const trip of sortedTrips) {
    if (!trip.pickup_lat || !trip.pickup_lng || !trip.dropoff_lat || !trip.dropoff_lng) {
      unrouted.push(trip.id)
      continue
    }

    const tripTime = timeToMinutes(trip.time)
    const serviceDuration = travelTimeMinutes(
      trip.pickup_lat,
      trip.pickup_lng,
      trip.dropoff_lat,
      trip.dropoff_lng
    )

    let bestDriver: DriverState | null = null
    let bestScore = Infinity

    for (const driver of driverStates) {
      // Calculate deadhead time from current position to pickup
      const deadheadTime = travelTimeMinutes(
        driver.pos.lat,
        driver.pos.lng,
        trip.pickup_lat,
        trip.pickup_lng
      )

      // When can driver arrive at pickup?
      const arrivalTime = driver.free + deadheadTime

      // Can't make the appointment
      if (arrivalTime > tripTime) continue

      // Idle time while waiting
      const idle = Math.max(0, tripTime - arrivalTime)

      // Check idle cap (soft constraint if no option yet)
      if (idle > config.maxIdle && bestDriver) continue

      // Check shift constraints
      const shiftEnd = driver.shift[1]
      if (config.respectHours && tripTime + serviceDuration > shiftEnd) {
        continue
      }

      // Calculate score based on strategy
      let score: number
      if (config.strategy === 'deadhead') {
        score = deadheadTime
      } else if (config.strategy === 'idle') {
        score = idle
      } else {
        // balance: prioritize drivers with less on-duty time
        score = driver.onDuty + deadheadTime
      }

      if (score < bestScore) {
        bestScore = score
        bestDriver = driver
      }
    }

    if (!bestDriver) {
      unrouted.push(trip.id)
      continue
    }

    // Assign trip to best driver
    const deadheadTime = travelTimeMinutes(
      bestDriver.pos.lat,
      bestDriver.pos.lng,
      trip.pickup_lat,
      trip.pickup_lng
    )
    const arrivalTime = bestDriver.free + deadheadTime
    const idle = Math.max(0, tripTime - arrivalTime)

    const leg: DriverLeg = {
      trip,
      deadStart: bestDriver.free,
      deadEnd: bestDriver.free + deadheadTime,
      svcStart: tripTime,
      svcEnd: tripTime + serviceDuration,
      idle,
    }

    bestDriver.legs.push(leg)
    bestDriver.pos = { lat: trip.dropoff_lat!, lng: trip.dropoff_lng! }
    bestDriver.free = tripTime + serviceDuration
    bestDriver.onDuty += deadheadTime + serviceDuration
    bestDriver.idle += idle
    bestDriver.trips += 1

    assign[trip.id] = bestDriver.id
  }

  return { drv: driverStates, assign, unrouted }
}

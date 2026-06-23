import { Driver, RoutingResult } from '../types'

interface RightPanelProps {
  result: RoutingResult | null
  drivers: Driver[]
  selectedDriver: string | null
  onSelectDriver: (id: string | null) => void
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function RightPanel({
  result,
  drivers,
  selectedDriver,
  onSelectDriver,
}: RightPanelProps) {
  // Calculate KPIs
  let kpiAssigned = 0
  let kpiUnrouted = 0
  let kpiDeadhead = 0
  let kpiIdle = 0

  if (result) {
    kpiAssigned = Object.keys(result.assign).length
    kpiUnrouted = result.unrouted.length
    kpiDeadhead = Math.round(
      result.drv.reduce((sum, d) => {
        return sum + d.legs.reduce((legSum, leg) => legSum + (leg.deadEnd - leg.deadStart), 0)
      }, 0) / 60
    )
    kpiIdle = Math.round(result.drv.reduce((sum, d) => sum + d.idle, 0) / 60)
  }

  const driverCards = result
    ? result.drv.map((driver) => {
        const isSelected = selectedDriver === driver.id
        const utilization = driver.onDuty > 0 ? Math.round((driver.onDuty / (driver.shift[1] - driver.shift[0])) * 100) : 0

        return {
          id: driver.id,
          name: driver.name,
          vehicle: driver.vehicle_name || 'N/A',
          cap: '4 pax',
          initials: driver.name.split(' ').map((n) => n[0]).join(''),
          shift: `${minutesToTime(driver.shift[0])}-${minutesToTime(driver.shift[1])}`,
          trips: driver.trips,
          status: driver.trips > 0 ? 'ASSIGNED' : 'IDLE',
          hours: `${(driver.onDuty / 60).toFixed(1)}`,
          idle: `${(driver.idle / 60).toFixed(1)}`,
          utilization,
          isSelected,
        }
      })
    : drivers.map((d) => ({
        id: d.id,
        name: d.name,
        vehicle: d.vehicle_name || 'N/A',
        cap: '4 pax',
        initials: d.name.split(' ').map((n) => n[0]).join(''),
        shift: '—',
        trips: 0,
        status: '—',
        hours: '0',
        idle: '0',
        utilization: 0,
        isSelected: false,
      }))

  return (
    <div className="w-70 flex-none border-l border-border bg-bg-secondary flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4.5 py-3 flex items-center gap-2 border-b border-border">
        <span className="w-1 h-3.5 bg-text-primary rounded-sm"></span>
        <span className="font-mono text-xs tracking-wider text-text-tertiary">05</span>
        <span className="font-tight text-sm font-semibold text-text-primary">Fleet.</span>
      </div>

      {/* Driver Cards */}
      <div className="flex-1 overflow-y-auto px-3 py-3.5">
        {driverCards.map((driver) => (
          <div
            key={driver.id}
            onClick={() => onSelectDriver(driver.isSelected ? null : driver.id)}
            className={`driver-card ${driver.isSelected ? 'selected' : ''}`}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-semibold text-sm text-bg-secondary ${
                  driver.isSelected ? 'bg-accent' : 'bg-text-primary'
                }`}
              >
                {driver.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text-primary">{driver.name}</div>
                <div className="font-mono text-xs text-text-tertiary truncate">
                  {driver.vehicle} · {driver.cap}
                </div>
              </div>
              <span
                className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded text-white ${
                  driver.trips > 0 ? 'bg-green-600' : 'bg-gray-400'
                }`}
              >
                {driver.status}
              </span>
            </div>

            <div className="flex justify-between font-mono text-xs text-text-tertiary uppercase tracking-tight mb-1">
              <span>{driver.shift}</span>
              <span>{driver.trips} trips</span>
            </div>

            <div className="h-1 bg-gray-200 rounded-sm overflow-hidden mb-1">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${Math.min(driver.utilization, 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between font-mono text-xs text-text-secondary">
              <span>{driver.hours}h on duty</span>
              <span>{driver.idle}h idle</span>
            </div>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="flex-none border-t border-border px-4.5 py-3.5 space-y-2">
        <div className="flex justify-between">
          <span className="font-mono text-xs text-text-tertiary uppercase tracking-widest">Assigned</span>
          <span className="font-mono text-xs font-semibold text-text-primary">{kpiAssigned}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-xs text-text-tertiary uppercase tracking-widest">Unrouted</span>
          <span
            className={`font-mono text-xs font-semibold ${
              kpiUnrouted > 0 ? 'text-red-600' : 'text-text-primary'
            }`}
          >
            {kpiUnrouted}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-xs text-text-tertiary uppercase tracking-widest">Deadhead</span>
          <span className="font-mono text-xs font-semibold text-text-primary">{kpiDeadhead}h</span>
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-xs text-text-tertiary uppercase tracking-widest">Total idle</span>
          <span className="font-mono text-xs font-semibold text-text-primary">{kpiIdle}h</span>
        </div>
      </div>
    </div>
  )
}

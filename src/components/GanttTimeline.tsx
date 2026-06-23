import { RoutingResult } from '../types'

interface GanttTimelineProps {
  result: RoutingResult | null
  selectedDriver: string | null
  onSelectDriver: (id: string | null) => void
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function GanttTimeline({
  result,
  selectedDriver,
  onSelectDriver,
}: GanttTimelineProps) {
  if (!result) {
    return (
      <div className="flex-none h-56 border-t border-border bg-bg-secondary flex flex-col">
        <div className="px-4.5 py-3 flex items-center gap-2 border-b border-border">
          <span className="w-1 h-3.5 bg-text-tertiary rounded-sm"></span>
          <span className="font-mono text-xs tracking-wider text-text-tertiary">04</span>
          <span className="font-tight text-sm font-semibold text-text-primary">Shift timeline.</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-center">
          <div className="text-xs text-text-tertiary">Generate a schedule to see timeline</div>
        </div>
      </div>
    )
  }

  const hourTicks: string[] = []
  for (let h = 5; h <= 17; h++) {
    hourTicks.push(String(h).padStart(2, '0'))
  }

  const dayStart = 300 // 5am
  const dayEnd = 1020 // 5pm
  const span = dayEnd - dayStart

  const pct = (m: number) => ((m - dayStart) / span) * 100

  return (
    <div className="flex-none h-56 border-t border-border bg-bg-secondary flex flex-col">
      <div className="px-4.5 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3.5 bg-text-tertiary rounded-sm"></span>
          <span className="font-mono text-xs tracking-wider text-text-tertiary">04</span>
          <span className="font-tight text-sm font-semibold text-text-primary">Shift timeline.</span>
        </div>
        <div className="flex gap-3.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-text-primary"></span>
            <span className="font-mono text-xs text-text-secondary uppercase">Service</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-border"></span>
            <span className="font-mono text-xs text-text-secondary uppercase">Deadhead</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm border border-border"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6 3px,#fff 3px,#fff 6px)',
              }}
            ></span>
            <span className="font-mono text-xs text-text-secondary uppercase">Idle</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        {/* Hour ruler */}
        <div className="flex sticky top-0 bg-bg-secondary z-30 border-b border-border pl-32">
          {hourTicks.map((h) => (
            <div
              key={h}
              className="flex-1 font-mono text-xs text-text-tertiary py-1 px-1 border-l border-border"
            >
              {h}
            </div>
          ))}
        </div>

        {/* Timeline rows */}
        {result.drv.map((driver) => {
          const isSelected = selectedDriver === driver.id
          const isDimmed = selectedDriver && !isSelected

          return (
            <div
              key={driver.id}
              onClick={() => onSelectDriver(isSelected ? null : driver.id)}
              className={`flex cursor-pointer transition-all ${isDimmed ? 'opacity-40' : ''}`}
            >
              {/* Driver name sidebar */}
              <div className="w-32 flex-none px-3 py-0 flex flex-col justify-center border-r border-border bg-bg-secondary">
                <div className="text-xs font-semibold text-text-primary">{driver.name}</div>
                <div className="font-mono text-xs text-text-tertiary">
                  {driver.vehicle_name || 'N/A'} · {minutesToTime(driver.shift[0])}-{minutesToTime(driver.shift[1])}
                </div>
              </div>

              {/* Timeline */}
              <div className="flex-1 relative h-9">
                {/* Hour grid background */}
                <div className="absolute inset-0 flex">
                  {hourTicks.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1"
                      style={{
                        backgroundImage:
                          'linear-gradient(to right,transparent,transparent calc(100% - 1px),#f6f6f6 calc(100% - 1px),#f6f6f6 100%)',
                      }}
                    ></div>
                  ))}
                </div>

                {/* Shift band background */}
                <div
                  className="absolute top-0 h-full bg-gray-200 opacity-20"
                  style={{
                    left: `${pct(driver.shift[0])}%`,
                    width: `${pct(driver.shift[1]) - pct(driver.shift[0])}%`,
                  }}
                ></div>

                {/* Blocks (deadhead, service, idle) */}
                {driver.legs.map((leg, i) => {
                  const deadheadStart = pct(leg.deadStart)
                  const deadheadWidth = pct(leg.deadEnd) - deadheadStart
                  const serviceStart = pct(leg.svcStart)
                  const serviceWidth = pct(leg.svcEnd) - serviceStart
                  const idleStart = pct(leg.deadEnd)
                  const idleWidth = pct(leg.svcStart) - idleStart

                  return (
                    <div key={`leg-${i}`}>
                      {/* Deadhead */}
                      <div
                        className="absolute top-1.5 h-1.5 bg-border opacity-70"
                        style={{
                          left: `${deadheadStart}%`,
                          width: `${deadheadWidth}%`,
                        }}
                        title={`Deadhead: ${leg.trip.id}`}
                      ></div>

                      {/* Service */}
                      <div
                        className="absolute top-1.5 h-1.5 bg-text-primary"
                        style={{
                          left: `${serviceStart}%`,
                          width: `${serviceWidth}%`,
                        }}
                        title={`Service: ${leg.trip.id}`}
                      ></div>

                      {/* Idle (pattern) */}
                      {leg.idle > 0 && (
                        <div
                          className="absolute top-1.5 h-1.5"
                          style={{
                            left: `${idleStart}%`,
                            width: `${idleWidth}%`,
                            backgroundImage: 'repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6 3px,#fff 3px,#fff 6px)',
                            border: '1px solid #e5e7eb',
                          }}
                          title={`Idle: ${leg.trip.id} (${leg.idle}m)`}
                        ></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

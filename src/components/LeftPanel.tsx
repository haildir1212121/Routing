import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Trip, RoutingConfig, RoutingResult } from '../types'

interface LeftPanelProps {
  config: RoutingConfig
  trips: Trip[]
  result: RoutingResult | null
  selectedDriver: string | null
  onStrategyChange: (strategy: 'deadhead' | 'idle' | 'balance') => void
  onToggleHours: () => void
  onIdleChange: (delta: number) => void
  onDateChange: (date: Date) => void
  selectedDate: Date
  loading: boolean
}

export default function LeftPanel({
  config,
  trips,
  result,
  selectedDriver,
  onStrategyChange,
  onToggleHours,
  onIdleChange,
  onDateChange,
  selectedDate,
  loading,
}: LeftPanelProps) {
  const strategies = [
    { id: 'deadhead', label: 'Least deadhead', icon: 'ph-bold ph-arrows-in', hint: 'MILES' },
    { id: 'idle', label: 'Least idle', icon: 'ph-bold ph-hourglass-medium', hint: 'WAIT' },
    { id: 'balance', label: 'Balanced load', icon: 'ph-bold ph-scales', hint: 'HOURS' },
  ] as const

  const tripCards = trips.map((t) => {
    const drvId = result?.assign[t.id] || null
    const unrouted = result && !drvId
    const isSel = selectedDriver && drvId === selectedDriver
    const chip = unrouted ? 'UNROUTED' : result ? 'ROUTED' : 'PENDING'
    const chipBg = unrouted ? 'bg-red-50 text-red-700' : result ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'

    return {
      id: t.id,
      from: t.pickup,
      to: t.dropoff,
      appt: t.time,
      driver: drvId ? result?.drv.find((d) => d.id === drvId)?.vehicle_name || '—' : '—',
      chip,
      chipClass: chipBg,
      isSel,
      drvId,
    }
  })

  return (
    <div className="w-80 flex-none border-r border-border bg-bg-secondary flex flex-col min-h-0">
      {/* Config Section */}
      <div className="flex-none p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3.5">
          <span className="w-1 h-3.5 bg-text-primary rounded-sm"></span>
          <span className="font-mono text-xs tracking-wider text-text-tertiary">01</span>
          <span className="font-tight text-sm font-semibold text-text-primary">Generator.</span>
        </div>

        {/* Date Picker */}
        <div className="mb-4">
          <div className="font-mono text-xs uppercase tracking-widest text-text-tertiary mb-2">
            Select Date
          </div>
          <ReactDatePicker
            selected={selectedDate}
            onChange={(date) => onDateChange(date || new Date())}
            dateFormat="MMM dd, yyyy"
            className="w-full px-3 py-2 border border-border rounded text-sm font-mono focus:outline-none focus:border-accent"
          />
        </div>

        {/* Strategy Selector */}
        <div className="font-mono text-xs uppercase tracking-widest text-text-tertiary mb-2">
          Optimize for
        </div>
        <div className="bg-border border border-border rounded-lg overflow-hidden mb-4">
          {strategies.map((s) => (
            <button
              key={s.id}
              onClick={() => onStrategyChange(s.id)}
              className={`strategy-btn ${config.strategy === s.id ? 'active' : 'bg-bg-secondary text-text-primary'}`}
            >
              <div className="flex items-center gap-2">
                <i className={`${s.icon} text-sm`}></i>
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              <span className="font-mono text-xs text-text-tertiary">{s.hint}</span>
            </button>
          ))}
        </div>

        {/* Toggle Hours */}
        <div className="flex items-center justify-between p-2.5 border border-border rounded-lg mb-2.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-text-primary">Respect driver hours</span>
            <span className="text-xs text-text-tertiary">Never schedule outside a shift</span>
          </div>
          <button
            onClick={onToggleHours}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
              config.respectHours ? 'bg-text-primary' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-bg-secondary transition-all ${
                config.respectHours ? 'translate-x-6' : 'translate-x-1'
              }`}
            ></span>
          </button>
        </div>

        {/* Max Idle */}
        <div className="flex items-center justify-between p-2.5 border border-border rounded-lg">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-text-primary">Max idle per leg</span>
            <span className="text-xs text-text-tertiary">Cap driver sitting time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onIdleChange(-5)}
              className="w-6 h-6 border border-border rounded-sm bg-bg-secondary text-text-secondary hover:bg-border transition-all flex items-center justify-center"
            >
              <i className="ph-bold ph-minus text-xs"></i>
            </button>
            <span className="font-mono text-xs font-semibold w-10 text-center">{config.maxIdle}m</span>
            <button
              onClick={() => onIdleChange(5)}
              className="w-6 h-6 border border-border rounded-sm bg-bg-secondary text-text-secondary hover:bg-border transition-all flex items-center justify-center"
            >
              <i className="ph-bold ph-plus text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Trip Queue */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-none px-4 py-3 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-1 h-3.5 bg-text-tertiary rounded-sm"></span>
            <span className="font-mono text-xs tracking-wider text-text-tertiary">02</span>
            <span className="font-tight text-sm font-semibold text-text-primary">Trip queue.</span>
          </div>
          <span className="font-mono text-xs text-text-tertiary">
            {loading ? '—' : trips.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3.5">
          {loading ? (
            <div className="text-center text-xs text-text-tertiary py-8">Loading trips...</div>
          ) : trips.length === 0 ? (
            <div className="text-center text-xs text-text-tertiary py-8">No trips for this date</div>
          ) : (
            tripCards.map((t) => (
              <div
                key={t.id}
                className={`trip-card ${t.isSel ? 'selected' : ''}`}
                onClick={() => t.drvId && selectedDriver !== t.drvId && window.dispatchEvent(
                  new CustomEvent('selectDriver', { detail: t.drvId })
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-semibold text-text-primary">{t.id}</span>
                  <span className={`font-mono text-xs font-bold tracking-tighter px-1.5 py-0.5 rounded text-xs ${t.chipClass}`}>
                    {t.chip}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-primary mb-0.5">
                  <i className="ph-bold ph-circle text-2xs text-text-tertiary"></i>
                  {t.from}
                  <i className="ph-bold ph-arrow-right text-xs text-border"></i>
                  {t.to}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-mono text-xs text-text-secondary">APPT {t.appt}</span>
                  <span className="font-mono text-xs text-text-tertiary">{t.driver}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

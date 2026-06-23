export interface Driver {
  id: string;
  name: string;
  origin_city: string;
  origin_lat: number;
  origin_lng: number;
  vehicle_id?: string;
  vehicle_name?: string;
  vehicle_capacity?: number;
}

export interface Vehicle {
  id: string;
  name?: string;
  capacity?: number;
}

export interface Trip {
  id: string;
  date: string;
  time: string;
  vehicle_ref: string | null;
  pickup: string;
  dropoff: string;
  passenger: string;
  driver_name: string | null;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
}

export interface RoutingConfig {
  strategy: 'deadhead' | 'idle' | 'balance';
  respectHours: boolean;
  maxIdle: number; // minutes
}

export interface DriverLeg {
  trip: Trip;
  deadStart: number; // minutes from start of day
  deadEnd: number;
  svcStart: number;
  svcEnd: number;
  idle: number; // minutes waiting before service
}

export interface DriverState extends Driver {
  pos: { lat: number; lng: number };
  free: number; // minutes from start of day when free
  legs: DriverLeg[];
  onDuty: number; // total minutes of travel + service
  idle: number; // total idle time
  trips: number; // number of trips assigned
  shift: [number, number]; // [start, end] in minutes from start of day
}

export interface RoutingResult {
  drv: DriverState[];
  assign: Record<string, string>; // tripId -> driverId
  unrouted: string[]; // trip IDs that couldn't be assigned
}

export interface GeocodeResult {
  lat: number;
  lng: number;
}

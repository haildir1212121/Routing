import { supabase } from './supabase'
import { Trip } from '../types'

export async function fetchTripsForDate(date: Date): Promise<Trip[]> {
  const dateStr = date.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('date', dateStr)

  if (error) {
    console.error('Error fetching trips:', error)
    return []
  }

  // Filter out pre-assigned trips (those with vehicle_ref or driver_name)
  const unassigned = (data || []).filter(
    (trip) => !trip.vehicle_ref && !trip.driver_name
  )

  return unassigned
}

export async function fetchAllTripsForDate(date: Date): Promise<Trip[]> {
  const dateStr = date.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('date', dateStr)

  if (error) {
    console.error('Error fetching trips:', error)
    return []
  }

  return data || []
}

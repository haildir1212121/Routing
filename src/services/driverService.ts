import { supabase } from './supabase'
import { Driver } from '../types'

export async function fetchDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase
    .from('drivers')
    .select('id, name, origin_city, origin_lat, origin_lng')

  if (error) {
    console.error('Error fetching drivers:', error)
    return []
  }

  return data || []
}

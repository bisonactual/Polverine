import type { Reading } from '@/types'

const BASE = import.meta.env.VITE_WORKER_URL ?? ''

export async function fetchLatest(deviceId = 'workshop-01'): Promise<Reading> {
  const res = await fetch(`${BASE}/latest?device_id=${encodeURIComponent(deviceId)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchHistory(deviceId = 'workshop-01', hours = 24): Promise<Reading[]> {
  const res = await fetch(
    `${BASE}/readings?device_id=${encodeURIComponent(deviceId)}&hours=${hours}`
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.readings ?? []
}

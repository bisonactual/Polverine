import type { Reading } from '@/types'

const BASE = import.meta.env.VITE_WORKER_URL ?? ''

function normalizeReading(reading: Partial<Reading>): Reading {
  return {
    id: reading.id,
    device_id: reading.device_id ?? 'workshop-01',
    ts: reading.ts ?? 0,
    iaq: Number(reading.iaq ?? 0),
    iaq_accuracy: Number(reading.iaq_accuracy ?? 0),
    temperature: Number(reading.temperature ?? 0),
    humidity: Number(reading.humidity ?? 0),
    pressure: Number(reading.pressure ?? 0),
    co2_eq: Number(reading.co2_eq ?? 0),
    voc_eq: Number(reading.voc_eq ?? 0),
    pm1: Number(reading.pm1 ?? 0),
    pm2_5: Number(reading.pm2_5 ?? 0),
    pm10: Number(reading.pm10 ?? 0),
    obstructed: Boolean(reading.obstructed),
  }
}

export async function fetchLatest(deviceId = 'workshop-01'): Promise<Reading> {
  const res = await fetch(`${BASE}/latest?device_id=${encodeURIComponent(deviceId)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return normalizeReading(await res.json())
}

export async function fetchHistory(deviceId = 'workshop-01', hours = 24): Promise<Reading[]> {
  const res = await fetch(
    `${BASE}/readings?device_id=${encodeURIComponent(deviceId)}&hours=${hours}`
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return (data.readings ?? []).map(normalizeReading)
}

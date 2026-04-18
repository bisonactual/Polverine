export interface Reading {
  id?: number
  device_id: string
  ts: number
  iaq: number
  iaq_accuracy: number
  temperature: number
  humidity: number
  pressure: number
  co2_eq: number
  voc_eq: number
  pm1: number
  pm2_5: number
  pm10: number
}

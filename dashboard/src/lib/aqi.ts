export interface AqiBand {
  label:       string
  description: string
  color:       string
  text:        string
  hex:         string
  min:         number
  max:         number
}

export const IAQ_BANDS: AqiBand[] = [
  { label: 'Excellent',           description: 'Pure air — no irritation',            color: 'bg-emerald-500', text: 'text-emerald-600', hex: '#10b981', min: 0,   max: 50  },
  { label: 'Good',                description: 'No irritation or impact',             color: 'bg-green-500',   text: 'text-green-600',   hex: '#22c55e', min: 51,  max: 100 },
  { label: 'Lightly polluted',    description: 'Minor irritation may occur',          color: 'bg-green-500',   text: 'text-green-600',   hex: '#22c55e', min: 101, max: 200 },
  { label: 'Moderately polluted', description: 'Avoid prolonged exposure',            color: 'bg-yellow-400',  text: 'text-yellow-600',  hex: '#facc15', min: 201, max: 250 },
  { label: 'Heavily polluted',    description: 'Increase ventilation',                color: 'bg-orange-500',  text: 'text-orange-600',  hex: '#f97316', min: 251, max: 350 },
  { label: 'Extremely polluted',  description: 'Serious health effects — act now',    color: 'bg-red-500',     text: 'text-red-600',     hex: '#ef4444', min: 351, max: Infinity },
]

export function getIaqBand(iaq: number): AqiBand {
  return IAQ_BANDS.find(b => iaq >= b.min && iaq <= b.max) ?? IAQ_BANDS[IAQ_BANDS.length - 1]
}

export interface PmBand { label: string; color: string; hex: string; max: number }

export const PM25_BANDS: PmBand[] = [
  { label: '0-10',  color: 'bg-emerald-500', hex: '#10b981', max: 10 },
  { label: '10-20', color: 'bg-green-500',   hex: '#22c55e', max: 20 },
  { label: '20-50', color: 'bg-yellow-400',  hex: '#facc15', max: 50 },
  { label: '50-90', color: 'bg-orange-500',  hex: '#f97316', max: 90 },
  { label: '91+',   color: 'bg-red-500',     hex: '#ef4444', max: Infinity },
]

export function getPm25Band(pm: number): PmBand {
  return PM25_BANDS.find(b => pm <= b.max) ?? PM25_BANDS[PM25_BANDS.length - 1]
}

export const IAQ_ACCURACY_LABEL: Record<number, string> = {
  0: 'Stabilising',
  1: 'Low accuracy',
  2: 'Medium accuracy',
  3: 'High accuracy',
}

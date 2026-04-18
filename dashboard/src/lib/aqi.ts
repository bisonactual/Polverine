export interface AqiBand {
  label:       string
  description: string
  color:       string   // tailwind bg class
  text:        string   // tailwind text class
  hex:         string   // for recharts
  min:         number
  max:         number
}

export const IAQ_BANDS: AqiBand[] = [
  { label: 'Excellent',            description: 'Pure air — no irritation',             color: 'bg-emerald-500', text: 'text-emerald-600', hex: '#10b981', min: 0,   max: 50  },
  { label: 'Good',                 description: 'No irritation or impact',              color: 'bg-green-400',   text: 'text-green-600',   hex: '#4ade80', min: 51,  max: 100 },
  { label: 'Lightly polluted',     description: 'Minor irritation may occur',           color: 'bg-yellow-400',  text: 'text-yellow-600',  hex: '#facc15', min: 101, max: 150 },
  { label: 'Moderately polluted',  description: 'Avoid prolonged exposure',             color: 'bg-orange-400',  text: 'text-orange-600',  hex: '#fb923c', min: 151, max: 200 },
  { label: 'Heavily polluted',     description: 'Increase ventilation',                 color: 'bg-red-500',     text: 'text-red-600',     hex: '#ef4444', min: 201, max: 250 },
  { label: 'Severely polluted',    description: 'Significant health effects possible',  color: 'bg-rose-700',    text: 'text-rose-700',    hex: '#be123c', min: 251, max: 350 },
  { label: 'Extremely polluted',   description: 'Serious health effects — act now',     color: 'bg-purple-700',  text: 'text-purple-700',  hex: '#7c3aed', min: 351, max: Infinity },
]

export function getIaqBand(iaq: number): AqiBand {
  return IAQ_BANDS.find(b => iaq >= b.min && iaq <= b.max) ?? IAQ_BANDS[IAQ_BANDS.length - 1]
}

export interface PmBand { label: string; color: string; hex: string; max: number }

export const PM25_BANDS: PmBand[] = [
  { label: 'Good',      color: 'bg-emerald-500', hex: '#10b981', max: 12   },
  { label: 'Moderate',  color: 'bg-yellow-400',  hex: '#facc15', max: 35.4 },
  { label: 'Sensitive', color: 'bg-orange-400',  hex: '#fb923c', max: 55.4 },
  { label: 'Unhealthy', color: 'bg-red-500',     hex: '#ef4444', max: Infinity },
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

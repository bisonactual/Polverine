import { useEffect, useState, useCallback, useRef } from 'react'
import {
  AlertTriangle, Thermometer, Droplets, Gauge, FlaskConical, Wind,
  History, LayoutDashboard, Download, FileImage,
} from 'lucide-react'

import type { Reading } from '@/types'
import { fetchLatest, fetchHistory } from '@/lib/api'
import { IAQ_ACCURACY_LABEL } from '@/lib/aqi'
import { formatDateTime, round } from '@/lib/utils'

import { Header } from '@/components/Header'
import { MetricCard } from '@/components/MetricCard'
import { PmCard } from '@/components/PmCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { IaqHistoryChart, TempHumidityChart, PmHistoryChart } from '@/components/HistoryChart'

const DEVICE_ID = import.meta.env.VITE_DEVICE_ID ?? 'workshop-01'
const DEVICE_LABEL = 'Woodwork'
const POLL_INTERVAL = 30_000
const HISTORY_OPTIONS = [6, 24, 168, 336, 720]

type TabKey = 'pm' | 'climate' | 'iaq'

function historyLabel(hours: number): string {
  if (hours < 24) return `${hours}h`
  if (hours === 24) return '24h'
  if (hours % 24 === 0) return `${hours / 24}d`
  return `${hours}h`
}

function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export default function App() {
  const [latest, setLatest] = useState<Reading | null>(null)
  const [history, setHistory] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [online, setOnline] = useState(true)
  const [historyHours, setHistoryHours] = useState(24)
  const [activeTab, setActiveTab] = useState<TabKey>('pm')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const historyRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const [lat, hist] = await Promise.all([
        fetchLatest(DEVICE_ID),
        fetchHistory(DEVICE_ID, historyHours),
      ])
      setLatest(lat)
      setHistory(hist)
      setOnline(true)
    } catch {
      setOnline(false)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [historyHours])

  useEffect(() => {
    load()
    timerRef.current = setInterval(() => load(), POLL_INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [load])

  useEffect(() => {
    fetchHistory(DEVICE_ID, historyHours)
      .then(setHistory)
      .catch(() => {})
  }, [historyHours])

  const exportCsv = useCallback(() => {
    if (!history.length) return
    const header = ['timestamp', 'iaq', 'iaq_accuracy', 'temperature_c', 'humidity_pct', 'pressure_hpa', 'co2_eq_ppm', 'voc_eq_ppm', 'pm1_ug_m3', 'pm2_5_ug_m3', 'pm10_ug_m3', 'obstructed']
    const rows = history.map(reading => [
      new Date(reading.ts * 1000).toISOString(),
      reading.iaq,
      reading.iaq_accuracy,
      reading.temperature,
      reading.humidity,
      reading.pressure,
      reading.co2_eq,
      reading.voc_eq,
      reading.pm1,
      reading.pm2_5,
      reading.pm10,
      reading.obstructed,
    ])
    const csv = [header, ...rows]
      .map(row => row.map(cell => csvEscape(cell)).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${DEVICE_ID}-${activeTab}-${historyHours}h.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [activeTab, history, historyHours])

  const exportPng = useCallback(async () => {
    const svg = historyRef.current?.querySelector(`[data-chart="${activeTab}"] svg`) as SVGSVGElement | null
    if (!svg) return

    const clone = svg.cloneNode(true) as SVGSVGElement
    const bbox = svg.getBoundingClientRect()
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', `${Math.max(800, Math.round(bbox.width || 800))}`)
    clone.setAttribute('height', `${Math.max(320, Math.round(bbox.height || 320))}`)

    const serializer = new XMLSerializer()
    const svgText = serializer.serializeToString(clone)
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Could not render chart'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(800, Math.round(bbox.width || 800))
    canvas.height = Math.max(320, Math.round(bbox.height || 320))
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      URL.revokeObjectURL(url)
      return
    }

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)

    const pngUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = pngUrl
    link.download = `${DEVICE_ID}-${activeTab}-${historyHours}h.png`
    link.click()
  }, [activeTab, historyHours])

  return (
    <div className="min-h-screen bg-background">
      <Header
        deviceId={DEVICE_LABEL}
        lastUpdated={latest?.ts ?? null}
        online={online}
        refreshing={refreshing}
        onRefresh={() => load(true)}
      />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {latest?.obstructed && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold uppercase tracking-wide text-sm">Obstructed</p>
              <p className="text-sm">The particulate sensor reports blocked airflow. Clear the inlet before trusting dust levels.</p>
            </div>
          </div>
        )}

        <PmCard
          pm1={latest?.pm1 ?? null}
          pm2_5={latest?.pm2_5 ?? null}
          pm10={latest?.pm10 ?? null}
          obstructed={latest?.obstructed ?? false}
          loading={loading}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <MetricCard
            title="IAQ"
            unit="index"
            value={latest ? round(latest.iaq) : null}
            icon={LayoutDashboard}
            color="text-emerald-600"
            loading={loading}
            sub={latest ? IAQ_ACCURACY_LABEL[latest.iaq_accuracy] ?? 'Unknown accuracy' : undefined}
          />
          <MetricCard
            title="Temperature"
            unit="°C"
            value={latest ? round(latest.temperature) : null}
            icon={Thermometer}
            color="text-orange-500"
            loading={loading}
          />
          <MetricCard
            title="Humidity"
            unit="%"
            value={latest ? round(latest.humidity) : null}
            icon={Droplets}
            color="text-blue-500"
            loading={loading}
          />
          <MetricCard
            title="Pressure"
            unit="hPa"
            value={latest ? round(latest.pressure, 0) : null}
            icon={Gauge}
            color="text-slate-500"
            loading={loading}
          />
          <MetricCard
            title="CO₂ equiv."
            unit="ppm"
            value={latest ? round(latest.co2_eq, 0) : null}
            icon={FlaskConical}
            color="text-teal-500"
            loading={loading}
            sub="BSEC estimate"
          />
          <MetricCard
            title="VOC equiv."
            unit="ppm"
            value={latest ? round(latest.voc_eq, 2) : null}
            icon={Wind}
            color="text-violet-500"
            loading={loading}
            sub="BSEC estimate"
          />
        </div>

        <div className="bg-white rounded-xl border border-border p-5" ref={historyRef}>
          <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <History size={15} className="text-muted-foreground" />
                History
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Export the current window as CSV for analysis or PNG for reporting snapshots.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                {HISTORY_OPTIONS.map(h => (
                  <button
                    key={h}
                    onClick={() => setHistoryHours(h)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                      historyHours === h
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {historyLabel(h)}
                  </button>
                ))}
              </div>
              <button
                onClick={exportCsv}
                disabled={!history.length}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={13} />
                CSV
              </button>
              <button
                onClick={() => void exportPng()}
                disabled={!history.length}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileImage size={13} />
                PNG
              </button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as TabKey)}>
            <TabsList>
              <TabsTrigger value="pm">
                <Wind size={12} className="mr-1.5" />
                Particulates
              </TabsTrigger>
              <TabsTrigger value="climate">
                <Thermometer size={12} className="mr-1.5" />
                Climate
              </TabsTrigger>
              <TabsTrigger value="iaq">
                <LayoutDashboard size={12} className="mr-1.5" />
                Air Quality
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pm">
              <div data-chart="pm">
                <PmHistoryChart data={history} loading={loading} />
              </div>
            </TabsContent>
            <TabsContent value="climate">
              <div data-chart="climate">
                <TempHumidityChart data={history} loading={loading} />
              </div>
            </TabsContent>
            <TabsContent value="iaq">
              <div data-chart="iaq">
                <IaqHistoryChart data={history} loading={loading} />
              </div>
            </TabsContent>
          </Tabs>

          {latest && (
            <p className="mt-4 text-xs text-muted-foreground">
              Latest update {formatDateTime(latest.ts)}.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

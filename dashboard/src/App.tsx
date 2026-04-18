import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Thermometer, Droplets, Gauge, FlaskConical, Wind,
  History, LayoutDashboard,
} from 'lucide-react'

import type { Reading } from '@/types'
import { fetchLatest, fetchHistory } from '@/lib/api'
import { round } from '@/lib/utils'

import { Header }      from '@/components/Header'
import { IaqScore }    from '@/components/IaqScore'
import { MetricCard }  from '@/components/MetricCard'
import { PmCard }      from '@/components/PmCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { IaqHistoryChart, TempHumidityChart, PmHistoryChart } from '@/components/HistoryChart'

const DEVICE_ID      = import.meta.env.VITE_DEVICE_ID ?? 'workshop-01'
const POLL_INTERVAL  = 30_000

export default function App() {
  const [latest,      setLatest]      = useState<Reading | null>(null)
  const [history,     setHistory]     = useState<Reading[]>([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [online,      setOnline]      = useState(true)
  const [historyHours, setHistoryHours] = useState(24)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // reload history when hours changes
  useEffect(() => {
    fetchHistory(DEVICE_ID, historyHours)
      .then(setHistory)
      .catch(() => {})
  }, [historyHours])

  return (
    <div className="min-h-screen bg-background">
      <Header
        deviceId={DEVICE_ID}
        lastUpdated={latest?.ts ?? null}
        online={online}
        refreshing={refreshing}
        onRefresh={() => load(true)}
      />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* IAQ hero + PM side by side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <IaqScore
              iaq={latest?.iaq ?? null}
              accuracy={latest?.iaq_accuracy ?? 0}
              loading={loading}
            />
          </div>
          <PmCard
            pm1={latest?.pm1 ?? null}
            pm2_5={latest?.pm2_5 ?? null}
            pm10={latest?.pm10 ?? null}
            loading={loading}
          />
        </div>

        {/* Metric cards row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard
            title="Temperature" unit="°C"
            value={latest ? round(latest.temperature) : null}
            icon={Thermometer} color="text-orange-500"
            loading={loading}
          />
          <MetricCard
            title="Humidity" unit="%"
            value={latest ? round(latest.humidity) : null}
            icon={Droplets} color="text-blue-500"
            loading={loading}
          />
          <MetricCard
            title="Pressure" unit="hPa"
            value={latest ? round(latest.pressure, 0) : null}
            icon={Gauge} color="text-slate-500"
            loading={loading}
          />
          <MetricCard
            title="CO₂ equiv." unit="ppm"
            value={latest ? round(latest.co2_eq, 0) : null}
            icon={FlaskConical} color="text-teal-500"
            loading={loading}
            sub="BSEC estimate"
          />
          <MetricCard
            title="VOC equiv." unit="ppm"
            value={latest ? round(latest.voc_eq, 2) : null}
            icon={Wind} color="text-violet-500"
            loading={loading}
            sub="BSEC estimate"
          />
        </div>

        {/* History section */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <History size={15} className="text-muted-foreground" />
              History
            </h2>
            <div className="flex gap-1">
              {[6, 24, 48, 168].map(h => (
                <button
                  key={h}
                  onClick={() => setHistoryHours(h)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    historyHours === h
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {h < 24 ? `${h}h` : h === 168 ? '7d' : `${h/24}d`}
                </button>
              ))}
            </div>
          </div>

          <Tabs defaultValue="iaq">
            <TabsList>
              <TabsTrigger value="iaq">
                <LayoutDashboard size={12} className="mr-1.5" />
                Air Quality
              </TabsTrigger>
              <TabsTrigger value="climate">
                <Thermometer size={12} className="mr-1.5" />
                Climate
              </TabsTrigger>
              <TabsTrigger value="pm">
                <Wind size={12} className="mr-1.5" />
                Particulates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="iaq">
              <IaqHistoryChart data={history} loading={loading} />
            </TabsContent>
            <TabsContent value="climate">
              <TempHumidityChart data={history} loading={loading} />
            </TabsContent>
            <TabsContent value="pm">
              <PmHistoryChart data={history} loading={loading} />
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Polverine · BlackIoT · auto-refreshes every 30s
        </p>
      </main>
    </div>
  )
}

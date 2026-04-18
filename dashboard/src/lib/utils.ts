import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDateTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function round(n: number, dp = 1): number {
  return Math.round(n * 10 ** dp) / 10 ** dp
}

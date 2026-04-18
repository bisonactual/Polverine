interface Env {
  DB: D1Database;
  API_KEY: string;
}

interface Reading {
  device_id: string;
  timestamp: number;
  iaq: number;
  iaq_accuracy: number;
  temperature: number;
  humidity: number;
  pressure: number;
  co2_eq: number;
  voc_eq: number;
  pm1: number;
  pm2_5: number;
  pm10: number;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function unauthorized(): Response {
  return new Response('Unauthorized', { status: 401, headers: CORS });
}

function checkAuth(request: Request, env: Env): boolean {
  const auth = request.headers.get('Authorization') ?? '';
  return auth === `Bearer ${env.API_KEY}`;
}

async function handleIngest(request: Request, env: Env): Promise<Response> {
  if (!checkAuth(request, env)) return unauthorized();

  let body: Reading;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const required = ['device_id', 'timestamp', 'iaq', 'temperature', 'humidity', 'pressure'];
  for (const k of required) {
    if (body[k as keyof Reading] === undefined) {
      return json({ error: `missing field: ${k}` }, 400);
    }
  }

  await env.DB.prepare(
    `INSERT INTO readings
       (device_id, ts, iaq, iaq_accuracy, temperature, humidity, pressure, co2_eq, voc_eq, pm1, pm2_5, pm10)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.device_id,
    body.timestamp,
    body.iaq,
    body.iaq_accuracy ?? 0,
    body.temperature,
    body.humidity,
    body.pressure,
    body.co2_eq ?? null,
    body.voc_eq ?? null,
    body.pm1 ?? null,
    body.pm2_5 ?? null,
    body.pm10 ?? null
  ).run();

  return json({ ok: true });
}

async function handleLatest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const deviceId = url.searchParams.get('device_id') ?? 'workshop-01';

  const row = await env.DB.prepare(
    `SELECT * FROM readings WHERE device_id = ? ORDER BY ts DESC LIMIT 1`
  ).bind(deviceId).first();

  if (!row) return json({ error: 'no data' }, 404);
  return json(row);
}

async function handleReadings(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const deviceId = url.searchParams.get('device_id') ?? 'workshop-01';
  const hours = Math.min(parseInt(url.searchParams.get('hours') ?? '24'), 168);
  const since = Math.floor(Date.now() / 1000) - hours * 3600;

  const { results } = await env.DB.prepare(
    `SELECT * FROM readings WHERE device_id = ? AND ts >= ? ORDER BY ts ASC`
  ).bind(deviceId, since).all();

  return json({ readings: results, hours });
}

async function handleDevices(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT device_id, MAX(ts) as last_seen, COUNT(*) as count FROM readings GROUP BY device_id`
  ).all();
  return json(results);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const { pathname } = new URL(request.url);

    if (request.method === 'POST' && pathname === '/ingest')   return handleIngest(request, env);
    if (request.method === 'GET'  && pathname === '/latest')   return handleLatest(request, env);
    if (request.method === 'GET'  && pathname === '/readings') return handleReadings(request, env);
    if (request.method === 'GET'  && pathname === '/devices')  return handleDevices(env);

    return new Response('Not Found', { status: 404, headers: CORS });
  },
};

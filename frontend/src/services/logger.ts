import axios from 'axios';
import { apiClient } from './apiClient';

const PII_KEYS = new Set([
  'email',
  'password',
  'matriculation_number',
  'token',
  'refresh_token',
  'access_token',
  'authorization',
  'cookie',
  'set-cookie',
]);

function stripPii(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((v) => stripPii(v));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (PII_KEYS.has(k.toLowerCase())) continue;
      out[k] = stripPii(v);
    }
    return out;
  }
  return value;
}

type Level = 'debug' | 'info' | 'warning' | 'error';

interface PendingEntry {
  level: Level;
  message: string;
  context: Record<string, unknown>;
  ts: string;
}

const BUFFER_MAX = 20;
const FLUSH_INTERVAL_MS = 10_000;
const MAX_PAYLOAD = 100;

const buffer: PendingEntry[] = [];
let timer: number | null = null;
let installed = false;

function timestamp(): string {
  return new Date().toISOString();
}

async function flush(): Promise<void> {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, BUFFER_MAX);
  const payload = { logs: batch.slice(0, MAX_PAYLOAD) };
  try {
    await apiClient.post('/_client-logs', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Best-effort: if logging fails, silently drop.  Avoid infinite retries.
    try {
      await axios.post('/api/_client-logs', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      /* drop */
    }
  }
}

function scheduleFlush(): void {
  if (timer !== null) return;
  timer = window.setTimeout(() => {
    timer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

function push(level: Level, message: string, context?: Record<string, unknown>): void {
  const entry: PendingEntry = {
    level,
    message: String(message).slice(0, 2048),
    context: (stripPii(context ?? {}) as Record<string, unknown>) ?? {},
    ts: timestamp(),
  };
  buffer.push(entry);
  if (buffer.length >= BUFFER_MAX) {
    void flush();
  } else {
    scheduleFlush();
  }
}

function install(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (e) => {
    push('error', e.message || 'window.error', {
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error instanceof Error ? e.error.stack : undefined,
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const message =
      reason instanceof Error ? reason.message : String(reason ?? 'unhandledrejection');
    const stack = reason instanceof Error ? reason.stack : undefined;
    push('error', message, { kind: 'unhandledrejection', stack });
  });

  window.addEventListener('pagehide', () => {
    void flush();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flush();
    }
  });
}

export const logger = {
  install,
  flush,
  debug: (message: string, context?: Record<string, unknown>) => push('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => push('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => push('warning', message, context),
  error: (message: string, context?: Record<string, unknown>) => push('error', message, context),
  logClientError: (message: string, context?: Record<string, unknown>) =>
    push('error', message, context),
  stripPii,
};

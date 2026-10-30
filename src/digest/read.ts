import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, DigestStatus } from './types.js';

type RunEvent = {
  at: string;
  job: string;
  status: DigestStatus;
  owner: string | null;
  error: string | null;
};

function isStatus(value: unknown): value is DigestStatus {
  return value === 'ok' || value === 'retry' || value === 'fail';
}

function parseEvent(line: string): RunEvent | null {
  try {
    const value: unknown = JSON.parse(line);
    if (typeof value !== 'object' || value === null) return null;

    const event = value as Record<string, unknown>;
    if (
      typeof event.at !== 'string' ||
      typeof event.job !== 'string' ||
      !isStatus(event.status) ||
      (typeof event.owner !== 'string' && event.owner !== null) ||
      (event.error !== undefined && typeof event.error !== 'string')
    ) {
      return null;
    }

    return {
      at: event.at,
      job: event.job,
      status: event.status,
      owner: event.owner,
      error: event.error ?? null,
    };
  } catch {
    return null;
  }
}

export function readNight(runsDir: string, night: string): DigestRow[] {
  const source = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  const rows = new Map<string, DigestRow>();

  for (const line of source.split(/\r?\n/)) {
    if (!line) continue;
    const event = parseEvent(line);
    if (!event) continue;

    const row = rows.get(event.job);
    if (!row) {
      rows.set(event.job, {
        job: event.job,
        owner: event.owner,
        runs: 1,
        retries: event.status === 'retry' ? 1 : 0,
        lastStatus: event.status,
        lastError: event.error,
        firstAt: event.at,
        lastAt: event.at,
      });
      continue;
    }

    row.owner = event.owner;
    row.runs += 1;
    row.retries += event.status === 'retry' ? 1 : 0;
    row.lastStatus = event.status;
    row.lastError = event.error;
    row.lastAt = event.at;
  }

  return [...rows.values()];
}

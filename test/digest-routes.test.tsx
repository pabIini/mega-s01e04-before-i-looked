import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const runsDir = mkdtempSync(join(tmpdir(), 'rig-digest-routes-'));
const config = {
  adapter: 'shim',
  installed: '2026-10-29T14:06:00+01:00',
  beatEverySeconds: 60,
  runsDir,
};
const app = createApp(config);

afterEach(() => {
  rmSync(runsDir, { force: true, recursive: true });
  mkdirSync(runsDir);
});

describe('digest routes', () => {
  it('renders sorted rows and returns the same rows as JSON', async () => {
    writeFileSync(
      join(runsDir, '2026-10-28.jsonl'),
      [
        '{"at":"2026-10-28T23:00:00+01:00","job":"zebra","status":"retry","owner":"rook"}',
        '{"at":"2026-10-28T23:01:00+01:00","job":"alpha","status":"fail","owner":null,"error":"late"}',
      ].join('\n'),
    );

    const page = await app.request('/digest/2026-10-28');
    const html = await page.text();
    const api = await app.request('/api/digest/2026-10-28');
    const rows = await api.json();

    expect(page.status).toBe(200);
    expect(api.status).toBe(200);
    expect(html.indexOf('alpha')).toBeLessThan(html.indexOf('zebra'));
    expect(html).toContain('class="warn">fail');
    expect(rows.map((row: { job: string }) => row.job)).toEqual(['alpha', 'zebra']);
  });

  it('returns 404 for a night with no file', async () => {
    expect((await app.request('/digest/2026-10-27')).status).toBe(404);
    expect((await app.request('/api/digest/2026-10-27')).status).toBe(404);
  });

  it('renders an empty night', async () => {
    writeFileSync(join(runsDir, '2026-10-27.jsonl'), '');

    const page = await app.request('/digest/2026-10-27');
    const api = await app.request('/api/digest/2026-10-27');

    expect(page.status).toBe(200);
    expect(await page.text()).toContain('nothing ran');
    expect(await api.json()).toEqual([]);
  });

  it('renders a night containing a malformed line', async () => {
    writeFileSync(
      join(runsDir, '2026-10-26.jsonl'),
      '{"at":"2026-10-26T23:00:00+01:00","job":"digest","status":"ok","owner":"rook"}\nnot json',
    );

    const page = await app.request('/digest/2026-10-26');
    const api = await app.request('/api/digest/2026-10-26');

    expect(page.status).toBe(200);
    expect(await page.text()).toContain('digest');
    expect(await api.json()).toMatchObject([{ job: 'digest', runs: 1 }]);
  });
});

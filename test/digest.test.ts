import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('groups the nightly fixture and skips its malformed line', () => {
    const rows = readNight('runs', '2026-10-28');

    expect(rows).toHaveLength(5);
    expect(rows.find((row) => row.job === 'lane/sync')).toMatchObject({
      owner: 'rook',
      runs: 8,
      retries: 1,
      lastStatus: 'ok',
      lastError: null,
      firstAt: '2026-10-28T23:00:06+01:00',
      lastAt: '2026-10-29T05:00:04+01:00',
    });
    expect(rows.find((row) => row.job === 'fixtures/refresh')).toMatchObject({
      runs: 4,
      retries: 3,
      lastStatus: 'ok',
      lastError: null,
    });
    expect(rows.find((row) => row.job === 'digest/render')).toMatchObject({ owner: null });
  });
});

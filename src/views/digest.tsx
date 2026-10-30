import type { DigestRow } from '../digest/types.js';

export function DigestPage({ rows }: { rows: DigestRow[] }) {
  if (rows.length === 0) {
    return <p class="mute">nothing ran</p>;
  }

  return (
    <>
      <h1>morning digest</h1>
      <table>
        <thead>
          <tr>
            <th>job</th>
            <th>owner</th>
            <th>runs</th>
            <th>retries</th>
            <th>last status</th>
            <th>last error</th>
            <th>first time</th>
            <th>last time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const warn = row.retries >= 3 || row.lastStatus === 'fail';

            return (
              <tr>
                <td>{row.job}</td>
                <td>{row.owner ?? '—'}</td>
                <td>{row.runs}</td>
                <td class={row.retries >= 3 ? 'warn' : undefined}>{row.retries}</td>
                <td class={row.lastStatus === 'fail' ? 'warn' : undefined}>{row.lastStatus}</td>
                <td class={warn && row.lastError ? 'warn' : undefined}>{row.lastError ?? '—'}</td>
                <td>{row.firstAt}</td>
                <td>{row.lastAt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/**
 * The API stores timestamps as SQLite strings ("2026-05-27 09:21:04"), which the
 * admin previously rendered raw. Safari also refuses to parse that form with a
 * space, so the separator is normalised before constructing a Date.
 */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: string | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

/** "3 days ago" — easier to scan in a message list than an absolute timestamp. */
export function timeAgo(value: string | null | undefined): string {
  const d = toDate(value);
  if (!d) return '';
  const secs = Math.round((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'minute'], [3600, 'hour'], [86400, 'day'], [604800, 'week'],
    [2629800, 'month'], [31557600, 'year']
  ];
  let prev = 1;
  for (const [limit, unit] of units) {
    if (secs < limit) return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
      .format(-Math.round(secs / prev), unit);
    prev = limit;
  }
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    .format(-Math.round(secs / 31557600), 'year');
}

// Parses ?start=YYYY-MM-DD&end=YYYY-MM-DD from a request URL. The end date is
// treated as inclusive of the whole day (up to but not including the next day).
export function parseDateRange(url) {
  const { searchParams } = new URL(url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return { error: 'Both start and end dates are required (YYYY-MM-DD).' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return { error: 'Dates must be in YYYY-MM-DD format.' };
  }

  return { start, end };
}

// All three sites are in California, so "a day" in History, Reports and the
// CSV means a Pacific-time day (the database and Vercel both run in UTC).
export const REPORT_TZ = 'America/Los_Angeles';

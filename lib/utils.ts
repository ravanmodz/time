export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function calculateHours(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return diff / (1000 * 60 * 60); // Convert to hours
}

export function calculateMinutes(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / (1000 * 60)); // Convert to minutes
}

export function getReverseGeocode(lat: number, lng: number): Promise<string> {
  return fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.OPENCAGE_API_KEY || ''}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted;
      }
      return `${lat}, ${lng}`;
    })
    .catch(() => `${lat}, ${lng}`);
}


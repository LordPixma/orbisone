export interface RawEvent {
  eventId: string;
  source: 'GDACS' | 'USGS' | 'NOAA' | string;
  payload: any;
}

export interface Event {
  id: string;
  type: string;
  timestamp: string; // ISO8601
  latitude: number;
  longitude: number;
  region: string;
  magnitude?: number;
  severityScore: number;
  categories: string[];
  description: string;
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'orbisone-bot' } });
    if (!res.ok) {
      return 'Unknown';
    }
    const data = await res.json();
    return data.display_name || data.address?.state || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

export function scoreSeverity(event: RawEvent): number {
  const magnitude = event.payload?.magnitude;
  if (typeof magnitude === 'number') {
    return Math.min(10, Math.max(0, Math.round(magnitude)));
  }
  return 0;
}

export async function parseAndEnrich(raw: RawEvent): Promise<Event> {
  const payload = raw.payload || {};

  const event: Event = {
    id: raw.eventId,
    type: payload.type || raw.source,
    timestamp: payload.timestamp || new Date().toISOString(),
    latitude: payload.latitude ?? 0,
    longitude: payload.longitude ?? 0,
    region: 'Unknown',
    magnitude: payload.magnitude,
    severityScore: 0,
    categories: payload.categories || [],
    description: payload.description || '',
  };

  event.region = await reverseGeocode(event.latitude, event.longitude);
  event.severityScore = scoreSeverity(raw);

  return event;
}

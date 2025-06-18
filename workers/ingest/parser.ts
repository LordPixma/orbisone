export interface RawEvent {
  eventId: string;
  source: string;
  payload: any;
}

export interface Event {
  id: string;
  type: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  region: string;
  magnitude?: number;
  severityScore: number;
  categories: string[];
  description: string;
}

export async function parseAndEnrich(event: RawEvent): Promise<Event> {
  // Placeholder implementation for parse and enrichment logic
  return {
    id: event.eventId,
    type: event.source,
    timestamp: new Date().toISOString(),
    latitude: 0,
    longitude: 0,
    region: 'unknown',
    severityScore: 0,
    categories: [],
    description: JSON.stringify(event.payload),
  };
}

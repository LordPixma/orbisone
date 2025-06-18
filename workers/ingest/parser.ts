export interface RawEvent {
  eventId: string;
  source: string;
  payload: any;
}

/**
 * Parse an inbound MIME email and return a minimal RawEvent object.
 *
 * This is a stubbed implementation. The real parser would decode MIME
 * attachments and body content to build the event payload and enrich it
 * with metadata like geolocation and severity scores.
 */
export async function parseAndEnrich(rawMime: string): Promise<RawEvent> {
  // TODO: Implement actual MIME parsing and enrichment logic
  const eventId = `evt_${Date.now()}`;
  const source = 'unknown';
  const payload = rawMime;

  return { eventId, source, payload };
}

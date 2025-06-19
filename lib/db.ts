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

export interface EventFilter {
  // placeholder for future filter fields
  [key: string]: any;
}

export interface IDatabaseClient {
  query<T>(sql: string, params: any[]): Promise<T[]>;
}

export interface IEventRepository {
  upsert(event: Event): Promise<void>;
  findById(id: string): Promise<Event | null>;
  query?(filters: EventFilter): Promise<Event[]>;
}

interface EventRow {
  id: string;
  type: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  region: string;
  magnitude: number | null;
  severity_score: number;
  categories: string | null;
  description: string;
}

export class D1EventRepository implements IEventRepository {
  constructor(private db: IDatabaseClient) {}

  async upsert(event: Event): Promise<void> {
    const sql = `
      INSERT INTO events (
        id,
        type,
        timestamp,
        latitude,
        longitude,
        region,
        magnitude,
        severity_score,
        categories,
        description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type=excluded.type,
        timestamp=excluded.timestamp,
        latitude=excluded.latitude,
        longitude=excluded.longitude,
        region=excluded.region,
        magnitude=excluded.magnitude,
        severity_score=excluded.severity_score,
        categories=excluded.categories,
        description=excluded.description
    `;

    await this.db.query(sql, [
      event.id,
      event.type,
      event.timestamp,
      event.latitude,
      event.longitude,
      event.region,
      event.magnitude ?? null,
      event.severityScore,
      JSON.stringify(event.categories),
      event.description,
    ]);
  }

  async findById(id: string): Promise<Event | null> {
    const sql = 'SELECT * FROM events WHERE id = ? LIMIT 1';
    const rows = await this.db.query<EventRow>(sql, [id]);
    if (rows.length === 0) {
      return null;
    }
    const row = rows[0];
    return {
      id: row.id,
      type: row.type,
      timestamp: row.timestamp,
      latitude: row.latitude,
      longitude: row.longitude,
      region: row.region,
      magnitude: row.magnitude ?? undefined,
      severityScore: row.severity_score,
      categories: row.categories ? JSON.parse(row.categories) : [],
      description: row.description,
    };
  }
}

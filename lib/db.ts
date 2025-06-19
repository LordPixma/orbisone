import type { D1Database } from '@cloudflare/workers-types';
export interface IDatabaseClient {
  query<T>(sql: string, params: any[]): Promise<T[]>;
}

export class D1Client implements IDatabaseClient {
  private db: D1Database;

  constructor(env: { D1: D1Database }) {
    this.db = env.D1;
  }

  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql).bind(...params);
    const { results } = await stmt.all<T>();
    return results as T[];
  }
}

// Database Abstraction Layer - Provides an interface for interacting with the D1 database.

// TODO: Implement D1 connection pool and CRUD operations for Event, User, Subscription, and AlertLog.

import { D1Database } from '@cloudflare/workers-types';

// Raw event after parsing email
interface RawEvent {
  eventId: string;
  source: 'GDACS' | 'USGS' | 'NOAA' | string;
  payload: any;
}

// Normalized event
interface Event {
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

// User subscription
interface Subscription {
  id: string;
  userId: string;
  filters: {
    types: string[];
    regions: string[];
    minSeverity: number;
  };
  createdAt: string;
}

// Alert Log
interface AlertLog {
    id: string;
    subscriptionId: string;
    eventId: string;
    sentAt: string;
}

// Database client interface
interface IDatabaseClient {
  query<T>(sql: string, params: any[]): Promise<T[]>;
  execute(sql: string, params: any[]): Promise<D1Result>;
}

// Event repository interface
interface IEventRepository {
  upsert(event: Event): Promise<void>;
  findById(id: string): Promise<Event | null>;
  query(filters: EventFilter): Promise<Event[]>;
}

// User repository interface
interface IUserRepository {
    // TODO: Implement user related methods
}

// Subscription repository interface
interface ISubscriptionRepository {
  create(sub: Subscription): Promise<void>;
  listByUser(userId: string): Promise<Subscription[]>;
}

// Alert Log repository interface
interface IAlertLogRepository {
    create(alertLog: AlertLog): Promise<void>;
}


// Basic D1 Database Client Implementation
export class D1DatabaseClient implements IDatabaseClient {
    private db: D1Database;

    constructor(db: D1Database) {
        this.db = db;
    }

    async query<T>(sql: string, params: any[]): Promise<T[]> {
        const { results } = await this.db.prepare(sql).bind(...params).all();
        return results as T[];
    }

    async execute(sql: string, params: any[]): Promise<D1Result> {
        return this.db.prepare(sql).bind(...params).run();
    }
}

// TODO: Implement Concrete Repository Classes (EventRepository, UserRepository, SubscriptionRepository, AlertLogRepository)
// These classes will use the D1DatabaseClient to perform database operations.
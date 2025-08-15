// Shared types for the application.

// TODO: Define interfaces for RawEvent, Event, Subscription, and JwtPayload as per LLD.

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

// JWT payload
interface JwtPayload {
  sub: string; // user ID
  iat: number;
  exp: number;
}

interface EventFilter {
    types?: string[];
    regions?: string[];
    minSeverity?: number;
    startDate?: string; // ISO8601
    endDate?: string; // ISO8601
    recent?: boolean; // For fetching recent events
}
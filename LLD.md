# OrbisOne: Low-Level Design (LLD)

This document details the modules, components, class/interface definitions, and worker function choreography for OrbisOne.

---

## 1. Module & Component Breakdown

### 1.1 Ingest Worker Module
- **File**: `workers/ingest/index.ts`
- **Responsibilities**:
  - Validate inbound email payload signature.
  - Parse raw MIME (attachments + body).
  - Enqueue parsing tasks (via Durable Object or KV queue).
- **Dependencies**:
  - `@sendgrid/mail` (for signature validation utilities)
  - `xml2js` or native JSON parser.

### 1.2 Parsing & Enrichment Module
- **File**: `workers/ingest/parser.ts`
- **Responsibilities**:
  - XML/JSON → `RawEvent` schema.
  - Reverse geocode coordinates (GeoIP or external API).
  - Severity scoring logic.
  - Categorization/tagging service.
- **Dependencies**:
  - Geolocation service adapter.
  - Custom scoring library.

### 1.3 Database Abstraction Layer
- **File**: `lib/db.ts`
- **Responsibilities**:
  - D1 connection pool.
  - CRUD operations for `Event`, `User`, `Subscription`, `AlertLog`.
- **Interfaces**:
  - `IDatabaseClient`
  - `IEventRepository`, `IUserRepository`, `ISubscriptionRepository`

### 1.4 API Worker Module
- **File**: `workers/api/index.ts`
- **Responsibilities**:
  - Route HTTP requests to handlers.
  - JWT validation middleware.
  - Input validation.
- **Routes**:
  - `GET /api/events`
  - `GET /api/events/:id`
  - `POST /api/subscribe`
  - `GET /api/stats`
- **Dependencies**:
  - `jsonwebtoken`
  - `zod` for schema validation

### 1.5 Front-End Client
- **Directory**: `frontend/`
- **Responsibilities**:
  - Data fetching via `/api` endpoints.
  - Interactive map & UI components.
- **Libraries**:
  - React + Vite
  - TailwindCSS, shadcn/ui
  - Recharts, Leaflet/Mapbox

---

## 2. Class & Interface Definitions

### 2.1 Shared Types (TypeScript)

```ts
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
```

### 2.2 Repositories & Clients

```ts
// Database client
interface IDatabaseClient {
  query<T>(sql: string, params: any[]): Promise<T[]>;
}

// Event repository
interface IEventRepository {
  upsert(event: Event): Promise<void>;
  findById(id: string): Promise<Event | null>;
  query(filters: EventFilter): Promise<Event[]>;
}

// Subscription repository
interface ISubscriptionRepository {
  create(sub: Subscription): Promise<void>;
  listByUser(userId: string): Promise<Subscription[]>;
}
```

---

## 3. Worker Function Choreography

### 3.1 Email Ingestion Flow

```text
GDACS Email
    ↓ (SMTP)
Mailgun Inbound Parse
    ↓ HTTP POST
Ingest Worker (/webhook/gdacs)
    ├─ validateSignature()
    ├─ extractMimeParts()
    └─ enqueue(parseTask)
```

### 3.2 Parsing & Storage Flow

```text
Durable Object / KV Queue
    ↓ dequeue()
Parser Worker
    ├─ parseRawEvent()
    ├─ enrichEvent() → Geo + scoring + tags
    ├─ dedupeCheck() → D1 query
    └─ db.upsert(event)
```

### 3.3 API Request Flow

```text
Client → GET /api/events?filters
    ↓
API Worker
    ├─ authMiddleware() (JWT verify)
    ├─ validateQuery()
    ├─ eventRepo.query(filters)
    └─ return JSON payload
```

### 3.4 Subscription Creation Flow

```text
Client → POST /api/subscribe
    ↓
API Worker
    ├─ authMiddleware()
    ├─ validateBody()
    ├─ subscriptionRepo.create()
    └─ trigger initial alert check (async)
```

---

*End of Low-Level Design*
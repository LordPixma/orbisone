# OrbisOne: High-Level Design

A serverless, GitOps-driven SaaS dashboard for surfacing GDACS alerts and other high-impact global events. Built on GitHub, Cloudflare Workers, and D1, with extensible hooks for additional data sources and analytics.

---

## 1. Logical Architecture Overview

```text
┌────────────────────┐       ┌───────────────────┐       ┌──────────────┐
│   Email Provider   │ ──→── │ Email-Webhook     │ ──→── │  Cloudflare  │
│ (SendGrid / Mailgun)│      │ Worker “/webhook” │       │ Worker (Ingest) │
└────────────────────┘       └───────────────────┘       └──────┬───────┘
                                                                  │
                                                                  ↓
                     ┌────────────────────────────────────────────────────────┐
                     │                  Data Processing                     │
                     │ • Email parsing & validation                         │
                     │ • GDACS XML/JSON → normalized event records           │
                     │ • Enrichment (geocoding, severity scoring, tags)      │
                     └────────────────────────────────────────────────────────┘
                                                                  │
                                                                  ↓
                            ┌─────────────────────────────┐
                            │      D1 Relational DB      │
                            │ • events                    │
                            │ • attachments → R2          │
                            │ • users, subscriptions      │
                            └─────────────────────────────┘
                                                                  │
                                                                  ↓
┌───────────────┐       ┌────────────────────┐       ┌─────────────────┐
│  Front-end    │ ←───→ │  API Layer         │ ←───→ │  Auth & Access  │
│ (React/Svelte)│       │  Cloudflare Worker │       │  Cloudflare JWT │
└───────────────┘       └────────────────────┘       └─────────────────┘
```

---

## 2. Key Components

### A. Email Ingestion & Parsing

1. **Inbound Email Routing**  
   - Use SendGrid/Mailgun Inbound Parse to forward GDACS alert emails to a Cloudflare Worker webhook (`/webhook/gdacs`).  
   - Emails arrive as HTTP POSTs with raw MIME payloads.

2. **Cloudflare Worker (Ingest Worker)**  
   - **Trigger**: HTTP POST from email service.  
   - **Steps**:  
     1. Validate signature.  
     2. Extract attachments/body (XML/JSON).  
     3. Enqueue for processing (via Durable Object or Workers KV queue).

3. **Data Processing Pipeline**  
   - **Parsing Module**: Convert XML/JSON → standardized schema (`event_id`, `type`, `timestamp`, `location`, `magnitude`, `description`, etc.).  
   - **Enrichment**:  
     - Reverse-geocode coordinates → region name.  
     - Assign severity score.  
     - Tag categories (earthquake, flood, cyber threat, etc.).  
   - **Deduplication**: Check `event_id` in D1; update if changed.

4. **Storage**  
   - **D1 Database**:  
     - `events` table (PK: `event_id`)  
     - `attachments` table linked to R2  
     - `users`, `subscriptions`, `alerts_log`

---

### B. API Layer & Business Logic

1. **Cloudflare Worker (API Worker)**  
   - Exposes RESTful endpoints under `/api/`:  
     - `GET /api/events` (filters: type, date, region, severity)  
     - `GET /api/events/:id`  
     - `POST /api/subscribe` (email/SMS alerts)  
     - `GET /api/stats` (usage metrics)

2. **Authentication & Access Control**  
   - **Cloudflare Access** + JWT to secure all `/api/*` paths.  
   - Issue JWT on login/signup (magic link or OAuth); Workers validate per request.

3. **Caching & Rate-Limiting**  
   - Edge Cache (Cache API) for hot queries (e.g. `?recent=true`), TTL ~5 min.  
   - Rate-limit per user/API key via Cloudflare built-in limits.

---

### C. Front-End Dashboard

1. **Tech Stack**  
   - **Framework**: React (or SvelteKit) + Vite  
   - **UI**: TailwindCSS + shadcn/ui  
   - **Charts**: Recharts for time series, heatmaps

2. **Features**  
   - Interactive world map (Leaflet or Mapbox GL).  
   - Filters: date range, event type, severity, region.  
   - Detail panel with enriched metadata.  
   - User-configurable alert watches (email/SMS).  
   - Admin console for API key & role management.

3. **Deployment**  
   - Static assets via **Cloudflare Pages** (GitHub integration).  
   - Automated build on push to `main`.

---

### D. CI/CD & Infrastructure

1. **GitHub Repo**  
   - Monorepo: `/frontend`, `/workers/ingest`, `/workers/api`, `/terraform`  
   - **GitHub Actions**:  
     - Lint & tests on PR (ESLint, Jest)  
     - Deploy Workers (via Wrangler) on merge  
     - Publish Pages

2. **Infrastructure as Code**  
   - Terraform (Cloudflare provider) to provision:  
     - D1, R2 bucket, KV namespaces  
     - Access policies, Worker routes, Pages project

3. **Secrets Management**  
   - Store API keys (SendGrid, Mailgun, JWT secret) in GitHub & Wrangler secrets.

---

### E. Monitoring, Logging & Alerting

1. **Observability**  
   - Cloudflare Workers Insights for CPU and execution metrics.  
   - Structured JSON logs forwarded to Logflare or ELK.

2. **Alerts**  
   - Sentry or Cloudflare Log Alerts for runtime errors.  
   - PagerDuty integration for critical failures.

3. **User Metrics & Analytics**  
   - Cloudflare Analytics for usage and traffic.  
   - Custom dashboards (Datadog or Grafana) for event volumes and latencies.

---

## 3. Daily Email Pull Logic

**Preferred (Inbound):**  
1. GDACS sends alerts to `gdacs@yourdomain.com`.  
2. Mail service forwards to `/webhook/gdacs` Worker.  
3. Worker validates, extracts, and pipelines the data.

**Alternative (Scheduled Polling):**  
- Cloudflare Cron Trigger at `05 00 * * *` (00:05 UTC) runs a Worker IMAP/POP3 client to fetch unread emails, mark them read, and push into the same pipeline.

\`\`\`toml
# wrangler.toml
[[triggers.crons]]
pattern = "5 0 * * *"
\`\`\`

---

## 4. Extensibility

- **Additional Data Sources**: USGS, NOAA APIs; social media firehoses; RSS feeds.  
- **Advanced Analytics**: ML microservices (via Durable Objects) for predictions or threat scoring.  
- **Global Regions**: Multi-region Worker deployments with geo-routing for minimal latency.  

---

*This design provides a fully serverless, globally distributed, GitOps-driven platform that scales with data volume and supports future growth.*

# Software Development Life Cycle (SDLC)

## NextStop — Government Bus Tracking & Fleet Management System

## SDLC Model: Agile (Iterative Development)

---

## Phase 1: Planning
**Duration: Week 1–2**

### Activities:
- Identified the need for a real-time public bus tracking system for government transit
- Defined three primary user groups: Passengers, Conductors, Administrators
- Documented functional and non-functional requirements

### Functional Requirements:
| ID   | Requirement                                | Priority |
|------|--------------------------------------------|----------|
| FR-1 | Real-time GPS tracking of buses            | High     |
| FR-2 | Conductor ticket issuance                  | High     |
| FR-3 | Passenger booking with QR codes            | High     |
| FR-4 | Admin dashboard with fleet management      | High     |
| FR-5 | Route management (CRUD + bulk upload)      | Medium   |
| FR-6 | Revenue and ticket analytics               | Medium   |
| FR-7 | Offline ticket sync                        | Medium   |
| FR-8 | Voice-based route queries (Punjabi)        | Low      |

### Deliverables:
- Software Requirements Specification (SRS)
- Technology stack selection
- Team role assignment
- Project timeline and milestones

---

## Phase 2: Design
**Duration: Week 2–3**

### Activities:
- Designed 3-tier architecture (Frontend → API → Database)
- Designed 14 MongoDB collections with relationships
- Planned RESTful endpoints for 4 user portals
- Wireframed admin dashboard layout

### Architecture Decisions:
| Decision               | Choice           | Rationale                             |
|------------------------|------------------|---------------------------------------|
| Frontend Framework     | Next.js 16       | SSR, App Router, excellent DX         |
| Backend Framework      | Express.js       | Lightweight, flexible ecosystem       |
| Database               | MongoDB          | Schema flexibility, geospatial support|
| Real-time Comm.        | SSE              | Simpler than WebSockets for 1-way     |
| Validation             | Zod              | Runtime type safety with TypeScript   |
| Maps                   | OLA Maps SDK     | India-focused local mapping           |

### Design Artifacts:
- ER Diagram (see `diagrams/ER_DIAGRAM.md`)
- Class Diagram (see `diagrams/CLASS_DIAGRAM.md`)
- API endpoint specification
- Database schema design

---

## Phase 3: Development
**Duration: Week 3–8**

### Sprint 1 (Week 3–4): Foundation
- Set up monorepo (`admin-portal/` and `api/`)
- Implemented MongoDB connection and Mongoose models
- Built Express server with route mounting
- Created Next.js project with App Router and Tailwind CSS
- Implemented multi-tier authentication

### Sprint 2 (Week 4–5): Core Features
- Built ETM data ingestion pipeline (Heartbeat, Ticket, Trip)
- Implemented admin dashboard with StatsOverview
- Created route management with stops builder
- Developed fleet management (Bus, Driver, Conductor)
- Integrated OLA Maps for live tracking

### Sprint 3 (Week 5–6): Multi-Portal APIs
- Built passenger app API (login, search, booking)
- Implemented QR code generation and verification
- Created conductor endpoints (trip, ticket issuance)
- Added offline ticket batch sync

### Sprint 4 (Week 6–7): Analytics
- Built analytics dashboard (revenue, tickets, route performance)
- Implemented demand analysis with custom hooks
- Added SSE streaming for real-time updates
- Created network graph visualization

### Sprint 5 (Week 7–8): Polish
- Fixed responsive design, error handling
- Built database seeder and bus simulator
- Wrote project documentation

### Key Metrics:
| Metric                | Count |
|-----------------------|-------|
| Backend Models        | 14    |
| API Route Files       | 8     |
| Service Modules       | 10    |
| Frontend Components   | 16    |
| Frontend Pages        | 6     |
| API Endpoints         | 40+   |

---

## Phase 4: Testing
**Duration: Ongoing (continuous)**

### Testing Strategies:
1. **Manual API Testing** (Postman) — All 40+ endpoints
2. **Frontend Testing** (Browser) — Cross-browser & responsive
3. **Integration Testing** — End-to-end user flows
4. **Data Validation** — Zod schema validation on inputs

### Key Test Cases:
| Test Case                         | Status  |
|-----------------------------------|---------|
| Admin login (valid/invalid)       | Pass |
| Create bus with missing fields    | Pass |
| GPS heartbeat ingestion           | Pass |
| Ticket issuance with QR           | Pass |
| Offline batch sync                | Pass |
| SSE stream connection             | Pass |
| Route bulk upload (CSV)           | Pass |
| Dashboard loads all widgets       | Pass |
| Mobile responsive layout          | Pass |

---

## Phase 5: Deployment
**Duration: Week 8+**

### Deployment Stack:
- **Frontend**: Next.js on Vercel / VPS (Port 8080)
- **Backend**: Express.js on Railway / VPS (Port 3001)
- **Database**: MongoDB Atlas (Cloud)
- **Media**: Cloudinary (images, audio)

### Deployment Steps:
1. Create MongoDB Atlas cluster, configure access
2. Run `npm run seed` to populate initial data
3. Deploy backend with environment variables
4. Build and deploy frontend with API URL configured
5. Run bus simulator for live testing
6. Monitor via health check endpoint (`/health`)

### Environment Variables:
| Variable                | Description                    |
|-------------------------|--------------------------------|
| `MONGODB_URI`           | MongoDB connection string      |
| `PORT`                  | Server port (default: 3001)    |
| `ETM_BEARER_TOKEN`      | ETM device auth token          |
| `ADMIN_DEMO_TOKEN`      | Admin portal auth token        |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name          |
| `NEXT_PUBLIC_API_URL`   | Backend API base URL           |

---

## Timeline Summary

```
Week 1-2  ████████  Planning & Requirements
Week 2-3  ████████  System Design & Architecture
Week 3-8  ████████████████████████  Development (5 Sprints)
Week 8+   ████████  Deployment & Maintenance
Testing   ──────────────────────────────────▶ (Continuous)
```

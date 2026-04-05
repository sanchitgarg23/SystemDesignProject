# 🚌 NextStop — Government Bus Tracking & Fleet Management System

<p align="center">
  <strong>Real-Time Public Transit Operations Platform</strong><br/>
  <em>Built for government agencies to track, manage, and optimize public bus transportation</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Next.js_16-black?logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/Backend-Express.js-000?logo=express" alt="Express"/>
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License"/>
</p>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Design Pattern](#-architecture--design-pattern)
- [Folder Structure](#-folder-structure)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Setup & Installation](#-setup--installation)
- [Documentation](#-documentation)
- [Team Members](#-team-members)

---

## 🎯 Project Overview

**NextStop** is a comprehensive, real-time government bus tracking and fleet management system designed for public transportation authorities. The platform provides a unified solution for:

- **Passengers** — Real-time bus tracking, route discovery, ticket booking with QR codes
- **Conductors** — On-bus ticket issuance, trip management, offline data sync
- **Administrators** — Fleet oversight, route management, analytics, demand analysis

The system features a **multi-portal architecture** supporting three distinct user roles, each with dedicated API endpoints and authentication mechanisms. It handles real-time GPS telemetry from IoT devices (ETM — Electronic Ticket Machines) installed on buses, processes ticket transactions, and provides actionable insights through an admin dashboard.

---

## ✨ Key Features

### 🗺️ Real-Time Bus Tracking
- Live GPS tracking of all buses on a map (OLA Maps integration)
- SSE (Server-Sent Events) streaming for real-time position updates
- Heartbeat monitoring with GPS, speed, bearing, and odometer data

### 🎫 Ticketing & Booking System
- Conductor-side ticket issuance (cash, card, UPI, pass)
- Passenger mobile app booking with QR code generation
- QR code verification at boarding
- Offline ticket batch sync for areas with poor connectivity

### 🚍 Fleet Management
- CRUD operations for Buses, Drivers, and Conductors
- Crew assignment (Driver + Conductor → Bus)
- Vehicle status tracking (active, inactive, maintenance)
- Device health monitoring for ETM hardware

### 📊 Analytics & Reporting
- Real-time operational dashboard with live statistics
- Revenue analytics with date-based filtering
- Route performance metrics
- Ticket analytics with stop-level filtering
- Demand analysis and passenger load estimation

### 🛣️ Route Management
- Full route lifecycle (create, update, delete)
- Stop-based routing with GPS coordinates and sequencing
- Bulk route upload via CSV
- Network graph visualization of the route network

### 🔐 Multi-Tier Authentication
- Admin portal authentication (email/password with Bearer tokens)
- Passenger app authentication (mobile-based with app tokens)
- Conductor app authentication (device + conductor tokens)
- ETM device authentication (API key via X-Device-Key header)

### 🎙️ Voice Query Support
- Multilingual voice-based route queries (Punjabi language support)
- Audio transcription and response system

---

## 🛠️ Tech Stack

| Layer          | Technology                          | Purpose                          |
|----------------|-------------------------------------|----------------------------------|
| **Frontend**   | Next.js 16 (React 19)              | Admin Portal SPA                 |
| **Styling**    | Tailwind CSS 4, Radix UI, Lucide   | UI components & icons            |
| **Charts**     | Recharts, Chart.js                  | Data visualization               |
| **Maps**       | OLA Maps Web SDK                    | Geospatial visualization         |
| **Backend**    | Node.js, Express.js 4              | REST API server                  |
| **Language**   | TypeScript 5.3                      | Type-safe backend code           |
| **Database**   | MongoDB 7+ (Mongoose 8)            | NoSQL document storage           |
| **Validation** | Zod 3                               | Runtime schema validation        |
| **Media**      | Cloudinary                          | Image/media cloud storage        |
| **QR Codes**   | qrcode (Node.js)                   | Ticket QR generation             |
| **File Upload**| Multer                              | Multipart form data handling     |
| **Utilities**  | nanoid, date-fns, dotenv            | ID generation, dates, env config |

---

## 🏗️ Architecture & Design Pattern

### Design Pattern: **MVC (Model-View-Controller)** with **Service Layer**

The project follows a **layered MVC architecture** enhanced with a dedicated Service Layer for business logic separation:

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (VIEW)                    │
│          Next.js Admin Portal (React Components)         │
│    ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│    │Dashboard │  │Tracking  │  │ Fleet    │  │Analytics│  │
│    │  Page    │  │  Page    │  │  Page    │  │  Page   │  │
│    └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│         └──────────────┴────────────┴────────────┘       │
│                        API Client (lib/api.js)            │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTP/SSE
┌───────────────────────────┴──────────────────────────────┐
│                   CONTROLLER LAYER (ROUTES)               │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│    │  Admin   │  │Conductor │  │   App    │  │ Ingest │  │
│    │ Routes   │  │ Routes   │  │ Routes   │  │ Routes │  │
│    └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│         └──────────────┴────────────┴────────────┘       │
│                     Middleware (Auth)                      │
└───────────────────────────┬──────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────┐
│                    SERVICE LAYER                          │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│    │  Admin   │  │ Booking  │  │Conductor │  │ Ingest │  │
│    │ Service  │  │ Service  │  │ Service  │  │ Service│  │
│    └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│         └──────────────┴────────────┴────────────┘       │
└───────────────────────────┬──────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────┐
│                    MODEL LAYER (DATA)                     │
│    ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│    │ Bus  │ │Route │ │Trip  │ │Ticket│ │User  │  + more  │
│    └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
│                         MongoDB                           │
└──────────────────────────────────────────────────────────┘
```

**Why MVC + Service Layer?**
- **Models** (`/api/src/models/`) — Define data schemas and database interactions via Mongoose
- **Controllers** (`/api/src/routes/`) — Handle HTTP requests, validate input, return responses
- **Services** (`/api/src/services/`) — Contain business logic, keeping controllers thin
- **Views** (`/admin-portal/`) — React-based UI components rendered by Next.js

---

## 📁 Folder Structure

```
NextStop/
├── admin-portal/              # Frontend — Next.js Admin Dashboard
│   ├── app/                   # Next.js App Router pages
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── page.js        # Main dashboard (stats, graph, feed)
│   │   │   ├── tracking/      # Live bus tracking map
│   │   │   ├── routes/        # Route CRUD management
│   │   │   ├── fleet/         # Bus/Driver/Conductor management
│   │   │   ├── analytics/     # Revenue, tickets, performance
│   │   │   └── demand-analysis/ # Passenger demand patterns
│   │   └── login/             # Admin login page
│   ├── components/            # Reusable React components
│   │   ├── ui/                # shadcn/ui base components
│   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   ├── NetworkGraphView.jsx # Route network visualization
│   │   ├── LiveBusFeed.jsx    # Real-time bus activity feed
│   │   ├── OlaMap.jsx         # Map integration component
│   │   ├── DemandChart.jsx    # Demand analysis charts
│   │   └── ...                # Modal, chart, form components
│   ├── contexts/              # React Context providers
│   │   └── AuthContext.jsx    # Authentication state management
│   ├── lib/                   # Utility functions
│   │   ├── api.js             # Centralized API client
│   │   ├── useDemandAnalysis.js # Custom React hook
│   │   └── utils.js           # Helper functions
│   └── public/                # Static assets
│
├── api/                       # Backend — Express.js REST API
│   └── src/
│       ├── index.ts           # Server entry point & route mounting
│       ├── config/            # Configuration
│       │   ├── db.ts          # MongoDB connection
│       │   └── cloudinary.ts  # Cloud media config
│       ├── middleware/        # Express middleware
│       │   └── auth.ts        # Multi-tier authentication
│       ├── models/            # Mongoose data models (14 models)
│       │   ├── Bus.ts         # Bus entity
│       │   ├── Route.ts       # Route with stops
│       │   ├── Driver.ts      # Driver entity
│       │   ├── Conductor.ts   # Conductor entity
│       │   ├── Trip.ts        # Trip lifecycle
│       │   ├── Ticket.ts      # Ticket transactions
│       │   ├── Heartbeat.ts   # GPS telemetry data
│       │   ├── Device.ts      # ETM device registry
│       │   ├── AdminUser.ts   # Admin portal users
│       │   ├── AppUser.ts     # Passenger app users
│       │   ├── UserBooking.ts # Passenger bookings
│       │   ├── BusCapacity.ts # Seat capacity tracking
│       │   ├── OfflineBatch.ts # Offline ticket sync
│       │   └── VoiceQuery.ts  # Voice query records
│       ├── routes/            # API route handlers (controllers)
│       │   ├── admin.routes.ts    # Admin dashboard endpoints
│       │   ├── app.routes.ts      # Passenger app endpoints
│       │   ├── conductor.routes.ts # Conductor app endpoints
│       │   ├── ingest.routes.ts   # ETM data ingestion
│       │   ├── query.routes.ts    # Data query endpoints
│       │   ├── stream.routes.ts   # SSE real-time streaming
│       │   ├── upload.routes.ts   # File upload endpoints
│       │   └── driver.routes.ts   # Driver endpoints
│       ├── services/          # Business logic layer
│       │   ├── admin.service.ts       # Admin operations
│       │   ├── app.service.ts         # Passenger app logic
│       │   ├── booking.service.ts     # Booking + QR logic
│       │   ├── conductor.service.ts   # Conductor operations
│       │   ├── ingest.service.ts      # Telemetry ingestion
│       │   ├── passenger-load.service.ts # Load estimation
│       │   ├── qr.service.ts         # QR code generation
│       │   ├── query.service.ts       # Data queries
│       │   └── upload.service.ts      # File processing
│       ├── types/             # TypeScript type definitions
│       │   └── index.ts       # Zod schemas & TS types
│       ├── seed.ts            # Database seeder
│       └── simulator.ts       # Bus movement simulator
│
├── db/                        # Database schema documentation
│   └── schema.sql             # MongoDB collections (as SQL reference)
│
├── docs/                      # Project documentation
│   ├── SDLC.md                # Software Development Lifecycle
│   ├── OOP_CONCEPTS.md        # OOP principles in the project
│   └── DESIGN_PATTERN.md      # Design pattern analysis
│
├── diagrams/                  # System diagrams
│   ├── ER_DIAGRAM.md          # Entity-Relationship diagram
│   └── CLASS_DIAGRAM.md       # Class diagram
│
└── README.md                  # This file
```

---

## 🗄️ Database Schema

The system uses **MongoDB** with **14 collections** managed via Mongoose ODM:

| Collection      | Description                         | Key Fields                                    |
|-----------------|-------------------------------------|-----------------------------------------------|
| `buses`         | Fleet bus registry                  | busId, registrationNo, type, capacity, status |
| `routes`        | Transit routes with stops           | routeId, name, farePerKm, stops[]             |
| `drivers`       | Driver personnel records            | driverId, name, phone, licenseNo, status      |
| `conductors`    | Conductor personnel records         | conductorId, name, phone, licenseNo           |
| `trips`         | Trip lifecycle tracking             | tripId, busId, routeId, driverId, status      |
| `tickets`       | Issued ticket records               | ticketId, fareAmount, boardingStop, tripId    |
| `heartbeats`    | Real-time GPS telemetry             | deviceId, busId, lat, lng, speedKmph          |
| `devices`       | IoT ETM device registry             | deviceId, apiKey, busId, status               |
| `adminusers`    | Admin portal user accounts          | email, password, name, role                   |
| `appusers`      | Passenger mobile app users          | userId, mobile, name                          |
| `userbookings`  | Passenger ticket bookings           | bookingId, userId, routeId, qrCode           |
| `buscapacities` | Bus seating capacity data           | busId, capacity                               |
| `offlinebatches`| Offline ticket sync batches         | batchId, deviceId, ticketsCount               |
| `voicequeries`  | Voice-based route queries           | queryId, audioUrl, language, transcription     |

---

## 🔌 API Endpoints

### ETM Device Endpoints (`/etm/v1`) — Requires `X-Device-Key`
| Method | Endpoint             | Description               |
|--------|----------------------|---------------------------|
| POST   | `/heartbeat`         | Submit GPS heartbeat      |
| POST   | `/ticket`            | Issue a ticket            |
| POST   | `/trip/start`        | Start a new trip          |
| POST   | `/trip/end`          | End an active trip        |
| POST   | `/offline-batch`     | Sync offline tickets      |

### Passenger App Endpoints (`/app/v1`) — Requires App Token
| Method | Endpoint                | Description                     |
|--------|-------------------------|---------------------------------|
| POST   | `/auth/login`           | Passenger login (mobile OTP)    |
| GET    | `/stops`                | List all stops                  |
| GET    | `/routes/search`        | Search routes by query          |
| GET    | `/routes/:id/live-buses`| Live buses on a route           |
| POST   | `/booking`              | Create a booking (with QR)      |
| GET    | `/bookings`             | List user bookings              |
| DELETE | `/booking/:id`          | Cancel a booking                |

### Conductor Endpoints (`/conductor/v1`) — Requires Conductor Token
| Method | Endpoint          | Description                |
|--------|-------------------|----------------------------|
| POST   | `/auth/login`     | Conductor login            |
| GET    | `/trip/active`    | Get active trip            |
| POST   | `/ticket`         | Issue ticket to passenger  |
| POST   | `/offline-sync`   | Sync offline tickets       |
| POST   | `/verify-qr`      | Verify passenger QR code   |

### Admin Endpoints (`/admin/v1`) — Requires Admin Token
| Method | Endpoint                      | Description                   |
|--------|-------------------------------|-------------------------------|
| POST   | `/auth/login`                 | Admin login                   |
| GET    | `/routes`                     | List all routes               |
| POST   | `/routes`                     | Create a route                |
| PUT    | `/routes/:id`                 | Update a route                |
| DELETE | `/routes/:id`                 | Delete a route                |
| GET    | `/analytics/realtime`         | Real-time stats               |
| GET    | `/analytics/revenue`          | Revenue analytics             |
| GET    | `/analytics/tickets`          | Ticket analytics              |
| GET    | `/analytics/route-performance`| Route performance             |
| GET    | `/fleet/buses`                | List all buses                |
| GET    | `/fleet/drivers`              | List all drivers              |
| GET    | `/fleet/conductors`           | List all conductors           |
| GET    | `/buses/live`                 | Live bus positions            |
| GET    | `/bookings`                   | All bookings (admin view)     |
| GET    | `/device-health`              | ETM device health status      |

---

## ⚡ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB 7+ (local or Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/nextstop.git
cd nextstop
```

### 2. Backend Setup
```bash
cd api
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and tokens
npm run seed      # Seed the database with sample data
npm run dev       # Start backend on port 3001
```

### 3. Frontend Setup
```bash
cd admin-portal
npm install
# Create .env with NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev       # Start frontend on port 8080
```

### 4. (Optional) Run Bus Simulator
```bash
cd api
npm run simulator   # Simulates bus movement for testing
```

---

## 📚 Documentation

Detailed documentation is available in the following locations:

| Document                | Path                         | Description                          |
|-------------------------|------------------------------|--------------------------------------|
| SDLC Process            | `docs/SDLC.md`               | Software Development Lifecycle       |
| OOP Concepts            | `docs/OOP_CONCEPTS.md`       | OOP principles in the project        |
| Design Pattern          | `docs/DESIGN_PATTERN.md`     | MVC + Service Layer analysis         |
| ER Diagram              | `diagrams/ER_DIAGRAM.md`     | Entity-Relationship diagram          |
| Class Diagram           | `diagrams/CLASS_DIAGRAM.md`  | UML Class diagram                    |
| Database Schema         | `db/schema.sql`              | Collection/table definitions         |

---

## 👥 Team Members

| Name             | Role                     | Responsibility                    |
|------------------|--------------------------|-----------------------------------|
| Sanchit Garg     | Full-Stack Developer     | Backend API, Database Design      |
| Tanish Garg      | Frontend Developer       | Admin Portal UI, Charts           |
| Omkar Shukla     | Backend Developer        | Authentication, Services          |
| Chinmay Soni     | QA / Documentation       | Testing, Documentation, Diagrams  |
| Raghav Gupta     | DevOps / Integration     | Deployment, API Integration       |

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  <strong>NextStop</strong> — Making Public Transit Smarter 🚌💨
</p>

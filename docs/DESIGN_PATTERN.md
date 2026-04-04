# Design Pattern Analysis

## NextStop — Government Bus Tracking & Fleet Management System

---

## 🏗️ Primary Design Pattern: MVC (Model-View-Controller) with Service Layer

### What is MVC?

**MVC (Model-View-Controller)** is a software architectural pattern that separates an application into three interconnected components:

- **Model** — Manages data, business rules, and database interactions
- **View** — Handles the user interface and data presentation
- **Controller** — Processes user input, orchestrates Model and View

Our project extends the traditional MVC with a **Service Layer** that extracts complex business logic from the controllers, resulting in cleaner, more maintainable code.

```
┌─────────────────────────────────────────────────┐
│                  CLIENT (Browser)                │
│                                                  │
│   ┌──────────────────────────────────────────┐   │
│   │           VIEW LAYER (Next.js)           │   │
│   │  ┌──────────┐  ┌──────────┐  ┌────────┐ │   │
│   │  │Dashboard │  │ Fleet    │  │Tracking│ │   │
│   │  │Components│  │Components│  │  Map   │ │   │
│   │  └─────┬────┘  └────┬─────┘  └───┬────┘ │   │
│   │        └─────────────┼───────────┘       │   │
│   │              API Client (lib/api.js)     │   │
│   └──────────────────────┬───────────────────┘   │
└──────────────────────────┼───────────────────────┘
                           │ HTTP Requests
┌──────────────────────────┼───────────────────────┐
│                  SERVER (Express.js)              │
│                                                   │
│   ┌──────────────────────┴───────────────────┐   │
│   │         CONTROLLER LAYER (Routes)        │   │
│   │  admin.routes.ts  │  app.routes.ts       │   │
│   │  conductor.routes.ts │ ingest.routes.ts  │   │
│   └──────────────────────┬───────────────────┘   │
│                          │                        │
│   ┌──────────────────────┴───────────────────┐   │
│   │           SERVICE LAYER                   │   │
│   │  admin.service.ts │ booking.service.ts    │   │
│   │  conductor.service.ts │ ingest.service.ts │   │
│   └──────────────────────┬───────────────────┘   │
│                          │                        │
│   ┌──────────────────────┴───────────────────┐   │
│   │           MODEL LAYER (Mongoose)          │   │
│   │  Bus.ts │ Route.ts │ Trip.ts │ Ticket.ts  │   │
│   │  Driver.ts │ Conductor.ts │ Device.ts     │   │
│   └──────────────────────┬───────────────────┘   │
│                          │                        │
│                     MongoDB Database              │
└───────────────────────────────────────────────────┘
```

---

## 🔍 Where MVC is Applied in This Project

### 1. Model Layer — `/api/src/models/`

The Model layer defines the data structure and interacts with MongoDB through Mongoose schemas.

**Example: Bus Model (`Bus.ts`)**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IBus extends Document {
  busId: string;
  registrationNo: string;
  type: 'AC Deluxe' | 'Super Deluxe' | 'Ordinary' | 'Standard Non-AC';
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  lastSeen: Date | null;
}

const BusSchema = new Schema({
  busId: { type: String, required: true, unique: true },
  registrationNo: { type: String, required: true },
  type: { type: String, enum: ['AC Deluxe', 'Super Deluxe', 'Ordinary', 'Standard Non-AC'] },
  capacity: { type: Number, required: true, default: 50 },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  lastSeen: { type: Date, default: null },
}, { timestamps: true });

export const Bus = mongoose.model<IBus>('Bus', BusSchema);
```

**Key Responsibilities:**
- Define data schema with types and constraints
- Provide data validation rules (enums, required fields)
- Handle database indexing for query performance
- Encapsulate data access methods (save, find, update, delete)

### 2. View Layer — `/admin-portal/`

The View layer is the Next.js React frontend that renders the UI and handles user interactions.

**Example: Dashboard Page (`app/(dashboard)/page.js`)**

```jsx
export default function DashboardPage() {
  const [isLive, setIsLive] = useState(true);
  
  return (
    <div>
      <StatsOverview />        {/* Real-time statistics */}
      <NetworkGraphView />     {/* Route network visualization */}
      <LiveBusFeed />          {/* Live bus activity feed */}
      <TopRoutesSummary />     {/* Top performing routes */}
    </div>
  );
}
```

**Key Responsibilities:**
- Render UI components (React components)
- Handle user interactions (clicks, form submissions)
- Display data fetched from the API
- Manage client-side state (AuthContext)

### 3. Controller Layer — `/api/src/routes/`

The Controller layer handles incoming HTTP requests, validates input, and delegates to the Service layer.

**Example: Admin Routes (`admin.routes.ts`)**

```typescript
router.get('/fleet/buses', authenticateAdmin, async (req, res) => {
  try {
    const buses = await AdminService.getFleetBuses();
    res.json({ buses });
  } catch (error) {
    res.status(500).json({ code: 'ERROR', message: error.message });
  }
});
```

**Key Responsibilities:**
- Define API endpoints (HTTP method + path)
- Apply authentication middleware
- Validate request parameters
- Call appropriate service methods
- Format and return HTTP responses

### 4. Service Layer — `/api/src/services/` (MVC Extension)

The Service layer contains the core business logic, keeping controllers thin and logic reusable.

**Example: Admin Service (`admin.service.ts`)**

```typescript
export async function getFleetBuses() {
  const buses = await Bus.find().sort({ createdAt: -1 });
  // Enrich with current trip and crew information
  const enrichedBuses = await Promise.all(
    buses.map(async (bus) => {
      const activeTrip = await Trip.findOne({ busId: bus.busId, status: 'active' });
      return { ...bus.toObject(), activeTrip };
    })
  );
  return enrichedBuses;
}
```

**Key Responsibilities:**
- Implement complex business rules
- Orchestrate multiple model operations
- Handle data transformation and enrichment
- Keep business logic separate from HTTP handling

---

## ✅ Benefits of MVC + Service Layer in This Project

| Benefit                 | How It Helps                                                  |
|-------------------------|---------------------------------------------------------------|
| **Separation of Concerns** | Each layer has a single responsibility — UI, routing, logic, data |
| **Maintainability**     | Changes to business logic don't affect controllers or views    |
| **Testability**         | Services can be unit-tested independently of HTTP layer        |
| **Reusability**         | Service methods are shared across multiple controllers         |
| **Scalability**         | Layers can be scaled independently (e.g., separate API server) |
| **Team Collaboration**  | Frontend and backend teams can work independently              |

---

## 🔄 Request Flow Example

**Scenario: Admin views fleet buses on the dashboard**

```
1. [VIEW]       User clicks "Fleet Management" in Sidebar
2. [VIEW]       FleetPage component renders, calls getFleetBuses() from lib/api.js
3. [API CLIENT] HTTP GET /admin/v1/fleet/buses (with Bearer token)
4. [MIDDLEWARE]  authenticateAdmin() validates the admin token
5. [CONTROLLER] admin.routes.ts receives request, calls AdminService.getFleetBuses()
6. [SERVICE]    admin.service.ts queries Bus model, enriches with Trip data
7. [MODEL]      Bus.find() executes MongoDB query, returns bus documents
8. [SERVICE]    Returns enriched bus array to controller
9. [CONTROLLER] Formats response as JSON, sends HTTP 200
10. [VIEW]      FleetPage receives data, renders bus table with status badges
```

---

## 📐 Additional Design Patterns Used

### 1. **Observer Pattern** (SSE Streaming)
The real-time bus tracking uses Server-Sent Events (SSE), where the server pushes updates to subscribed clients — a form of the Observer pattern.

### 2. **Middleware Pattern** (Express.js)
Authentication is implemented as chainable middleware functions that intercept requests before they reach controllers.

### 3. **Repository Pattern** (Mongoose Models)
Mongoose models act as repositories, abstracting database operations behind a clean API (`.find()`, `.save()`, `.updateOne()`).

### 4. **Factory Pattern** (Zod Validation)
Zod schemas act as factories that validate and construct typed objects from raw input data.

### 5. **Context Pattern** (React Context API)
The `AuthContext` provides a centralized authentication state accessible by any component without prop drilling.

---

## 📝 Summary

The **MVC + Service Layer** pattern is the backbone of the NextStop project:

- **Model** → 14 Mongoose schemas in `/api/src/models/`
- **View** → React components in `/admin-portal/`
- **Controller** → Express route handlers in `/api/src/routes/`
- **Service** → Business logic in `/api/src/services/`

This architecture ensures clean separation of concerns, making the codebase maintainable, testable, and scalable for a real-world government transportation system.

# Object-Oriented Programming (OOP) Concepts

## NextStop — Government Bus Tracking & Fleet Management System

---

## Overview

Although NextStop is built with JavaScript/TypeScript (which supports both OOP and functional paradigms), the project heavily utilizes OOP principles throughout its architecture. This document explains how each of the four core OOP pillars is applied.

---

## 1. Encapsulation 🔒

**Definition**: Encapsulation is the bundling of data (attributes) and methods that operate on that data within a single unit (class/object), restricting direct access to some components.

### Where It's Used:

#### a) Mongoose Models — Data + Behavior Together
Each model encapsulates its schema definition, validation rules, and data access methods within a single module.

```typescript
// api/src/models/Bus.ts
export interface IBus extends Document {
  busId: string;           // Private data
  registrationNo: string;
  type: 'AC Deluxe' | 'Super Deluxe' | 'Ordinary';
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
}

const BusSchema = new Schema({
  busId: { type: String, required: true, unique: true },
  registrationNo: { type: String, required: true },
  // Validation rules encapsulated within the schema
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'maintenance'],  // Restricts values
    default: 'active' 
  },
}, { timestamps: true });

export const Bus = mongoose.model<IBus>('Bus', BusSchema);
```

**How**: The `Bus` model encapsulates:
- **Data** — busId, registrationNo, type, capacity, status
- **Validation** — enum constraints, required fields, defaults
- **Methods** — save(), find(), remove() (inherited from Mongoose)
- **Access Control** — Only exported interface exposes allowed fields

#### b) AuthContext — State Encapsulation
```javascript
// admin-portal/contexts/AuthContext.jsx
export const AuthProvider = ({ children }) => {
  // Private state — not directly accessible from outside
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Public methods — controlled access to state
  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("admin_token", newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("admin_token");
  };

  // Only expose what's needed
  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**How**: Internal state (`user`, `token`) is hidden. External components can only interact through `login()`, `logout()`, and `isAuthenticated`.

#### c) API Client — Request Logic Encapsulation
```javascript
// admin-portal/lib/api.js
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");  // Hidden implementation
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();  // Internal helper
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  // HTTP logic encapsulated — callers don't know about headers/tokens
  const response = await fetch(`${ADMIN_API}${endpoint}`, { ...options, headers });
  return response.json();
}

// Public API — simple and clean
export async function getFleetBuses() { return apiRequest("/fleet/buses"); }
export async function createBus(data) { return apiRequest("/fleet/buses", { method: "POST", body: JSON.stringify(data) }); }
```

**How**: Token management and HTTP details are hidden. Consumers just call `getFleetBuses()` without knowing about headers, tokens, or error handling.

---

## 2. Inheritance 🧬

**Definition**: Inheritance allows a class to inherit properties and methods from a parent class, promoting code reuse.

### Where It's Used:

#### a) Mongoose Document Inheritance
All models extend Mongoose's `Document` interface, inheriting built-in database methods.

```typescript
// Every model inherits from Document
export interface IBus extends Document {    // ← Inherits from Document
  busId: string;
  registrationNo: string;
  // ...
}

export interface IDriver extends Document {  // ← Same parent
  driverId: string;
  name: string;
  // ...
}

export interface IConductor extends Document { // ← Same parent
  conductorId: string;
  name: string;
  // ...
}
```

**Inheritance Hierarchy:**
```
Mongoose Document (Parent)
  ├── IBus        → inherits save(), remove(), toJSON(), toObject()
  ├── IRoute      → inherits save(), remove(), toJSON(), toObject()
  ├── IDriver     → inherits save(), remove(), toJSON(), toObject()
  ├── IConductor  → inherits save(), remove(), toJSON(), toObject()
  ├── ITrip       → inherits save(), remove(), toJSON(), toObject()
  ├── ITicket     → inherits save(), remove(), toJSON(), toObject()
  └── ... (all 14 models)
```

#### b) Shared Personnel Pattern (Driver & Conductor)
Driver and Conductor share nearly identical structures — a form of structural inheritance:

```typescript
// Both share the same field pattern (conceptual inheritance)
interface IPersonnel extends Document {
  name: string;
  phone: string;
  licenseNo: string;
  status: 'active' | 'inactive' | 'on_leave';
  currentBusId: string | null;
}

// Driver IS-A Personnel
interface IDriver extends IPersonnel { driverId: string; }
// Conductor IS-A Personnel  
interface IConductor extends IPersonnel { conductorId: string; }
```

#### c) Express Middleware Chain Inheritance
Middleware functions inherit the request/response pattern from Express:

```typescript
// All auth functions follow the same inherited signature
type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

// Each specializes the base pattern
export async function authenticateDevice(req, res, next) { /* Device-specific */ }
export function authenticateBearer(req, res, next) { /* Bearer-specific */ }
export function authenticateAdmin(req, res, next) { /* Admin-specific */ }
export function authenticateAppUser(req, res, next) { /* App user-specific */ }
export async function authenticateConductor(req, res, next) { /* Conductor-specific */ }
```

---

## 3. Polymorphism 🔄

**Definition**: Polymorphism allows objects of different types to be treated through the same interface, with each type providing its own implementation.

### Where It's Used:

#### a) Authentication Middleware — Same Interface, Different Behavior
All five authentication functions share the same `(req, res, next)` signature but implement different validation logic:

```typescript
// Same interface, different implementations
authenticateDevice(req, res, next)    → Validates X-Device-Key header, queries Device model
authenticateBearer(req, res, next)    → Validates Bearer token against env variable
authenticateAdmin(req, res, next)     → Validates admin-specific Bearer token
authenticateAppUser(req, res, next)   → Validates APP_ prefixed token, extracts userId
authenticateConductor(req, res, next) → Validates CONDUCTOR_ prefixed token

// Used polymorphically in routes:
router.get('/fleet/buses', authenticateAdmin, handler);      // Admin auth
router.get('/stops', authenticateAppUser, handler);           // App auth
router.post('/ticket', authenticateConductor, handler);       // Conductor auth
router.post('/heartbeat', authenticateDevice, handler);       // Device auth
```

**How**: Express doesn't care which auth function is used — they all have the same shape. The specific behavior changes based on which middleware is applied to each route.

#### b) Mongoose Model Methods — Same Method, Different Collections
All models use the same `.find()`, `.save()`, `.findOne()` methods, but each operates on a different MongoDB collection:

```typescript
// Same method name, different underlying collections and schemas
const buses = await Bus.find({ status: 'active' });
const drivers = await Driver.find({ status: 'active' });
const trips = await Trip.find({ status: 'active' });
const tickets = await Ticket.find({ tripId: 'TRIP-001' });
```

#### c) Zod Schema Validation — Polymorphic Parsing
Different Zod schemas parse incoming data through the same `.parse()` interface:

```typescript
// Same .parse() method, different validation rules
const heartbeat = HeartbeatSchema.parse(req.body);  // Validates GPS, device fields
const ticket = TicketSchema.parse(req.body);         // Validates fare, stops fields
const tripStart = TripStartSchema.parse(req.body);   // Validates trip timing fields
const booking = BookingSchema.parse(req.body);        // Validates booking fields
```

#### d) Frontend API Functions — Uniform Interface
```javascript
// All return Promise<Object> but hit different endpoints
const stats = await getRealtimeAnalytics();    // GET /analytics/realtime
const routes = await getAllRoutes();             // GET /routes
const buses = await getFleetBuses();            // GET /fleet/buses
const bookings = await getAllBookings();         // GET /bookings
```

---

## 4. Abstraction 🎭

**Definition**: Abstraction hides complex implementation details and exposes only the essential features to the user.

### Where It's Used:

#### a) Service Layer — Hides Business Logic Complexity
The service layer abstracts complex database operations behind simple function calls:

```typescript
// What the controller sees (simple):
const stats = await AdminService.getRealtimeStats();

// What the service actually does (complex):
export async function getRealtimeStats() {
  const activeBuses = await Heartbeat.aggregate([
    { $match: { timestamp: { $gte: fiveMinAgo } } },
    { $group: { _id: "$busId" } },
  ]);
  const activeTrips = await Trip.countDocuments({ status: 'active' });
  const todayRevenue = await Ticket.aggregate([
    { $match: { issuedAt: { $gte: startOfDay } } },
    { $group: { _id: null, total: { $sum: "$fareAmount" } } },
  ]);
  // Complex aggregation logic hidden from controller
  return { activeBuses: activeBuses.length, activeTrips, todayRevenue };
}
```

**How**: The controller doesn't need to know about MongoDB aggregation pipelines, date calculations, or data transformation. It just calls one function and gets clean results.

#### b) API Client — Hides HTTP Complexity
```javascript
// Abstract interface for frontend components:
const buses = await getFleetBuses();  // Simple call

// Underlying complexity hidden:
// 1. Gets token from localStorage
// 2. Constructs Authorization header
// 3. Tries enhanced endpoint first
// 4. Falls back to regular endpoint on failure
// 5. Parses JSON response
// 6. Handles errors
```

#### c) Database Connection — Hides MongoDB Setup
```typescript
// Simple interface:
await connectDB();

// Hides:
// - Connection string parsing
// - Connection pooling
// - Retry logic
// - Error handling
// - SSL/TLS configuration
```

#### d) React Component Abstraction
```jsx
// Dashboard page — abstract, high-level view:
<StatsOverview />        // Hides: API calls, data formatting, error states
<NetworkGraphView />     // Hides: D3 rendering, graph algorithms, animations
<LiveBusFeed />          // Hides: SSE connection, data polling, state updates
<TopRoutesSummary />     // Hides: Performance calculations, sorting logic
```

Each component abstracts away its internal complexity. The page doesn't know how `StatsOverview` fetches data or renders charts — it just places the component.

---

## 📊 Summary Table

| OOP Concept      | Where Applied                          | Example                              |
|------------------|----------------------------------------|--------------------------------------|
| **Encapsulation** | Mongoose Models, AuthContext, API Client | Bus model hides validation rules    |
| **Inheritance**   | Document interface, Middleware pattern  | All models inherit from Document    |
| **Polymorphism**  | Auth middleware, Model methods, Zod     | 5 auth functions, same interface    |
| **Abstraction**   | Service Layer, API Client, Components  | Service hides aggregation pipelines |

---

## 📝 Conclusion

The NextStop project demonstrates all four OOP pillars in a practical, real-world context:

1. **Encapsulation** protects data integrity through Mongoose schemas and controlled state access
2. **Inheritance** enables code reuse through Mongoose Document and shared interfaces
3. **Polymorphism** allows flexible authentication and uniform data operations
4. **Abstraction** simplifies complex operations behind clean service and component interfaces

These principles work together to create a maintainable, scalable, and well-organized codebase suitable for a production government transit system.

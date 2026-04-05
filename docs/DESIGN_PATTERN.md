# Design Pattern Used in NextStop

## Project: NextStop — Government Bus Tracking & Fleet Management System

---

## Main Pattern: MVC (Model-View-Controller)

We used the **MVC pattern** in our project because it keeps things organized. Instead of putting all the code in one place, we split it into three parts:

- **Model** — This is where we define how our data looks (like Bus, Route, Ticket etc.) and how it gets saved in the database.
- **View** — This is the frontend part. Our admin dashboard built with Next.js shows the data to the user.
- **Controller** — These are the API routes that handle requests. When the frontend asks for something, controllers receive the request and respond back.

We also added a **Service Layer** between the controller and model. The idea is simple — instead of writing all the logic inside the route handlers, we moved the heavy stuff (like fetching buses + their active trips together) into separate service files. This way the route files stay clean.

### How it maps to our folder structure:

| Layer | Where in our project | What it does |
|-------|---------------------|--------------|
| Model | `api/src/models/` | Defines database schemas (Bus.ts, Route.ts, Ticket.ts etc.) |
| View | `admin-portal/` | React frontend — pages, components, UI |
| Controller | `api/src/routes/` | API endpoints that handle HTTP requests |
| Service | `api/src/services/` | Business logic like fetching + processing data |

---

## How Each Layer Works (with examples)

### 1. Model Layer (`api/src/models/`)

These files define the shape of our data using Mongoose schemas. For example, the Bus model looks like this:

```typescript
const BusSchema = new Schema({
  busId: { type: String, required: true, unique: true },
  registrationNo: { type: String, required: true },
  type: { type: String, enum: ['AC Deluxe', 'Super Deluxe', 'Ordinary', 'Standard Non-AC'] },
  capacity: { type: Number, default: 50 },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  lastSeen: { type: Date, default: null },
}, { timestamps: true });
```

So whenever we create or fetch a bus from the database, it follows this structure. We have 14 such models in total — Bus, Route, Driver, Conductor, Trip, Ticket, Heartbeat, Device, AdminUser, AppUser, UserBooking, BusCapacity, OfflineBatch, and VoiceQuery.

### 2. View Layer (`admin-portal/`)

This is our Next.js frontend. Each page is a React component that fetches data from the API and displays it. For example, the dashboard page shows stats, a live bus feed, and a route network graph:

```jsx
export default function DashboardPage() {
  return (
    <div>
      <StatsOverview />
      <NetworkGraphView />
      <LiveBusFeed />
      <TopRoutesSummary />
    </div>
  );
}
```

The frontend never talks to the database directly — it only talks to the backend through API calls using `lib/api.js`.

### 3. Controller Layer (`api/src/routes/`)

These are Express route files. They receive HTTP requests, check if the user is authenticated, and then call the service layer to do the actual work:

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

Notice how the route handler itself doesn't do much — it just calls `AdminService.getFleetBuses()` and returns the result. All the actual logic is in the service file.

### 4. Service Layer (`api/src/services/`)

This is where the real work happens. Services fetch data from models, combine things together, and return processed results:

```typescript
export async function getFleetBuses() {
  const buses = await Bus.find().sort({ createdAt: -1 });
  const enrichedBuses = await Promise.all(
    buses.map(async (bus) => {
      const activeTrip = await Trip.findOne({ busId: bus.busId, status: 'active' });
      return { ...bus.toObject(), activeTrip };
    })
  );
  return enrichedBuses;
}
```

Here we're not just fetching buses — we're also checking if each bus has an active trip and attaching that info. This kind of logic would make the route file messy if we put it there directly.

---

## How a Request Flows Through the App

Let's say an admin opens the Fleet page to see all buses. Here's what happens step by step:

1. Admin clicks "Fleet Management" in the sidebar
2. The Fleet page component loads and calls `getFleetBuses()` from `lib/api.js`
3. `api.js` makes a GET request to `/admin/v1/fleet/buses` with the auth token
4. Express middleware checks if the token is valid
5. The route handler calls `AdminService.getFleetBuses()`
6. The service queries the Bus model and fetches all buses from MongoDB
7. It also checks for active trips for each bus
8. The combined data goes back to the controller → then to the frontend
9. The frontend renders the bus list in a table

---

## Other Patterns We Used

Apart from MVC, we noticed a few other patterns naturally showing up in our code:

### Middleware Pattern
Express middleware handles authentication. Every protected route has `authenticateAdmin` or `authenticateApp` middleware that runs before the actual handler. If the token is invalid, the request gets rejected right there.

### Observer Pattern (kind of)
For real-time bus tracking, we use SSE (Server-Sent Events). The server keeps pushing location updates to the frontend whenever new heartbeat data comes in. This is similar to the observer pattern where the client subscribes and gets notified of changes.

### Singleton Pattern
Our API client in the frontend (`lib/api.js`) creates one axios instance with the base URL and token, and every component reuses that same instance. We don't create a new connection every time.

### Context Pattern
We use React Context (`AuthContext`) to manage login state across the whole app. Instead of passing the user's auth info through every component as props, any component can just access it from the context.

---

## Why MVC Works Well for Our Project

- **Organized code** — Frontend, backend logic, and database stuff are in separate folders. Easy to find things.
- **Easier to work as a team** — One person can work on the frontend while another works on the API without conflicts.
- **Easy to test** — We can test service functions without needing to run the entire server.
- **Reusable logic** — The same service function can be used by different routes (e.g., both admin and conductor endpoints might need bus data).

---

## Quick Summary

Our project follows MVC + Service Layer:

- **14 Models** in `api/src/models/` define the data
- **React components** in `admin-portal/` display the UI
- **Route handlers** in `api/src/routes/` handle API requests
- **Services** in `api/src/services/` contain business logic

This separation made it easier for our team to build and maintain the project.

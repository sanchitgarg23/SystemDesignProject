# OOP Concepts in NextStop

## Project: NextStop — Government Bus Tracking & Fleet Management System

---

Our project uses JavaScript and TypeScript, which aren't purely object-oriented languages, but we still ended up using all four OOP principles in different parts of the code. Here's how.

---

## 1. Encapsulation

Encapsulation means keeping data and the functions that work on it together, and not letting outside code mess with the internals directly.

### In our Mongoose Models

Each model file bundles the data fields, validation rules, and database methods together. For example, the Bus model:

```typescript
// api/src/models/Bus.ts
const BusSchema = new Schema({
  busId: { type: String, required: true, unique: true },
  registrationNo: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active' 
  },
}, { timestamps: true });

export const Bus = mongoose.model<IBus>('Bus', BusSchema);
```

The schema defines what fields exist, what values are allowed (enum), and what's required. Nobody outside this file can just set `status` to some random value — Mongoose will reject it.

### In AuthContext

On the frontend, we use React Context to manage login state:

```javascript
// admin-portal/contexts/AuthContext.jsx
const [user, setUser] = useState(null);
const [token, setToken] = useState(null);

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
```

Components can't modify `user` or `token` directly. They have to go through `login()` and `logout()`. This prevents bugs where some random component accidentally changes the auth state.

### In the API Client

Our `lib/api.js` hides all the HTTP stuff (tokens, headers, error handling) behind simple functions:

```javascript
// What components call:
const buses = await getFleetBuses();

// What actually happens inside:
// - grabs token from localStorage
// - adds Authorization header
// - makes fetch request
// - parses JSON
// Components don't need to know any of this
```

---

## 2. Inheritance

Inheritance is when something gets properties/methods from a parent. We see this in a few places.

### Mongoose Document

Every model interface extends Mongoose's `Document`. This means all our models automatically get methods like `save()`, `remove()`, `toJSON()` etc. without us writing them.

```typescript
interface IBus extends Document {       // gets all Document methods
  busId: string;
  registrationNo: string;
}

interface IDriver extends Document {    // same parent, same methods
  driverId: string;
  name: string;
}

interface IConductor extends Document { // same thing
  conductorId: string;
  name: string;
}
```

So when we do `bus.save()` or `driver.save()`, that `save()` method comes from the parent `Document` class — we didn't write it ourselves.

### Driver and Conductor share the same structure

If you look at the Driver and Conductor models, they're almost identical — both have `name`, `phone`, `licenseNo`, `status`, `currentBusId`. They're basically the same "personnel" type, just with different ID fields:

```typescript
// Both follow the same pattern
Driver  → { driverId, name, phone, licenseNo, status, currentBusId }
Conductor → { conductorId, name, phone, licenseNo, status, currentBusId }
```

This is structural inheritance — same shape, reused across entities.

---

## 3. Polymorphism

Polymorphism means different things can be used in the same way, even though they behave differently internally.

### Authentication Middleware

We have 5 different auth functions, but they all work the same way from Express's perspective — they take `(req, res, next)` and either let the request through or block it:

```typescript
authenticateDevice(req, res, next)     // checks X-Device-Key header
authenticateAdmin(req, res, next)      // checks admin Bearer token
authenticateAppUser(req, res, next)    // checks APP_ prefixed token
authenticateConductor(req, res, next)  // checks CONDUCTOR_ prefixed token
```

Express doesn't care which one you use — they all have the same shape. But each one validates differently:

```typescript
router.get('/fleet/buses', authenticateAdmin, handler);    // admin auth
router.get('/stops', authenticateAppUser, handler);         // app user auth
router.post('/heartbeat', authenticateDevice, handler);     // device auth
```

Same slot in the middleware chain, different logic inside. That's polymorphism.

### Mongoose Model Methods

All models have `.find()`, `.save()`, `.findOne()` — same method names, but each one works on a different MongoDB collection:

```typescript
await Bus.find({ status: 'active' });      // searches buses collection
await Driver.find({ status: 'active' });   // searches drivers collection
await Trip.find({ status: 'active' });     // searches trips collection
```

Same function call, different data underneath.

---

## 4. Abstraction

Abstraction is about hiding complexity. You use something simple on the outside, and all the complicated stuff is handled internally.

### Service Layer

The route handlers don't need to know how data is fetched or processed. They just call a service function:

```typescript
// In the route file — simple:
const stats = await AdminService.getRealtimeStats();

// Inside the service — complicated:
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
  return { activeBuses: activeBuses.length, activeTrips, todayRevenue };
}
```

The controller doesn't know about aggregation pipelines or date math. It just gets a clean object back.

### React Components

On the frontend, each component hides its own complexity:

```jsx
<StatsOverview />       // handles its own API calls, loading states, number formatting
<LiveBusFeed />         // manages SSE connection, real-time updates internally
<NetworkGraphView />    // renders the whole graph, handles zoom/pan
```

The dashboard page just places these components. It doesn't care how they work inside.

### API Client

The frontend calls `getFleetBuses()` and gets data back. Behind the scenes, `api.js` handles getting the token, adding headers, making the HTTP request, and parsing the response. The component calling it doesn't deal with any of that.

---

## Summary

| Concept | Where we used it | Quick example |
|---------|-----------------|---------------|
| Encapsulation | Models, AuthContext, API client | Bus model bundles data + validation together |
| Inheritance | Mongoose Document, shared model structure | All models inherit `save()`, `find()` from Document |
| Polymorphism | Auth middleware, model methods | 5 auth functions with same signature, different logic |
| Abstraction | Service layer, React components, API client | Service hides complex MongoDB queries |

Basically, even though we're using JavaScript/TypeScript (not Java or C++), these OOP ideas naturally showed up in how we structured the project. Mongoose models act like classes, the service layer abstracts complexity, and the middleware system gives us polymorphism.

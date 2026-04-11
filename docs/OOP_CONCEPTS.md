# OOP Concepts in NextStop

## Project: NextStop — Government Bus Tracking & Fleet Management System

---

Our project uses TypeScript, which supports full object-oriented programming. We implemented all four OOP principles as actual classes and interfaces throughout the codebase. Here's how.

---

## 1. Encapsulation

Encapsulation means keeping data and the functions that work on it together, and not letting outside code mess with the internals directly.

### In our Service Classes

Each service class bundles related operations together and hides implementation details. For example, the `AdminService` class encapsulates all admin dashboard logic:

```typescript
// api/src/services/admin.service.ts
export class AdminService {
  // Public interface — controllers call these simple methods
  public static async getRealtimeAnalytics() { ... }
  public static async getRevenueAnalytics(date: string) { ... }
  public static async getFleetBuses() { ... }

  // Private helper — internal implementation detail, not accessible outside
  private static getEstimatedPassengers(hour: number, capacity: number): number {
    if (hour >= 7 && hour <= 9) return Math.round(capacity * 1.8);
    // ...
  }
}
```

### In our Mongoose Models

Each model file bundles the data fields, validation rules, and database methods together:

```typescript
// api/src/models/Bus.ts
const BusSchema = new Schema({
  busId: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],  // Constrained values
    default: 'active'
  },
}, { timestamps: true });
```

Nobody outside this file can set `status` to a random value — Mongoose will reject it.

### In the Database Singleton

The `Database` class encapsulates the connection state as a private field:

```typescript
// api/src/config/db.ts
export class Database {
  private static instance: Database;
  private isConnected: boolean = false;  // Private — can't be modified externally

  private constructor() { ... }   // Private — prevents direct instantiation
  public static getInstance() { ... }  // Controlled access point
}
```

### In AuthContext

On the frontend, React Context manages login state through controlled methods:

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

Components can't modify `user` or `token` directly. They have to go through `login()` and `logout()`.

---

## 2. Inheritance

Inheritance is when something gets properties and methods from a parent. We use this in several places.

### BasePersonnel — Shared Driver/Conductor Interface

Driver and Conductor are nearly identical entities. Instead of duplicating code, we defined a `BasePersonnel` interface and a shared schema factory:

```typescript
// api/src/models/BasePersonnel.ts
export interface IBasePersonnel extends Document {
  name: string;
  phone: string;
  licenseNo: string;
  status: 'active' | 'inactive' | 'on_leave';
  currentBusId: string | null;
}

export function createPersonnelSchema(): Schema {
  return new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    licenseNo: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive', 'on_leave'], default: 'active' },
    currentBusId: { type: String, default: null },
  }, { timestamps: true });
}
```

```typescript
// api/src/models/Driver.ts
export interface IDriver extends IBasePersonnel {  // Inherits all personnel fields
  driverId: string;                                // Adds its own ID
}

const DriverSchema = createPersonnelSchema();      // Reuses shared schema
DriverSchema.add({ driverId: { type: String, required: true, unique: true } });
```

```typescript
// api/src/models/Conductor.ts
export interface IConductor extends IBasePersonnel {  // Same parent, same fields
  conductorId: string;                                // Different ID field
}

const ConductorSchema = createPersonnelSchema();
ConductorSchema.add({ conductorId: { type: String, required: true, unique: true } });
```

### BaseController — Abstract Controller Class

All API controllers extend a common abstract class that provides shared utility methods:

```typescript
// api/src/controllers/BaseController.ts
export abstract class BaseController {
  protected router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  protected abstract initializeRoutes(): void;  // Subclasses must implement this
  public getRouter(): Router { return this.router; }

  protected sendSuccess(res, data, statusCode = 200) { ... }  // Inherited by all controllers
  protected sendError(res, code, message, statusCode = 500) { ... }
}
```

### Mongoose Document

Every model interface extends Mongoose's `Document`. This means all our models automatically get methods like `save()`, `remove()`, `toJSON()` without us writing them:

```typescript
interface IBus extends Document { ... }       // gets all Document methods
interface IDriver extends IBasePersonnel { ... }  // IBasePersonnel extends Document
```

---

## 3. Polymorphism

Polymorphism means different things can be used in the same way, even though they behave differently internally.

### Authentication Strategy Classes

We have 5 different auth strategy classes, but they all implement the same `IAuthStrategy` interface:

```typescript
// api/src/middleware/strategies/AuthStrategy.ts
export interface IAuthStrategy {
  authenticate(req: Request, res: Response, next: NextFunction): Promise<void> | void;
}

export class DeviceAuthStrategy implements IAuthStrategy {
  // Checks X-Device-Key header, does DB lookup
  public async authenticate(req, res, next) { ... }
}

export class AdminAuthStrategy implements IAuthStrategy {
  // Checks admin Bearer token
  public authenticate(req, res, next) { ... }
}

export class AppUserAuthStrategy implements IAuthStrategy {
  // Checks APP_ prefix, extracts userId
  public authenticate(req, res, next) { ... }
}
```

Express doesn't care which strategy is behind the middleware — they all produce the same `(req, res, next)` function:

```typescript
router.get('/fleet/buses', authenticateAdmin, handler);     // admin auth
router.get('/stops', authenticateAppUser, handler);          // app user auth
router.post('/heartbeat', authenticateDevice, handler);      // device auth
```

Same slot in the middleware chain, different validation logic inside. That's polymorphism.

### Observer Pattern — IObserver implementations

The `EventBus` calls `observer.update()` on any `IObserver`. Currently we have `SSEObserver`, but any class implementing `IObserver` could be substituted — the EventBus doesn't know or care about the concrete type.

---

## 4. Abstraction

Abstraction is about hiding complexity. You use something simple on the outside, and all the complicated stuff is handled internally.

### Service Layer Classes (Facade Pattern)

Route handlers don't need to know how data is fetched or processed. They just call a service class method:

```typescript
// In the route file — simple:
const stats = await AdminService.getRealtimeAnalytics();

// Inside AdminService — complicated:
export class AdminService {
  public static async getRealtimeAnalytics() {
    const heartbeats = await Heartbeat.aggregate([
      { $match: { timestamp: { $gte: fiveMinAgo } } },
      { $group: { _id: "$busId" } },
    ]);
    // ... complex load calculations, cross-collection joins
    return { activeBuses, avgSpeed, crowding };
  }
}
```

The controller doesn't know about aggregation pipelines or date math. It just gets a clean object back.

### Abstract BaseController

The `BaseController` abstract class hides router setup and response formatting:

```typescript
export abstract class BaseController {
  protected abstract initializeRoutes(): void;  // "What" to do (abstract)

  protected sendSuccess(res, data, statusCode = 200) {  // "How" to send (concrete)
    res.status(statusCode).json(data);
  }
}
```

Concrete controllers only define their routes. They inherit error handling and response formatting.

---

## Summary

| Concept | Where we used it | Quick example |
|---------|-----------------|---------------|
| Encapsulation | Service classes, Database Singleton, Models, AuthContext | AdminService hides private helpers, Database has private constructor |
| Inheritance | BasePersonnel, BaseController, Mongoose Document | Driver and Conductor extend IBasePersonnel |
| Polymorphism | IAuthStrategy implementations, IObserver implementations | 5 auth strategies with same interface, different logic |
| Abstraction | Service Facade classes, BaseController abstract class | AdminService.getRealtimeAnalytics() hides complex MongoDB queries |

Our project uses TypeScript classes, interfaces, and design patterns throughout — from database connection (Singleton), to real-time streaming (Observer), to authentication (Strategy), to business logic (Facade). The codebase is structured following object-oriented principles at every layer.

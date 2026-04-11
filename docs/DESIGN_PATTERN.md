# Design Patterns Used in NextStop

Since our application involves real-time tracking, database management, and complex API interactions, we utilized several standard Gang of Four (GoF) design patterns to structure our code effectively.

---

## 1. Singleton Pattern

The **Singleton Pattern** ensures that a class has only one instance and provides a global point of access to it. We used this pattern to manage shared resources efficiently without creating duplicate instances that waste memory and cause connection limits.

### Where we used it:

- **Database Connection (`config/db.ts`):** Our MongoDB connection is managed by a `Database` Singleton class. Regardless of how many modules import it, `Database.getInstance()` always returns the same instance with only one connection pool.

```typescript
// api/src/config/db.ts
export class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {
    this.uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gov-bus-tracking';
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;
    await mongoose.connect(this.uri);
    this.isConnected = true;
  }
}
```

- **EventBus (`core/EventBus.ts`):** Our real-time event distribution hub is also a Singleton, ensuring all SSE clients share a single publisher.

- **API Client (Frontend `lib/api.js`):** A single API client instance holds the base URL and intercepts requests to attach authentication tokens.

---

## 2. Observer Pattern

The **Observer Pattern** is a behavioral design pattern that allows an object (the Subject) to notify a list of dependents (Observers) automatically when its state changes.

### Where we used it:

- **Real-Time Bus Tracking via SSE (`core/EventBus.ts` + `core/SSEObserver.ts`):**

  - **Subject:** The `EventBus` class implements `ISubject` and manages subscriptions.
  - **Observer:** The `SSEObserver` class implements `IObserver` and wraps an Express Response.
  - **How it works:** When a client connects, an `SSEObserver` is created and subscribed to the EventBus. When new GPS data arrives, the EventBus calls `notify()`, which iterates through all observers and pushes the data via SSE.

```typescript
// api/src/core/EventBus.ts
export interface IObserver {
  readonly id: string;
  update(event: string, data: any): void;
}

export interface ISubject {
  subscribe(channel: string, observer: IObserver): void;
  unsubscribe(channel: string, observer: IObserver): void;
  notify(channel: string, data: any): void;
}

export class EventBus implements ISubject {
  private static instance: EventBus;
  private channels: Map<string, Set<IObserver>>;
  // ...
}
```

```typescript
// api/src/core/SSEObserver.ts
export class SSEObserver implements IObserver {
  public readonly id: string;
  private response: Response;

  public update(event: string, data: any): void {
    this.response.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}
```

---

## 3. Facade Pattern

The **Facade Pattern** provides a simplified interface to a complex subsystem, hiding the underlying complexity from the user (or caller).

### Where we used it:

- **The Service Layer Classes (`api/src/services/`):** Each service is a class that acts as a Facade over complex MongoDB operations:

```typescript
// api/src/services/admin.service.ts
export class AdminService {
  // Controller just calls this simple method:
  public static async getRealtimeAnalytics() {
    // Behind the scenes: aggregation pipeline, date math,
    // cross-collection joins, load calculations...
    const heartbeats = await Heartbeat.aggregate([...]);
    const crowding = { low: 0, medium: 0, high: 0 };
    for (const h of heartbeats) {
      const loadPct = await PassengerLoadService.calculatePassengerLoad(...);
      const category = PassengerLoadService.getLoadCategory(loadPct);
      crowding[category]++;
    }
    return { active_buses, avg_speed_kmph, crowding_breakdown };
  }
}
```

  Other service Facades: `AppService`, `BookingService`, `ConductorService`, `IngestService`, `QRService`, `PassengerLoadService`, `QueryService`, `UploadService`.

---

## 4. Strategy Pattern

The **Strategy Pattern** allows a system to select a specific algorithm or behavior at runtime out of a defined family of algorithms.

### Where we used it:

- **Authentication Middleware (`middleware/strategies/`):** We defined an `IAuthStrategy` interface and 5 concrete strategy classes. Each route picks the right strategy at registration time:

```typescript
// api/src/middleware/strategies/AuthStrategy.ts
export interface IAuthStrategy {
  authenticate(req: Request, res: Response, next: NextFunction): Promise<void> | void;
}

export class DeviceAuthStrategy implements IAuthStrategy {
  // Validates X-Device-Key header, DB lookup
}

export class AdminAuthStrategy implements IAuthStrategy {
  // Validates admin Bearer token
}

export class AppUserAuthStrategy implements IAuthStrategy {
  // Validates APP_ prefixed token, extracts userId
}

export class ConductorAuthStrategy implements IAuthStrategy {
  // Validates CONDUCTOR_ prefixed token
}
```

```typescript
// api/src/middleware/auth.ts — uses factory to create middleware
export const authenticateDevice = AuthMiddlewareFactory.create(new DeviceAuthStrategy());
export const authenticateAdmin = AuthMiddlewareFactory.create(new AdminAuthStrategy());
export const authenticateAppUser = AuthMiddlewareFactory.create(new AppUserAuthStrategy());
```

To Express, they all share the same `(req, res, next)` shape, but each executes completely different validation logic internally.

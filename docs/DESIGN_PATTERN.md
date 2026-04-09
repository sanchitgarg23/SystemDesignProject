# Design Patterns Used in NextStop

Since our application involves real-time tracking, database management, and complex API interactions, we utilized several standard Gang of Four (GoF) design patterns to structure our code effectively.

---

## 1. Singleton Pattern

The **Singleton Pattern** ensures that a class has only one instance and provides a global point of access to it. We used this pattern to manage shared resources efficiently without creating duplicate instances that waste memory and cause connection limits.

### Where we used it:
- **Database Connection (Mongoose):** In our Node.js backend, the MongoDB database connection is established as a Singleton. Regardless of how many API requests come in concurrently, they all share a single, robust connection pool to the database rather than opening a new connection for every request.
- **API Client (Frontend):** In our React frontend (`lib/api.js`), we configured a single Axios/Fetch API client instance. This instance holds the base URL and intercepts requests to automatically attach the user's authentication token. By keeping this as a Singleton, we ensure that authentication state is perfectly synchronized across the entire app.

---

## 2. Observer Pattern

The **Observer Pattern** is a behavioral design pattern that allows an object (the Subject) to notify a list of dependents (Observers) automatically when its state changes.

### Where we used it:
- **Real-Time Bus Tracking via SSE:** This is heavily used in our Server-Sent Events (SSE) system for live bus tracking. 
  - **Subject:** The Express.js backend server.
  - **Observers:** The administrator dashboards and passenger mobile apps.
  - **How it works:** When a passenger looks at the transit map, their browser subscribes to the server. Whenever the IoT device on the bus sends a new GPS "heartbeat" to the backend, the backend (Subject) iterates through all active connections and immediately pushes the new coordinates to the subscribed clients (Observers). The clients then dynamically update the bus marker on the map without needing to refresh the page.

---

## 3. Facade Pattern

The **Facade Pattern** provides a simplified interface to a complex subsystem, hiding the underlying complexity from the user (or caller). 

### Where we used it:
- **The Service Layer (`api/src/services/`):** Our backend routers (Controllers) are extremely thin because we placed a Service layer between our Routes and the Database. 
- For instance, generating dashboard analytics requires complex MongoDB aggregation pipelines, date grouping, and merging data from Tickets, Users, and Trips. Instead of cluttering the Controller with this logic, the Controller simply calls a Facade method like `AdminService.getRealtimeStats()`. 
- **Benefit:** The Controller only knows about handling HTTP and sending JSON responses, while the `AdminService` hides the complex database query logic behind a simplified interface.

---

## 4. Strategy Pattern

The **Strategy Pattern** allows a system to select a specific algorithm or behavior at runtime out of a defined family of algorithms.

### Where we used it:
- **Authentication Middleware:** The project serves many different types of users (Admins, App Users, Conductors, IoT Devices), and each requires a specifically tailored authentication workflow. 
- We created a set of generic Express middlewares (e.g., `authenticateAdmin`, `authenticateAppUser`, `authenticateDevice`). Depending on the route being accessed, the server applies the required authentication "strategy" at runtime. To Express, they all share the same layout `(req, res, next)`, but the validation logic they execute behind the scenes is completely different.

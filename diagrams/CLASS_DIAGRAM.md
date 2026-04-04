# Class Diagram

## NextStop — Government Bus Tracking & Fleet Management System

---

## 📊 UML Class Diagram (Mermaid)

```mermaid
classDiagram
    direction TB

    %% ==================== MODEL CLASSES ====================

    class Bus {
        -string busId
        -string registrationNo
        -string type
        -int capacity
        -string status
        -Date lastSeen
        -Date createdAt
        -Date updatedAt
        +save() Promise
        +toJSON() Object
    }

    class Route {
        -string routeId
        -string name
        -float farePerKm
        -string status
        -IStop[] stops
        -Date createdAt
        +save() Promise
        +toJSON() Object
    }

    class Stop {
        -string name
        -float lat
        -float lng
        -int sequence
    }

    class Driver {
        -string driverId
        -string name
        -string phone
        -string licenseNo
        -string status
        -string currentBusId
        -Date createdAt
        -Date updatedAt
        +save() Promise
        +toJSON() Object
    }

    class Conductor {
        -string conductorId
        -string name
        -string phone
        -string licenseNo
        -string status
        -string currentBusId
        -Date createdAt
        -Date updatedAt
        +save() Promise
        +toJSON() Object
    }

    class Trip {
        -string tripId
        -string busId
        -string routeId
        -string deviceId
        -string driverId
        -string conductorId
        -Date plannedStartTime
        -Date actualStartTime
        -Date actualEndTime
        -float startOdometerKm
        -float endOdometerKm
        -string status
        -Date createdAt
        +save() Promise
        +toJSON() Object
    }

    class Ticket {
        -string ticketId
        -string deviceId
        -string busId
        -string routeId
        -string tripId
        -Date issuedAt
        -string boardingStop
        -string destinationStop
        -float distanceKm
        -float fareAmount
        -string currency
        -string passengerType
        -string paymentMode
        -string seatNo
        -float currentLat
        -float currentLng
        -Date createdAt
        +save() Promise
        +toJSON() Object
    }

    class Heartbeat {
        -string deviceId
        -string busId
        -string routeId
        -string tripId
        -Date timestamp
        -float lat
        -float lng
        -float speedKmph
        -float bearingDeg
        -float odometerKm
        -float batteryPct
        -string networkType
        -float networkSignalDbm
        -Date createdAt
        +save() Promise
        +toJSON() Object
    }

    class Device {
        -string deviceId
        -string apiKey
        -string busId
        -string status
        -Date createdAt
        -Date lastSeen
        +save() Promise
        +toJSON() Object
    }

    class AdminUser {
        -string email
        -string password
        -string name
        -string role
        -boolean isActive
        -Date createdAt
        -Date updatedAt
        +save() Promise
        +toJSON() Object
    }

    class AppUser {
        -string userId
        -string mobile
        -string name
        -Date createdAt
        -Date lastLogin
        +save() Promise
        +toJSON() Object
    }

    class UserBooking {
        -string bookingId
        -string userId
        -string routeId
        -string tripId
        -string boardingStop
        -string destinationStop
        -Date journeyDate
        -int passengerCount
        -string passengerType
        -float fareAmount
        -string currency
        -string paymentStatus
        -string paymentMode
        -string transactionId
        -string status
        -string qrCode
        -string qrData
        -Date createdAt
        -Date updatedAt
        +save() Promise
        +toJSON() Object
    }

    class BusCapacity {
        -string busId
        -int capacity
        -Date createdAt
        -Date updatedAt
        +save() Promise
        +toJSON() Object
    }

    class OfflineBatch {
        -string batchId
        -string deviceId
        -Date uploadedAt
        -int ticketsCount
        -int acceptedCount
        -int duplicateCount
        -int rejectedCount
        -Date createdAt
        +save() Promise
        +toJSON() Object
    }

    class VoiceQuery {
        -string queryId
        -string userId
        -string audioUrl
        -float audioDuration
        -string language
        -string transcription
        -string translatedText
        -string queryType
        -string intent
        -string responseText
        -string responseAudioUrl
        -string responseLang
        -string status
        -float processingTime
        -string deviceInfo
        -float lat
        -float lng
        -Date createdAt
        -Date updatedAt
        +save() Promise
        +toJSON() Object
    }

    %% ==================== SERVICE CLASSES ====================

    class AdminService {
        +getRealtimeStats() Promise~Object~
        +getRevenueAnalytics(date) Promise~Object~
        +getTicketAnalytics(filters) Promise~Object~
        +getRoutePerformance() Promise~Object~
        +getAllRoutes() Promise~Route[]~
        +createRoute(data) Promise~Route~
        +updateRoute(routeId, data) Promise~Route~
        +deleteRoute(routeId) Promise~void~
        +getFleetBuses() Promise~Bus[]~
        +createBus(data) Promise~Bus~
        +updateBus(busId, data) Promise~Bus~
        +deleteBus(busId) Promise~void~
        +getFleetDrivers() Promise~Driver[]~
        +createDriver(data) Promise~Driver~
        +updateDriver(driverId, data) Promise~Driver~
        +deleteDriver(driverId) Promise~void~
        +getFleetConductors() Promise~Conductor[]~
        +createConductor(data) Promise~Conductor~
        +updateConductor(conductorId, data) Promise~Conductor~
        +deleteConductor(conductorId) Promise~void~
        +assignCrew(busId, driverId, conductorId) Promise~void~
        +getLiveBuses() Promise~Object[]~
        +getDeviceHealth() Promise~Object[]~
        +getDemandAnalysis(routeId) Promise~Object~
    }

    class AppService {
        +loginUser(mobile) Promise~Object~
        +getAllStops() Promise~string[]~
        +searchRoutes(query) Promise~Route[]~
        +searchByStops(source, dest) Promise~Route[]~
        +getLiveBusesOnRoute(routeId) Promise~Object[]~
        +trackBus(busId) Promise~Object~
        +getAllLiveBuses() Promise~Object[]~
    }

    class BookingService {
        +createBooking(userId, data) Promise~UserBooking~
        +getBooking(bookingId) Promise~UserBooking~
        +getUserBookings(userId) Promise~UserBooking[]~
        +cancelBooking(bookingId) Promise~void~
        +verifyQR(qrData) Promise~Object~
    }

    class ConductorService {
        +loginConductor(conductorId, deviceId) Promise~Object~
        +getActiveTrip(deviceId) Promise~Trip~
        +issueTicket(data) Promise~Ticket~
        +offlineSync(batchData) Promise~Object~
        +getTripTickets(tripId) Promise~Ticket[]~
    }

    class IngestService {
        +processHeartbeat(data) Promise~Heartbeat~
        +processTicket(data) Promise~Ticket~
        +startTrip(data) Promise~Trip~
        +endTrip(data) Promise~Trip~
        +processOfflineBatch(data) Promise~OfflineBatch~
    }

    class QRService {
        +generateQR(bookingData) Promise~string~
        +decodeQR(qrString) Promise~Object~
        +validateQR(qrData) Promise~boolean~
    }

    class PassengerLoadService {
        +estimateLoad(busId) Promise~Object~
        +getCapacity(busId) Promise~number~
    }

    class QueryService {
        +getBusLive(busId) Promise~Object~
        +getRouteLiveBuses(routeId) Promise~Object[]~
        +getTripTickets(tripId) Promise~Ticket[]~
        +getRevenueSummary(date) Promise~Object~
    }

    class UploadService {
        +bulkUploadRoutes(file) Promise~Object~
        +processCSV(filePath) Promise~Route[]~
    }

    %% ==================== MIDDLEWARE CLASSES ====================

    class AuthMiddleware {
        +authenticateDevice(req, res, next) void
        +authenticateBearer(req, res, next) void
        +authenticateAdmin(req, res, next) void
        +authenticateAppUser(req, res, next) void
        +authenticateConductor(req, res, next) void
    }

    %% ==================== CONTROLLER CLASSES (Routes) ====================

    class AdminController {
        +POST /auth/login
        +GET /routes
        +POST /routes
        +PUT /routes/:id
        +DELETE /routes/:id
        +GET /analytics/realtime
        +GET /analytics/revenue
        +GET /analytics/tickets
        +GET /fleet/buses
        +GET /fleet/drivers
        +GET /fleet/conductors
        +GET /buses/live
    }

    class AppController {
        +POST /auth/login
        +GET /stops
        +GET /routes/search
        +GET /routes/:id/live-buses
        +POST /booking
        +GET /bookings
        +DELETE /booking/:id
    }

    class ConductorController {
        +POST /auth/login
        +GET /trip/active
        +POST /ticket
        +POST /offline-sync
        +POST /verify-qr
    }

    class IngestController {
        +POST /heartbeat
        +POST /ticket
        +POST /trip/start
        +POST /trip/end
        +POST /offline-batch
    }

    %% ==================== FRONTEND CLASSES ====================

    class APIClient {
        -string API_BASE_URL
        -string ADMIN_API
        -getToken() string
        +apiRequest(endpoint, options) Promise
        +login(email, password) Promise
        +getRealtimeAnalytics() Promise
        +getAllRoutes() Promise
        +getLiveBuses() Promise
        +getFleetBuses() Promise
        +getFleetDrivers() Promise
        +getFleetConductors() Promise
        +createBus(data) Promise
        +updateBus(busId, data) Promise
        +deleteBus(busId) Promise
        +assignCrew(busId, driverId, conductorId) Promise
        +getAllBookings(filters) Promise
    }

    class AuthContext {
        -Object user
        -string token
        -boolean isLoading
        +login(token, user) void
        +logout() void
        +isAuthenticated() boolean
    }

    %% ==================== RELATIONSHIPS ====================

    %% Model Compositions
    Route "1" *-- "*" Stop : contains

    %% Model Associations
    Bus "1" -- "*" Trip : operates
    Route "1" -- "*" Trip : serves
    Driver "1" -- "*" Trip : drives
    Conductor "1" -- "*" Trip : conducts
    Device "1" -- "*" Trip : records
    Trip "1" -- "*" Ticket : generates
    Bus "1" -- "*" Heartbeat : transmits
    Device "1" -- "*" Heartbeat : sends
    AppUser "1" -- "*" UserBooking : books
    Route "1" -- "*" UserBooking : destination
    Device "1" -- "*" OfflineBatch : uploads
    AppUser "1" -- "*" VoiceQuery : queries
    Bus "1" -- "1" BusCapacity : capacity
    Device "*" -- "1" Bus : installed on
    Driver "*" -- "0..1" Bus : assigned to
    Conductor "*" -- "0..1" Bus : assigned to

    %% Service → Model dependencies
    AdminService --> Bus : manages
    AdminService --> Route : manages
    AdminService --> Driver : manages
    AdminService --> Conductor : manages
    AdminService --> Trip : queries
    AdminService --> Ticket : queries
    AdminService --> Heartbeat : queries
    AppService --> Route : queries
    AppService --> AppUser : manages
    BookingService --> UserBooking : manages
    BookingService --> Route : queries
    ConductorService --> Conductor : authenticates
    ConductorService --> Trip : manages
    ConductorService --> Ticket : issues
    IngestService --> Heartbeat : creates
    IngestService --> Ticket : creates
    IngestService --> Trip : manages
    QRService --> UserBooking : generates QR for

    %% Controller → Service dependencies
    AdminController --> AdminService : uses
    AdminController --> AuthMiddleware : protected by
    AppController --> AppService : uses
    AppController --> BookingService : uses
    AppController --> AuthMiddleware : protected by
    ConductorController --> ConductorService : uses
    ConductorController --> AuthMiddleware : protected by
    IngestController --> IngestService : uses
    IngestController --> AuthMiddleware : protected by

    %% Frontend → Backend
    APIClient --> AdminController : HTTP requests
    AuthContext --> APIClient : uses
```

---

## 📋 Class Summary

### Model Layer (14 Classes)

| Class          | Attributes | Key Methods      | Description                        |
|----------------|-----------|------------------|------------------------------------|
| Bus            | 7         | save(), toJSON() | Fleet vehicle entity               |
| Route          | 5         | save(), toJSON() | Transit route with embedded stops  |
| Stop           | 4         | —                | Embedded sub-document in Route     |
| Driver         | 7         | save(), toJSON() | Bus driver personnel               |
| Conductor      | 7         | save(), toJSON() | Bus conductor personnel            |
| Trip           | 12        | save(), toJSON() | Journey lifecycle tracking         |
| Ticket         | 17        | save(), toJSON() | Issued travel ticket               |
| Heartbeat      | 13        | save(), toJSON() | GPS telemetry data point           |
| Device         | 6         | save(), toJSON() | IoT ETM hardware device            |
| AdminUser      | 6         | save(), toJSON() | Admin portal user account          |
| AppUser        | 5         | save(), toJSON() | Passenger mobile app user          |
| UserBooking    | 18        | save(), toJSON() | Passenger booking with QR          |
| BusCapacity    | 4         | save(), toJSON() | Bus seating capacity               |
| OfflineBatch   | 7         | save(), toJSON() | Offline ticket sync batch          |
| VoiceQuery     | 17        | save(), toJSON() | Multilingual voice query           |

### Service Layer (8 Classes)

| Class                  | Methods | Description                          |
|------------------------|---------|--------------------------------------|
| AdminService           | 24      | Admin dashboard business logic       |
| AppService             | 7       | Passenger app business logic         |
| BookingService         | 5       | Booking & QR code logic              |
| ConductorService       | 5       | Conductor operations logic           |
| IngestService          | 5       | ETM data ingestion logic             |
| QRService              | 3       | QR code generation & validation      |
| PassengerLoadService   | 2       | Passenger load estimation            |
| QueryService           | 4       | Data query operations                |
| UploadService          | 2       | File upload & CSV processing         |

### Controller Layer (4 Classes)

| Class                  | Endpoints | Description                       |
|------------------------|-----------|-----------------------------------|
| AdminController        | 12+       | Admin API route handlers          |
| AppController          | 7         | Passenger app route handlers      |
| ConductorController    | 5         | Conductor app route handlers      |
| IngestController       | 5         | ETM data ingestion handlers       |

### Frontend Layer (2 Key Classes)

| Class        | Methods | Description                          |
|--------------|---------|--------------------------------------|
| APIClient    | 20+     | Centralized HTTP client for API      |
| AuthContext  | 3       | Authentication state management      |

---

## 🔗 Relationship Types

| Relationship Type | Symbol | Examples in Project                        |
|-------------------|--------|--------------------------------------------|
| **Composition**   | ◆——    | Route ◆—— Stop (stops exist only in route) |
| **Association**   | ——     | Bus —— Trip, Trip —— Ticket                |
| **Dependency**    | ┈┈▷   | AdminController ┈┈▷ AdminService           |
| **Uses**          | ──▷    | AuthContext ──▷ APIClient                  |

---

## 📝 Notes

1. **Mongoose Document Pattern**: All Model classes extend Mongoose's `Document` interface, inheriting built-in methods like `save()`, `remove()`, `toJSON()`, and `toObject()`.

2. **Service Layer Pattern**: Service classes are implemented as standalone modules with exported functions (not class instances), following Node.js functional patterns while maintaining logical grouping.

3. **Controller as Router**: Controllers in Express.js are implemented as `Router` instances with handler functions, mapped here as classes for UML clarity.

4. **Frontend Components**: React components (DashboardPage, Sidebar, NetworkGraphView, etc.) act as the View layer but are not shown as classes since they are functional components following React's composition pattern.

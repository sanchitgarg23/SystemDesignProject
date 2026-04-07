# Class Diagram

## NextStop — Government Bus Tracking & Fleet Management System

---

## 📊 Unified Domain-Driven UML Class Diagram

This comprehensive Class Diagram illustrates the end-to-end architecture of the **NextStop** system, focusing on how different domains (Fleet, Users, Ticketing, and Telemetry) interact to provide a seamless government bus tracking network.

```mermaid
classDiagram
    direction TB
    
    %% Core Transit Entities
    class Route {
        <<Domain Entity>>
        +String routeId
        +String routeName
        +Float distanceKm
        +save()
    }
    class Stop {
        <<Value Object>>
        +String stopName
        +Float lat
        +Float lng
    }
    class Bus {
        <<Domain Entity>>
        +String busId
        +String registrationNo
        +String status
        +save()
    }
    class Trip {
        <<Domain Entity>>
        +String tripId
        +DateTime startTime
        +String status
        +save()
    }
    
    %% Personnel
    class Driver {
        <<Actor>>
        +String driverId
        +String name
        +String licenseNo
    }
    class Conductor {
        <<Actor>>
        +String conductorId
        +String name
    }
    
    %% Passengers and Bookings
    class AppUser {
        <<Actor Passenger>>
        +String userId
        +String name
        +Float walletBalance
    }
    class UserBooking {
        <<Transaction>>
        +String bookingId
        +String paymentStatus
        +String qrCode
        +save()
    }
    class Ticket {
        <<Transaction>>
        +String ticketId
        +Float fare
        +String source
        +String destination
    }
    
    %% IoT & Telemetry
    class Device {
        <<Hardware>>
        +String deviceId
        +String imei
        +String batteryLevel
    }
    class Heartbeat {
        <<IoT Event>>
        +Float latitude
        +Float longitude
        +Float speed
        +DateTime timestamp
    }
    
    %% Business Relationships
    Route "1" *-- "many" Stop : contains
    Trip "*" -- "1" Route : operates on
    Trip "*" -- "1" Bus : assigned to
    Trip "*" -- "1" Driver : driven by
    Trip "*" -- "1" Conductor : managed by
    
    Bus "1" -- "1" Device : tracked via
    Device "1" *-- "many" Heartbeat : transmits
    
    AppUser "1" -- "*" UserBooking : makes
    UserBooking "*" -- "1" Trip : scheduled for
    UserBooking "1" -- "1" Ticket : generates
    Conductor "1" -- "*" Ticket : validates/issues

    %% Core Services Orchestrating Domains
    class BookingService {
        <<ServiceLayer>>
        +createBooking()
        +validateQR()
    }
    class IngestService {
        <<ServiceLayer>>
        +processHeartbeat()
    }
    
    BookingService ..> UserBooking: orchestrates
    IngestService ..> Heartbeat: processes
```

### Sub-System Flows Overview
The diagram natively groups into four logical domains:
1. **Fleet & Core Transit (Top)**: Details the physical assets like Routes, Stops, Buses, and Trips.
2. **Personnel (Middle Left)**: Defines operational actors including Drivers and Conductors.
3. **Ticketing & Booking (Middle Right)**: Covers app-based passenger flows, bookings, and ticket generation.
4. **IoT Tracking (Bottom Left)**: Real-time telemetry heartbeat data ingested from onboard GPS Devices.


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

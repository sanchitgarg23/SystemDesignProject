# Entity-Relationship (ER) Diagram

## NextStop — Government Bus Tracking & Fleet Management System

---

## 📊 ER Diagram (Mermaid)

```mermaid
erDiagram
    BUS {
        string busId PK "Unique bus identifier"
        string registrationNo "Vehicle registration number"
        string type "AC Deluxe | Super Deluxe | Ordinary | Standard Non-AC"
        int capacity "Seating capacity (default: 50)"
        string status "active | inactive | maintenance"
        date lastSeen "Last heartbeat timestamp"
        date createdAt "Record creation time"
        date updatedAt "Last update time"
    }

    ROUTE {
        string routeId PK "Unique route identifier"
        string name "Route display name"
        float farePerKm "Fare rate per kilometer"
        string status "active | inactive"
        date createdAt "Record creation time"
    }

    STOP {
        string name "Stop name"
        float lat "Latitude coordinate"
        float lng "Longitude coordinate"
        int sequence "Order in route"
    }

    DRIVER {
        string driverId PK "Unique driver identifier"
        string name "Full name"
        string phone "Contact phone number"
        string licenseNo "Driving license number"
        string status "active | inactive | on_leave"
        string currentBusId FK "Currently assigned bus"
        date createdAt "Record creation time"
        date updatedAt "Last update time"
    }

    CONDUCTOR {
        string conductorId PK "Unique conductor identifier"
        string name "Full name"
        string phone "Contact phone number"
        string licenseNo "License number"
        string status "active | inactive | on_leave"
        string currentBusId FK "Currently assigned bus"
        date createdAt "Record creation time"
        date updatedAt "Last update time"
    }

    TRIP {
        string tripId PK "Unique trip identifier"
        string busId FK "Assigned bus"
        string routeId FK "Assigned route"
        string deviceId FK "ETM device on bus"
        string driverId FK "Assigned driver"
        string conductorId FK "Assigned conductor"
        date plannedStartTime "Scheduled departure"
        date actualStartTime "Actual departure"
        date actualEndTime "Actual arrival"
        float startOdometerKm "Start odometer reading"
        float endOdometerKm "End odometer reading"
        string status "active | completed | cancelled"
        date createdAt "Record creation time"
    }

    TICKET {
        string ticketId PK "Unique ticket identifier"
        string deviceId FK "Issuing ETM device"
        string busId FK "Bus on which issued"
        string routeId FK "Route of travel"
        string tripId FK "Associated trip"
        date issuedAt "Ticket issue timestamp"
        string boardingStop "Boarding stop name"
        string destinationStop "Destination stop name"
        float distanceKm "Travel distance"
        float fareAmount "Fare charged"
        string currency "Currency code (INR)"
        string passengerType "adult | student | senior | pass"
        string paymentMode "cash | card | upi | pass"
        string seatNo "Allocated seat number"
        float currentLat "Issue location latitude"
        float currentLng "Issue location longitude"
        date createdAt "Record creation time"
    }

    HEARTBEAT {
        string deviceId FK "Reporting ETM device"
        string busId FK "Bus being tracked"
        string routeId FK "Current route"
        string tripId FK "Current trip"
        date timestamp "Heartbeat timestamp"
        float lat "GPS latitude"
        float lng "GPS longitude"
        float speedKmph "Current speed"
        float bearingDeg "Travel direction"
        float odometerKm "Odometer reading"
        float batteryPct "Device battery level"
        string networkType "2G | 3G | 4G | 5G | WiFi"
        float networkSignalDbm "Signal strength"
        date createdAt "Record creation time"
    }

    DEVICE {
        string deviceId PK "Unique device identifier"
        string apiKey "Authentication API key"
        string busId FK "Assigned bus"
        string status "active | inactive"
        date createdAt "Record creation time"
        date lastSeen "Last heartbeat received"
    }

    ADMIN_USER {
        string email PK "Login email address"
        string password "Hashed password"
        string name "Full name"
        string role "admin | super_admin | viewer"
        boolean isActive "Account active status"
        date createdAt "Record creation time"
        date updatedAt "Last update time"
    }

    APP_USER {
        string userId PK "Unique passenger identifier"
        string mobile "Mobile phone number"
        string name "Full name"
        date createdAt "Registration date"
        date lastLogin "Last login timestamp"
    }

    USER_BOOKING {
        string bookingId PK "Unique booking identifier"
        string userId FK "Booking passenger"
        string routeId FK "Booked route"
        string tripId FK "Assigned trip"
        string boardingStop "Boarding stop"
        string destinationStop "Destination stop"
        date journeyDate "Date of travel"
        int passengerCount "Number of passengers"
        string passengerType "adult | child | senior"
        float fareAmount "Total fare"
        string currency "Currency code (INR)"
        string paymentStatus "pending | paid | refunded"
        string paymentMode "upi | card | wallet"
        string transactionId "Payment transaction ID"
        string status "confirmed | cancelled | completed | expired"
        string qrCode "Base64 QR image"
        string qrData "QR payload JSON"
        date createdAt "Booking creation time"
        date updatedAt "Last status update"
    }

    BUS_CAPACITY {
        string busId PK-FK "Bus reference"
        int capacity "Current capacity"
        date createdAt "Record creation time"
        date updatedAt "Last update time"
    }

    OFFLINE_BATCH {
        string batchId PK "Unique batch identifier"
        string deviceId FK "Uploading device"
        date uploadedAt "Upload timestamp"
        int ticketsCount "Total tickets in batch"
        int acceptedCount "Successfully processed"
        int duplicateCount "Duplicate tickets skipped"
        int rejectedCount "Invalid tickets rejected"
        date createdAt "Record creation time"
    }

    VOICE_QUERY {
        string queryId PK "Unique query identifier"
        string userId FK "Querying user"
        string audioUrl "Audio file URL"
        float audioDuration "Audio length in seconds"
        string language "Query language (pa/en/hi)"
        string transcription "Speech-to-text output"
        string translatedText "Translated query text"
        string queryType "Type of query"
        string intent "Detected intent"
        string responseText "Response text"
        string responseAudioUrl "Response audio URL"
        string responseLang "Response language"
        string status "pending | processing | completed | failed"
        float processingTime "Processing duration ms"
        string deviceInfo "Client device info"
        float lat "Query location latitude"
        float lng "Query location longitude"
        date createdAt "Query timestamp"
        date updatedAt "Last status update"
    }

    %% ========== RELATIONSHIPS ==========

    ROUTE ||--|{ STOP : "contains (1:M)"
    BUS ||--o{ TRIP : "operates (1:M)"
    ROUTE ||--o{ TRIP : "served by (1:M)"
    DRIVER ||--o{ TRIP : "drives (1:M)"
    CONDUCTOR ||--o{ TRIP : "conducts (1:M)"
    DEVICE ||--o{ TRIP : "records (1:M)"

    TRIP ||--o{ TICKET : "generates (1:M)"
    BUS ||--o{ TICKET : "issued on (1:M)"
    ROUTE ||--o{ TICKET : "for route (1:M)"

    BUS ||--o{ HEARTBEAT : "transmits (1:M)"
    DEVICE ||--o{ HEARTBEAT : "sends (1:M)"

    DEVICE ||--o| BUS : "installed on (M:1)"
    DRIVER ||--o| BUS : "assigned to (M:1)"
    CONDUCTOR ||--o| BUS : "assigned to (M:1)"

    BUS ||--|| BUS_CAPACITY : "has capacity (1:1)"

    APP_USER ||--o{ USER_BOOKING : "creates (1:M)"
    ROUTE ||--o{ USER_BOOKING : "booked for (1:M)"

    DEVICE ||--o{ OFFLINE_BATCH : "uploads (1:M)"

    APP_USER ||--o{ VOICE_QUERY : "submits (1:M)"
```

---

## 📋 Entity Summary

| #  | Entity          | Description                              | Primary Key  |
|----|-----------------|------------------------------------------|--------------|
| 1  | Bus             | Fleet vehicles                           | busId        |
| 2  | Route           | Transit routes                           | routeId      |
| 3  | Stop            | Embedded stops within Route              | (embedded)   |
| 4  | Driver          | Bus drivers                              | driverId     |
| 5  | Conductor       | Bus conductors                           | conductorId  |
| 6  | Trip            | Journey instances                        | tripId       |
| 7  | Ticket          | Issued travel tickets                    | ticketId     |
| 8  | Heartbeat       | GPS telemetry pings                      | (auto _id)   |
| 9  | Device          | ETM IoT hardware                         | deviceId     |
| 10 | AdminUser       | Admin portal accounts                    | email        |
| 11 | AppUser         | Passenger app accounts                   | userId       |
| 12 | UserBooking     | Passenger bookings with QR               | bookingId    |
| 13 | BusCapacity     | Seat capacity per bus                    | busId        |
| 14 | OfflineBatch    | Offline ticket sync records              | batchId      |
| 15 | VoiceQuery      | Multilingual voice queries               | queryId      |

---

## 🔗 Relationship Summary

| Relationship                  | Cardinality | Description                                          |
|-------------------------------|-------------|------------------------------------------------------|
| Route → Stop                  | 1 : M       | Each route contains multiple ordered stops           |
| Bus → Trip                    | 1 : M       | One bus operates many trips over time                |
| Route → Trip                  | 1 : M       | One route is served by many trips                    |
| Driver → Trip                 | 1 : M       | One driver drives many trips                         |
| Conductor → Trip              | 1 : M       | One conductor conducts many trips                    |
| Trip → Ticket                 | 1 : M       | One trip generates many tickets                      |
| Bus → Heartbeat               | 1 : M       | One bus transmits many GPS heartbeats                |
| Device → Bus                  | M : 1       | One device is installed on one bus                   |
| Driver → Bus                  | M : 1       | A driver can be assigned to one bus at a time        |
| Conductor → Bus               | M : 1       | A conductor can be assigned to one bus at a time     |
| Bus → BusCapacity             | 1 : 1       | Each bus has exactly one capacity record             |
| AppUser → UserBooking         | 1 : M       | One passenger can create many bookings               |
| Route → UserBooking           | 1 : M       | One route can have many bookings                     |
| Device → OfflineBatch         | 1 : M       | One device can upload many offline batches           |
| AppUser → VoiceQuery          | 1 : M       | One user can submit many voice queries               |
| Device → Heartbeat            | 1 : M       | One device sends many heartbeats                     |
| Device → Trip                 | 1 : M       | One device records data for many trips               |

---

## 📝 Notes

1. **MongoDB Document Model**: While this ER diagram follows relational conventions, the actual database uses MongoDB (NoSQL). Relationships are implemented via string-based foreign keys (e.g., `busId`, `routeId`) rather than traditional SQL foreign key constraints.

2. **Embedded Documents**: The `Stop` entity is embedded within the `Route` document as a sub-document array, leveraging MongoDB's document model for co-located data access.

3. **Denormalization**: Some fields like `busId` appear in multiple collections (Trip, Ticket, Heartbeat) for query performance — a common MongoDB pattern.

4. **Compound Indexes**: Several collections use compound indexes (e.g., `Ticket: {tripId, issuedAt}`, `Heartbeat: {busId, timestamp}`) for optimized query performance on frequently accessed data patterns.

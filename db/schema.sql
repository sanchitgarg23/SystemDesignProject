-- ============================================================
-- NextStop — Database Schema
-- Government Bus Tracking & Fleet Management System
-- ============================================================
-- Database: MongoDB (NoSQL Document Store)
-- ODM: Mongoose 8.x
-- 
-- NOTE: This SQL-style schema is provided as a reference for
-- academic documentation. The actual database uses MongoDB
-- collections with Mongoose schemas (see /api/src/models/).
-- ============================================================


-- ============================================================
-- 1. BUSES — Fleet vehicle registry
-- ============================================================
CREATE TABLE buses (
    _id             ObjectId    PRIMARY KEY AUTO,
    busId           VARCHAR(50) NOT NULL UNIQUE,
    registrationNo  VARCHAR(20) NOT NULL,
    type            ENUM('AC Deluxe', 'Super Deluxe', 'Ordinary', 'Standard Non-AC') DEFAULT 'Ordinary',
    capacity        INT         NOT NULL DEFAULT 50,
    status          ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    lastSeen        DATETIME    DEFAULT NULL,
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_busId (busId)
);


-- ============================================================
-- 2. ROUTES — Transit route definitions
-- ============================================================
CREATE TABLE routes (
    _id             ObjectId    PRIMARY KEY AUTO,
    routeId         VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(200) NOT NULL,
    farePerKm       DECIMAL(6,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'active',
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_routeId (routeId)
);

-- Embedded sub-document: stops[] within routes
-- In MongoDB this is an array of objects inside the route document
CREATE TABLE route_stops (
    _id             ObjectId    PRIMARY KEY AUTO,
    routeId         VARCHAR(50) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    lat             DECIMAL(10,7) NOT NULL,
    lng             DECIMAL(10,7) NOT NULL,
    sequence        INT         NOT NULL,
    
    FOREIGN KEY (routeId) REFERENCES routes(routeId)
);


-- ============================================================
-- 3. DRIVERS — Bus driver personnel
-- ============================================================
CREATE TABLE drivers (
    _id             ObjectId    PRIMARY KEY AUTO,
    driverId        VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    licenseNo       VARCHAR(30) NOT NULL,
    status          ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    currentBusId    VARCHAR(50) DEFAULT NULL,
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_driverId (driverId),
    FOREIGN KEY (currentBusId) REFERENCES buses(busId)
);


-- ============================================================
-- 4. CONDUCTORS — Bus conductor personnel
-- ============================================================
CREATE TABLE conductors (
    _id             ObjectId    PRIMARY KEY AUTO,
    conductorId     VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    licenseNo       VARCHAR(30) NOT NULL,
    status          ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    currentBusId    VARCHAR(50) DEFAULT NULL,
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_conductorId (conductorId),
    FOREIGN KEY (currentBusId) REFERENCES buses(busId)
);


-- ============================================================
-- 5. DEVICES — IoT ETM (Electronic Ticket Machine) hardware
-- ============================================================
CREATE TABLE devices (
    _id             ObjectId    PRIMARY KEY AUTO,
    deviceId        VARCHAR(50) NOT NULL UNIQUE,
    apiKey          VARCHAR(100) NOT NULL UNIQUE,
    busId           VARCHAR(50) DEFAULT NULL,
    status          VARCHAR(20) DEFAULT 'active',
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    lastSeen        DATETIME    DEFAULT NULL,
    
    INDEX idx_deviceId (deviceId),
    INDEX idx_busId (busId),
    FOREIGN KEY (busId) REFERENCES buses(busId)
);


-- ============================================================
-- 6. TRIPS — Journey lifecycle tracking
-- ============================================================
CREATE TABLE trips (
    _id             ObjectId    PRIMARY KEY AUTO,
    tripId          VARCHAR(50) NOT NULL UNIQUE,
    busId           VARCHAR(50) NOT NULL,
    routeId         VARCHAR(50) NOT NULL,
    deviceId        VARCHAR(50) NOT NULL,
    driverId        VARCHAR(50) DEFAULT NULL,
    conductorId     VARCHAR(50) DEFAULT NULL,
    plannedStartTime DATETIME   DEFAULT NULL,
    actualStartTime  DATETIME   DEFAULT NULL,
    actualEndTime    DATETIME   DEFAULT NULL,
    startOdometerKm  DECIMAL(10,2) DEFAULT NULL,
    endOdometerKm    DECIMAL(10,2) DEFAULT NULL,
    status          VARCHAR(20) DEFAULT 'active',
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tripId (tripId),
    INDEX idx_busId (busId),
    INDEX idx_routeId (routeId),
    INDEX idx_deviceId (deviceId),
    INDEX idx_status (status),
    FOREIGN KEY (busId) REFERENCES buses(busId),
    FOREIGN KEY (routeId) REFERENCES routes(routeId),
    FOREIGN KEY (deviceId) REFERENCES devices(deviceId),
    FOREIGN KEY (driverId) REFERENCES drivers(driverId),
    FOREIGN KEY (conductorId) REFERENCES conductors(conductorId)
);


-- ============================================================
-- 7. TICKETS — Issued travel tickets
-- ============================================================
CREATE TABLE tickets (
    _id             ObjectId    PRIMARY KEY AUTO,
    ticketId        VARCHAR(50) NOT NULL UNIQUE,
    deviceId        VARCHAR(50) NOT NULL,
    busId           VARCHAR(50) NOT NULL,
    routeId         VARCHAR(50) NOT NULL,
    tripId          VARCHAR(50) NOT NULL,
    issuedAt        DATETIME    NOT NULL,
    boardingStop    VARCHAR(200) NOT NULL,
    destinationStop VARCHAR(200) NOT NULL,
    distanceKm      DECIMAL(8,2) DEFAULT NULL,
    fareAmount      DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(5)  DEFAULT 'INR',
    passengerType   ENUM('adult', 'student', 'senior', 'pass') NOT NULL,
    paymentMode     ENUM('cash', 'card', 'upi', 'pass') NOT NULL,
    seatNo          VARCHAR(10) DEFAULT NULL,
    currentLat      DECIMAL(10,7) DEFAULT NULL,
    currentLng      DECIMAL(10,7) DEFAULT NULL,
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ticketId (ticketId),
    INDEX idx_tripId_issuedAt (tripId, issuedAt DESC),
    INDEX idx_busId_issuedAt (busId, issuedAt DESC),
    FOREIGN KEY (tripId) REFERENCES trips(tripId),
    FOREIGN KEY (busId) REFERENCES buses(busId),
    FOREIGN KEY (routeId) REFERENCES routes(routeId)
);


-- ============================================================
-- 8. HEARTBEATS — Real-time GPS telemetry data
-- ============================================================
CREATE TABLE heartbeats (
    _id             ObjectId    PRIMARY KEY AUTO,
    deviceId        VARCHAR(50) NOT NULL,
    busId           VARCHAR(50) NOT NULL,
    routeId         VARCHAR(50) DEFAULT NULL,
    tripId          VARCHAR(50) DEFAULT NULL,
    timestamp       DATETIME    NOT NULL,
    lat             DECIMAL(10,7) NOT NULL,
    lng             DECIMAL(10,7) NOT NULL,
    speedKmph       DECIMAL(6,2) DEFAULT NULL,
    bearingDeg      DECIMAL(6,2) DEFAULT NULL,
    odometerKm      DECIMAL(10,2) DEFAULT NULL,
    batteryPct      DECIMAL(5,2) DEFAULT NULL,
    networkType     ENUM('2G', '3G', '4G', '5G', 'WiFi') DEFAULT NULL,
    networkSignalDbm DECIMAL(6,2) DEFAULT NULL,
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_deviceId (deviceId),
    INDEX idx_busId_timestamp (busId, timestamp DESC),
    INDEX idx_routeId_timestamp (routeId, timestamp DESC)
);


-- ============================================================
-- 9. ADMIN USERS — Admin portal accounts
-- ============================================================
CREATE TABLE admin_users (
    _id             ObjectId    PRIMARY KEY AUTO,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    role            ENUM('admin', 'super_admin', 'viewer') DEFAULT 'admin',
    isActive        BOOLEAN     DEFAULT TRUE,
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 10. APP USERS — Passenger mobile app accounts
-- ============================================================
CREATE TABLE app_users (
    _id             ObjectId    PRIMARY KEY AUTO,
    userId          VARCHAR(50) NOT NULL UNIQUE,
    mobile          VARCHAR(15) NOT NULL UNIQUE,
    name            VARCHAR(100) DEFAULT NULL,
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    lastLogin       DATETIME    DEFAULT NULL,
    
    INDEX idx_userId (userId),
    INDEX idx_mobile (mobile)
);


-- ============================================================
-- 11. USER BOOKINGS — Passenger ticket bookings with QR codes
-- ============================================================
CREATE TABLE user_bookings (
    _id             ObjectId    PRIMARY KEY AUTO,
    bookingId       VARCHAR(50) NOT NULL UNIQUE,
    userId          VARCHAR(50) NOT NULL,
    routeId         VARCHAR(50) NOT NULL,
    tripId          VARCHAR(50) DEFAULT NULL,
    boardingStop    VARCHAR(200) NOT NULL,
    destinationStop VARCHAR(200) NOT NULL,
    journeyDate     DATE        NOT NULL,
    passengerCount  INT         DEFAULT 1,
    passengerType   ENUM('adult', 'child', 'senior') DEFAULT 'adult',
    fareAmount      DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(5)  DEFAULT 'INR',
    paymentStatus   ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    paymentMode     ENUM('upi', 'card', 'wallet') DEFAULT NULL,
    transactionId   VARCHAR(100) DEFAULT NULL,
    status          ENUM('confirmed', 'cancelled', 'completed', 'expired') DEFAULT 'confirmed',
    qrCode          TEXT        DEFAULT NULL,
    qrData          TEXT        DEFAULT NULL,
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_bookingId (bookingId),
    INDEX idx_userId_journeyDate (userId, journeyDate DESC),
    INDEX idx_status_journeyDate (status, journeyDate),
    FOREIGN KEY (userId) REFERENCES app_users(userId),
    FOREIGN KEY (routeId) REFERENCES routes(routeId)
);


-- ============================================================
-- 12. BUS CAPACITIES — Seat capacity tracking per bus
-- ============================================================
CREATE TABLE bus_capacities (
    _id             ObjectId    PRIMARY KEY AUTO,
    busId           VARCHAR(50) NOT NULL UNIQUE,
    capacity        INT         DEFAULT 50,
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_busId (busId),
    FOREIGN KEY (busId) REFERENCES buses(busId)
);


-- ============================================================
-- 13. OFFLINE BATCHES — Offline ticket sync records
-- ============================================================
CREATE TABLE offline_batches (
    _id             ObjectId    PRIMARY KEY AUTO,
    batchId         VARCHAR(50) NOT NULL UNIQUE,
    deviceId        VARCHAR(50) NOT NULL,
    uploadedAt      DATETIME    NOT NULL,
    ticketsCount    INT         DEFAULT 0,
    acceptedCount   INT         DEFAULT 0,
    duplicateCount  INT         DEFAULT 0,
    rejectedCount   INT         DEFAULT 0,
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_deviceId (deviceId),
    FOREIGN KEY (deviceId) REFERENCES devices(deviceId)
);


-- ============================================================
-- 14. VOICE QUERIES — Multilingual voice-based route queries
-- ============================================================
CREATE TABLE voice_queries (
    _id             ObjectId    PRIMARY KEY AUTO,
    queryId         VARCHAR(50) NOT NULL UNIQUE,
    userId          VARCHAR(50) DEFAULT NULL,
    audioUrl        VARCHAR(500) NOT NULL,
    audioDuration   DECIMAL(8,2) DEFAULT NULL,
    language        VARCHAR(5)  DEFAULT 'pa',
    transcription   TEXT        DEFAULT NULL,
    translatedText  TEXT        DEFAULT NULL,
    queryType       VARCHAR(50) DEFAULT NULL,
    intent          VARCHAR(50) DEFAULT NULL,
    responseText    TEXT        DEFAULT NULL,
    responseAudioUrl VARCHAR(500) DEFAULT NULL,
    responseLang    VARCHAR(5)  DEFAULT 'pa',
    status          ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    processingTime  DECIMAL(10,2) DEFAULT NULL,
    deviceInfo      VARCHAR(200) DEFAULT NULL,
    lat             DECIMAL(10,7) DEFAULT NULL,
    lng             DECIMAL(10,7) DEFAULT NULL,
    createdAt       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_queryId (queryId),
    INDEX idx_userId (userId),
    INDEX idx_language (language),
    INDEX idx_status (status),
    INDEX idx_createdAt (createdAt)
);


-- ============================================================
-- SCHEMA SUMMARY
-- ============================================================
-- Total Collections/Tables: 14
-- Total Fields:             ~140
-- Total Indexes:            ~35
-- 
-- Key Relationships:
--   Bus     1:M  Trip, Ticket, Heartbeat
--   Route   1:M  Trip, Ticket, UserBooking (embedded: Stops)
--   Driver  M:1  Bus (current assignment)
--   Conductor M:1 Bus (current assignment)
--   Device  M:1  Bus (installed on)
--   Trip    1:M  Ticket
--   AppUser 1:M  UserBooking, VoiceQuery
--   Bus     1:1  BusCapacity
--   Device  1:M  OfflineBatch
-- ============================================================

# New Gov API (MongoDB)

Government Bus Tracking API built with **MongoDB + Mongoose** instead of Prisma/MySQL.

## Features

- 🎫 **Ticket Booking** - Book tickets with 12:01 AM constraint
- 🚌 **Bus Tracking** - Real-time GPS tracking
- 👥 **Passenger Load** - Track passenger count per bus
- 📱 **QR Codes** - Generate and verify tickets via QR
- 📊 **Analytics** - Revenue, route performance, fleet management

## Quick Start

```bash
# Install dependencies
npm install

# Start MongoDB (required)
mongod

# Seed initial data
npm run seed

# Start development server
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and update values:

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/gov-bus-tracking
ETM_BEARER_TOKEN=demo_token_12345
ADMIN_DEMO_TOKEN=admin_demo_token_12345
QR_SECRET=your_qr_secret_key_here
```

## API Endpoints

### Passenger App (`/app/v1`)
- `POST /auth/login` - Login with mobile number
- `GET /routes/search?query=...` - Search routes
- `POST /booking` - Create booking (opens at 12:01 AM)
- `GET /bookings` - Get user's bookings

### Conductor App (`/conductor/v1`)
- `POST /auth/login` - Conductor login
- `POST /ticket` - Issue ticket
- `POST /verify-qr` - Verify booking QR code

### Admin Portal (`/admin/v1`)
- `GET /analytics/realtime` - Live analytics
- `GET /analytics/revenue?date=YYYY-MM-DD` - Revenue report
- `GET /bookings` - All bookings (for govt portal)

## Default Tokens

- **ETM Bearer**: `demo_token_12345`
- **Admin Token**: `admin_demo_token_12345`
- **App Token**: `APP_<user_id>_<timestamp>` (from login)
- **Conductor Token**: `CONDUCTOR_<device_id>_<conductor_id>_<timestamp>`

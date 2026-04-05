import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { Heartbeat, Trip } from './models';

dotenv.config();

// Bus simulation data
const BUSES = [
  {
    deviceId: 'etm0001',
    busId: 'BUS001',
    routeId: 'R19',
    tripId: 'TRIP001',
    baseLat: 30.901,
    baseLng: 75.8573,
    baseSpeed: 45,
    bearing: 90,
    passengers: 18,
  },
  {
    deviceId: 'etm0002',
    busId: 'BUS002',
    routeId: 'R19',
    tripId: 'TRIP002',
    baseLat: 30.915,
    baseLng: 75.87,
    baseSpeed: 52,
    bearing: 85,
    passengers: 34,
  },
  {
    deviceId: 'etm0003',
    busId: 'BUS003',
    routeId: 'R20',
    tripId: 'TRIP003',
    baseLat: 30.89,
    baseLng: 75.84,
    baseSpeed: 38,
    bearing: 120,
    passengers: 38,
  },
];

async function sendHeartbeats() {
  console.log(`📡 [${new Date().toLocaleTimeString()}] Sending heartbeats...`);

  for (const bus of BUSES) {
    // Add small random variation to simulate movement
    const latVariation = (Math.random() - 0.5) * 0.002;
    const lngVariation = (Math.random() - 0.5) * 0.002;
    const speedVariation = Math.floor((Math.random() - 0.5) * 10);

    const heartbeat = new Heartbeat({
      deviceId: bus.deviceId,
      busId: bus.busId,
      routeId: bus.routeId,
      tripId: bus.tripId,
      timestamp: new Date(),
      lat: bus.baseLat + latVariation,
      lng: bus.baseLng + lngVariation,
      speedKmph: Math.max(0, bus.baseSpeed + speedVariation),
      bearingDeg: bus.bearing,
      passengerCount: bus.passengers,
    });

    await heartbeat.save();
    console.log(`   ✅ ${bus.busId} @ ${bus.routeId}`);
  }
}

async function main() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    console.log('🚌 Starting bus simulator...');
    console.log('   Sending heartbeats every 10 seconds');
    console.log('   Press Ctrl+C to stop\n');

    // Send initial heartbeats
    await sendHeartbeats();

    // Send heartbeats every 10 seconds
    setInterval(sendHeartbeats, 10000);
  } catch (error) {
    console.error('❌ Simulator error:', error);
    process.exit(1);
  }
}

main();

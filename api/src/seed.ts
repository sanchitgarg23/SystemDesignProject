import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { Device, Route, BusCapacity, Trip, Heartbeat, AppUser } from './models';

dotenv.config();

async function seed() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await Device.deleteMany({});
    await Route.deleteMany({});
    await BusCapacity.deleteMany({});
    await Trip.deleteMany({});
    await Heartbeat.deleteMany({});
    await AppUser.deleteMany({});

    console.log('📝 Creating devices...');
    const devices = await Device.insertMany([
      {
        deviceId: 'etm0001',
        apiKey: 'dev_etm0001_key',
        busId: 'BUS001',
        status: 'active',
        lastSeen: new Date(),
      },
      {
        deviceId: 'etm0002',
        apiKey: 'dev_etm0002_key',
        busId: 'BUS002',
        status: 'active',
        lastSeen: new Date(),
      },
      {
        deviceId: 'etm0003',
        apiKey: 'dev_etm0003_key',
        busId: 'BUS003',
        status: 'active',
        lastSeen: new Date(),
      },
    ]);
    console.log(`   Created ${devices.length} devices`);

    console.log('📝 Creating routes (matching mobile app mock data)...');
    const routes = await Route.insertMany([
      {
        routeId: 'R19',
        name: 'Ludhiana - Jagraon - Moga',
        farePerKm: 2.5,
        status: 'active',
        stops: [
          { name: 'Ludhiana Bus Stand', lat: 30.9, lng: 75.85, sequence: 1 },
          { name: 'Civil Lines', lat: 30.905, lng: 75.855, sequence: 2 },
          { name: 'PAU', lat: 30.901, lng: 75.8573, sequence: 3 },
          { name: 'Doraha', lat: 30.92, lng: 75.88, sequence: 4 },
          { name: 'Jagraon', lat: 30.95, lng: 75.9, sequence: 5 },
          { name: 'Sidhwan Bet', lat: 30.98, lng: 75.92, sequence: 6 },
          { name: 'Baghapurana', lat: 31.0, lng: 75.94, sequence: 7 },
          { name: 'Moga', lat: 31.02, lng: 75.96, sequence: 8 },
        ],
      },
      {
        routeId: 'R20',
        name: 'Ludhiana - Khanna - Samrala',
        farePerKm: 2.5,
        status: 'active',
        stops: [
          { name: 'Ludhiana Bus Stand', lat: 30.9, lng: 75.85, sequence: 1 },
          { name: 'Model Town', lat: 30.89, lng: 75.84, sequence: 2 },
          { name: 'Samrala Chowk', lat: 30.88, lng: 75.83, sequence: 3 },
          { name: 'Khanna', lat: 30.86, lng: 75.81, sequence: 4 },
          { name: 'Machhiwara', lat: 30.84, lng: 75.79, sequence: 5 },
          { name: 'Raikot', lat: 30.82, lng: 75.77, sequence: 6 },
          { name: 'Samrala', lat: 30.8, lng: 75.75, sequence: 7 },
        ],
      },
      {
        routeId: 'R001',
        name: 'Chandigarh - Mohali Express',
        farePerKm: 2.5,
        status: 'active',
        stops: [
          { name: 'Chandigarh Bus Stand', lat: 30.7333, lng: 76.7794, sequence: 1 },
          { name: 'Sector 17', lat: 30.7419, lng: 76.7829, sequence: 2 },
          { name: 'Sector 22', lat: 30.7281, lng: 76.7758, sequence: 3 },
          { name: 'ISBT Sector 43', lat: 30.7102, lng: 76.7635, sequence: 4 },
          { name: 'Phase 1 Mohali', lat: 30.701, lng: 76.7193, sequence: 5 },
          { name: 'Phase 5 Mohali', lat: 30.7102, lng: 76.7024, sequence: 6 },
          { name: 'Mohali Bus Stand', lat: 30.7046, lng: 76.7179, sequence: 7 },
        ],
      },
    ]);
    console.log(`   Created ${routes.length} routes`);

    console.log('📝 Creating bus capacities...');
    const capacities = await BusCapacity.insertMany([
      { busId: 'BUS001', capacity: 50 },
      { busId: 'BUS002', capacity: 50 },
      { busId: 'BUS003', capacity: 45 },
    ]);
    console.log(`   Created ${capacities.length} bus capacities`);

    console.log('📝 Creating active trips...');
    const now = new Date();
    const trips = await Trip.insertMany([
      {
        tripId: 'TRIP001',
        deviceId: 'etm0001',
        busId: 'BUS001',
        routeId: 'R19',
        scheduledStartTime: new Date(now.getTime() - 60 * 60 * 1000),
        actualStartTime: new Date(now.getTime() - 55 * 60 * 1000),
        status: 'active',
        driverId: 'DRV001',
        conductorId: 'CND001',
      },
      {
        tripId: 'TRIP002',
        deviceId: 'etm0002',
        busId: 'BUS002',
        routeId: 'R19',
        scheduledStartTime: new Date(now.getTime() - 45 * 60 * 1000),
        actualStartTime: new Date(now.getTime() - 40 * 60 * 1000),
        status: 'active',
        driverId: 'DRV002',
        conductorId: 'CND002',
      },
      {
        tripId: 'TRIP003',
        deviceId: 'etm0003',
        busId: 'BUS003',
        routeId: 'R20',
        scheduledStartTime: new Date(now.getTime() - 30 * 60 * 1000),
        actualStartTime: new Date(now.getTime() - 25 * 60 * 1000),
        status: 'active',
        driverId: 'DRV003',
        conductorId: 'CND003',
      },
    ]);
    console.log(`   Created ${trips.length} active trips`);

    console.log('📝 Creating heartbeats (live bus positions)...');
    const heartbeats = await Heartbeat.insertMany([
      {
        deviceId: 'etm0001',
        busId: 'BUS001',
        routeId: 'R19',
        tripId: 'TRIP001',
        timestamp: new Date(),
        lat: 30.901,
        lng: 75.8573,
        speedKmph: 45,
        bearingDeg: 90,
        passengerCount: 18,
      },
      {
        deviceId: 'etm0002',
        busId: 'BUS002',
        routeId: 'R19',
        tripId: 'TRIP002',
        timestamp: new Date(),
        lat: 30.915,
        lng: 75.87,
        speedKmph: 52,
        bearingDeg: 85,
        passengerCount: 34,
      },
      {
        deviceId: 'etm0003',
        busId: 'BUS003',
        routeId: 'R20',
        tripId: 'TRIP003',
        timestamp: new Date(),
        lat: 30.89,
        lng: 75.84,
        speedKmph: 38,
        bearingDeg: 120,
        passengerCount: 38,
      },
    ]);
    console.log(`   Created ${heartbeats.length} heartbeat records`);

    console.log('📝 Creating demo app users...');
    const users = await AppUser.insertMany([
      {
        userId: 'USER_demo001',
        mobile: '9876543210',
        token: 'APP_user_3210_1234567890',
      },
      {
        userId: 'USER_demo002',
        mobile: '9999999999',
        token: 'APP_user_9999_1234567890',
      },
    ]);
    console.log(`   Created ${users.length} app users`);

    console.log('');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   Devices: ${devices.length}`);
    console.log(`   Routes: ${routes.length} (R19, R20, R001)`);
    console.log(`   Bus Capacities: ${capacities.length}`);
    console.log(`   Active Trips: ${trips.length}`);
    console.log(`   Heartbeats: ${heartbeats.length}`);
    console.log(`   App Users: ${users.length}`);
    console.log('');
    console.log('🔑 Device Keys:');
    devices.forEach((d) => {
      console.log(`   ${d.deviceId}: ${d.apiKey}`);
    });
    console.log('');
    console.log('🚌 Active Buses:');
    console.log('   BUS001 on R19 (Ludhiana - Jagraon - Moga)');
    console.log('   BUS002 on R19 (Ludhiana - Jagraon - Moga)');
    console.log('   BUS003 on R20 (Ludhiana - Khanna - Samrala)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();

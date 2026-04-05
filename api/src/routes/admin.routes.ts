import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateAdmin } from '../middleware/auth';
import {
  getAllRoutes,
  getRealtimeAnalytics,
  getRevenueAnalytics,
  getTicketAnalytics,
  getDeviceHealth,
  getFleetBuses,
  getFleetDrivers,
  getFleetConductors,
  getAllBookings,
  // New functions
  adminLogin,
  getBusTrackingData,
  getDemandAnalysis,
  createRoute,
  updateRoute,
  getFleetBusesEnhanced,
  createBus,
  updateBus,
  deleteBus,
  getFleetDriversEnhanced,
  createDriver,
  updateDriver,
  deleteDriver,
  getFleetConductorsEnhanced,
  createConductor,
  updateConductor,
  deleteConductor,
  bulkCreateRoutes,
} from '../services/admin.service';
import * as adminService from '../services/admin.service';
import { getAllLiveBuses } from '../services/app.service';
import { uploadToCloudinary, parseCSV, isValidCSV } from '../services/upload.service';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (isValidCSV(file)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * POST /auth/login - Admin login
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required',
      });
    }

    // Demo authentication - in production, verify against database
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@nextstop.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      res.json({
        success: true,
        token: process.env.ADMIN_DEMO_TOKEN || 'admin_demo_token_12345',
        user: {
          email: ADMIN_EMAIL,
          name: 'Admin User',
          role: 'admin',
        },
      });
    } else {
      res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Login failed' });
  }
});

/**
 * GET /routes - All routes
 */
router.get('/routes', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const routes = await getAllRoutes();
    console.log(routes, "routes")
    res.json({ routes, count: routes.length });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch routes' });
  }
});

/**
 * GET /analytics/realtime - Realtime analytics
 */
router.get('/analytics/realtime', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const analytics = await getRealtimeAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Get realtime analytics error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' });
  }
});

/**
 * GET /analytics/revenue - Revenue analytics
 */
router.get('/analytics/revenue', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;

    if (!date) {
      return res.status(400).json({
        code: 'MISSING_DATE',
        message: 'date query parameter is required (format: YYYY-MM-DD)',
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        code: 'INVALID_DATE_FORMAT',
        message: 'date must be in format YYYY-MM-DD',
      });
    }

    const analytics = await getRevenueAnalytics(date);
    res.json(analytics);
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch revenue analytics' });
  }
});

/**
 * GET /analytics/tickets - Ticket analytics
 */
router.get('/analytics/tickets', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const filters = {
      boarding_stop: req.query.boarding_stop as string,
      destination_stop: req.query.destination_stop as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    const analytics = await getTicketAnalytics(filters);
    res.json(analytics);
  } catch (error) {
    console.error('Get ticket analytics error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch ticket analytics' });
  }
});

/**
 * GET /analytics/route-performance - Route performance
 */
router.get('/analytics/route-performance', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const performanceData = await adminService.getRoutePerformance();
    res.json({
      routes: performanceData,
      count: performanceData.length,
    });
  } catch (error) {
    console.error('Get route performance error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch route performance' });
  }
});

/**
 * GET /device-health - Device health
 */
router.get('/device-health', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const devices = await getDeviceHealth();
    const onlineCount = devices.filter(d => !d.offline).length;
    const offlineCount = devices.filter(d => d.offline).length;

    res.json({
      devices,
      summary: {
        total: devices.length,
        online: onlineCount,
        offline: offlineCount,
      },
    });
  } catch (error) {
    console.error('Get device health error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch device health' });
  }
});

/**
 * GET /fleet/buses - All buses
 */
router.get('/fleet/buses', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const buses = await getFleetBuses();
    res.json(buses);
  } catch (error) {
    console.error('Get fleet buses error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch buses' });
  }
});

/**
 * GET /fleet/drivers - All drivers
 */
router.get('/fleet/drivers', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const drivers = await getFleetDrivers();
    res.json(drivers);
  } catch (error) {
    console.error('Get fleet drivers error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch drivers' });
  }
});

/**
 * GET /fleet/conductors - All conductors
 */
router.get('/fleet/conductors', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const conductors = await getFleetConductors();
    res.json(conductors);
  } catch (error) {
    console.error('Get fleet conductors error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch conductors' });
  }
});

/**
 * GET /buses/live - Live buses
 */
router.get('/buses/live', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const buses = await getAllLiveBuses();
    res.json({ buses, count: buses.length });
  } catch (error) {
    console.error('Get live buses error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch live buses' });
  }
});

/**
 * GET /bookings - All bookings (for gov portal)
 */
router.get('/bookings', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      date: req.query.date as string,
    };

    const bookings = await getAllBookings(filters);
    res.json({ bookings, count: bookings.length });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch bookings' });
  }
});

// ============ NEW ENDPOINTS ============

/**
 * POST /auth/login - Admin login
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        code: 'MISSING_CREDENTIALS',
        message: 'Email and password are required',
      });
    }

    const result = await adminLogin(email, password);

    if (result.success) {
      res.json({
        token: result.token,
        user: result.user,
      });
    } else {
      res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: result.error || 'Invalid email or password',
      });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Login failed' });
  }
});

/**
 * GET /bus/:bus_id/track - Get bus tracking details
 */
router.get('/bus/:bus_id/track', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { bus_id } = req.params;
    const trackingData = await getBusTrackingData(bus_id);

    if (!trackingData) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Bus not found or no tracking data available',
      });
    }

    res.json(trackingData);
  } catch (error) {
    console.error('Get bus tracking error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch tracking data' });
  }
});

/**
 * GET /analytics/demand - Get demand analysis for a route
 */
router.get('/analytics/demand', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const routeId = req.query.route_id as string;

    if (!routeId) {
      return res.status(400).json({
        code: 'MISSING_ROUTE_ID',
        message: 'route_id query parameter is required',
      });
    }

    const demandData = await getDemandAnalysis(routeId);

    if (!demandData) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Route not found',
      });
    }

    res.json(demandData);
  } catch (error) {
    console.error('Get demand analysis error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch demand data' });
  }
});

/**
 * POST /routes - Create a new route
 */
router.post('/routes', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { name, farePerKm, stops } = req.body;

    if (!name || !stops || !Array.isArray(stops)) {
      return res.status(400).json({
        code: 'INVALID_DATA',
        message: 'name and stops array are required',
      });
    }

    const route = await createRoute({ name, farePerKm, stops });
    res.status(201).json(route);
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create route' });
  }
});

/**
 * PUT /routes/:route_id - Update a route
 */
router.put('/routes/:route_id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { route_id } = req.params;
    const route = await updateRoute(route_id, req.body);

    if (!route) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Route not found',
      });
    }

    res.json(route);
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to update route' });
  }
});

// ============ BUS CRUD ============

/**
 * GET /fleet/buses/enhanced - Get all buses (uses new Bus model)
 */
router.get('/fleet/buses/enhanced', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const buses = await getFleetBusesEnhanced();
    res.json({ buses, count: buses.length });
  } catch (error) {
    console.error('Get fleet buses error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch buses' });
  }
});

/**
 * POST /fleet/buses - Create a new bus
 */
router.post('/fleet/buses', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { bus_id, type, capacity, status } = req.body;

    if (!bus_id || !capacity) {
      return res.status(400).json({
        code: 'INVALID_DATA',
        message: 'bus_id and capacity are required',
      });
    }

    const bus = await createBus({ bus_id, type: type || 'Ordinary', capacity, status });
    res.status(201).json(bus);
  } catch (error: any) {
    console.error('Create bus error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ code: 'DUPLICATE', message: 'Bus ID already exists' });
    }
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create bus' });
  }
});

/**
 * PUT /fleet/buses/:bus_id - Update a bus
 */
router.put('/fleet/buses/:bus_id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { bus_id } = req.params;
    const bus = await updateBus(bus_id, req.body);

    if (!bus) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Bus not found',
      });
    }

    res.json(bus);
  } catch (error) {
    console.error('Update bus error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to update bus' });
  }
});

/**
 * DELETE /fleet/buses/:bus_id - Delete a bus
 */
router.delete('/fleet/buses/:bus_id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { bus_id } = req.params;
    const deleted = await deleteBus(bus_id);

    if (!deleted) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Bus not found',
      });
    }

    res.json({ success: true, message: 'Bus deleted' });
  } catch (error) {
    console.error('Delete bus error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to delete bus' });
  }
});

/**
 * POST /fleet/buses/:bus_id/assign-crew - Assign driver/conductor
 */
router.post('/fleet/buses/:bus_id/assign-crew', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { bus_id } = req.params;
    const { driverId, conductorId } = req.body;
    
    await adminService.assignCrewToBus(bus_id, driverId, conductorId);
    res.json({ success: true, message: 'Crew assigned successfully' });
  } catch (error) {
    console.error('Assign crew error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to assign crew' });
  }
});

// ============ DRIVER CRUD ============

/**
 * GET /fleet/drivers/enhanced - Get all drivers (uses new Driver model)
 */
router.get('/fleet/drivers/enhanced', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const drivers = await getFleetDriversEnhanced();
    res.json({ drivers, count: drivers.length });
  } catch (error) {
    console.error('Get fleet drivers error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch drivers' });
  }
});

/**
 * POST /fleet/drivers - Create a new driver
 */
router.post('/fleet/drivers', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { name, phone, license_no } = req.body;

    if (!name || !phone || !license_no) {
      return res.status(400).json({
        code: 'INVALID_DATA',
        message: 'name, phone, and license_no are required',
      });
    }

    const driver = await createDriver({ name, phone, license_no });
    res.status(201).json(driver);
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create driver' });
  }
});

/**
 * PUT /fleet/drivers/:driver_id - Update a driver
 */
router.put('/fleet/drivers/:driver_id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { driver_id } = req.params;
    const driver = await updateDriver(driver_id, req.body);

    if (!driver) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Driver not found',
      });
    }

    res.json(driver);
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to update driver' });
  }
});

/**
 * DELETE /fleet/drivers/:driver_id - Delete a driver
 */
router.delete('/fleet/drivers/:driver_id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { driver_id } = req.params;
    const deleted = await deleteDriver(driver_id);

    if (!deleted) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Driver not found',
      });
    }

    res.json({ success: true, message: 'Driver deleted' });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to delete driver' });
  }
});

// ============ CONDUCTOR CRUD ============

/**
 * GET /fleet/conductors/enhanced - Get all conductors (uses new Conductor model)
 */
router.get('/fleet/conductors/enhanced', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const conductors = await getFleetConductorsEnhanced();
    res.json({ conductors, count: conductors.length });
  } catch (error) {
    console.error('Get fleet conductors error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch conductors' });
  }
});

/**
 * POST /fleet/conductors - Create a new conductor
 */
router.post('/fleet/conductors', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { name, phone, license_no } = req.body;

    if (!name || !phone || !license_no) {
      return res.status(400).json({
        code: 'INVALID_DATA',
        message: 'name, phone, and license_no are required',
      });
    }

    const conductor = await createConductor({ name, phone, license_no });
    res.status(201).json(conductor);
  } catch (error) {
    console.error('Create conductor error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create conductor' });
  }
});

/**
 * PUT /fleet/conductors/:conductor_id - Update a conductor
 */
router.put('/fleet/conductors/:conductor_id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { conductor_id } = req.params;
    const conductor = await updateConductor(conductor_id, req.body);

    if (!conductor) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Conductor not found',
      });
    }

    res.json(conductor);
  } catch (error) {
    console.error('Update conductor error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to update conductor' });
  }
});

/**
 * DELETE /fleet/conductors/:conductor_id - Delete a conductor
 */
router.delete('/fleet/conductors/:conductor_id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { conductor_id } = req.params;
    const deleted = await deleteConductor(conductor_id);

    if (!deleted) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Conductor not found',
      });
    }

    res.json({ success: true, message: 'Conductor deleted' });
  } catch (error) {
    console.error('Delete conductor error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to delete conductor' });
  }
});
// Delete route
router.delete('/routes/:route_id', async (req, res) => {
  try {
    const success = await adminService.deleteRoute(req.params.route_id);
    if (!success) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json({ message: 'Route deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/routes/:route_id/schedule', async (req, res) => {
  try {
    const schedule = await adminService.getRouteSchedule(req.params.route_id);
    res.json(schedule);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /routes/bulk-upload - Bulk upload routes from CSV
 * CSV format: routeId,name,farePerKm,status,stops (stops is optional JSON array)
 */
router.post(
  '/routes/bulk-upload',
  authenticateAdmin,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          code: 'NO_FILE',
          message: 'No CSV file was uploaded',
        });
      }

      // Upload to Cloudinary for record keeping (optional - skip if not configured)
      let cloudinaryUrl = null;
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
        try {
          const cloudinaryResult = await uploadToCloudinary(
            file.buffer,
            file.originalname,
            'routes-uploads'
          );
          cloudinaryUrl = cloudinaryResult.url;
        } catch (error) {
          console.warn('Cloudinary upload skipped:', error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Parse CSV
      const parsedData = await parseCSV(file.buffer);

      if (parsedData.length === 0) {
        return res.status(400).json({
          code: 'EMPTY_CSV',
          message: 'CSV file is empty or has no valid data',
        });
      }

      // Detect CSV format and transform accordingly
      // Format 1: One row per route (routeId, name, farePerKm, status, stops)
      // Format 2: One row per stop (routeId, routeName, stopOrder, stopName, latitude, longitude)

      let routesData: Array<{
        routeId: string;
        name: string;
        farePerKm: number;
        status: string;
        stops: Array<{ name: string; lat: number; lng: number; sequence: number }>;
      }> = [];

      // Check if it's Format 2 (has stopOrder/stopName columns)
      const isStopPerRowFormat = parsedData[0] &&
        (parsedData[0].stopOrder || parsedData[0].stopName || parsedData[0].latitude);

      if (isStopPerRowFormat) {
        // Group rows by routeId
        const routeMap = new Map<string, typeof routesData[0]>();

        for (const row of parsedData) {
          const routeId = String(row.routeId || row.route_id);
          const routeName = row.routeName || row.name || row.route_name;

          if (!routeId || !routeName) continue;

          if (!routeMap.has(routeId)) {
            routeMap.set(routeId, {
              routeId,
              name: routeName,
              farePerKm: parseFloat(row.farePerKm || row.fare_per_km) || 2.0,
              status: row.status || 'active',
              stops: [],
            });
          }

          const route = routeMap.get(routeId)!;

          // Add stop to route
          const stopName = row.stopName || row.stop_name;
          const lat = parseFloat(row.latitude || row.lat);
          const lng = parseFloat(row.longitude || row.lng);
          const sequence = parseInt(row.stopOrder || row.stop_order || row.sequence) || route.stops.length + 1;

          if (stopName && !isNaN(lat) && !isNaN(lng)) {
            route.stops.push({ name: stopName, lat, lng, sequence });
          }
        }

        // Sort stops by sequence and convert map to array
        routesData = Array.from(routeMap.values()).map(route => ({
          ...route,
          stops: route.stops.sort((a, b) => a.sequence - b.sequence),
        }));
      } else {
        // Format 1: Standard one row per route
        routesData = parsedData.map((row) => {
          let stops: Array<{ name: string; lat: number; lng: number; sequence: number }> = [];
          if (row.stops) {
            try {
              stops = JSON.parse(row.stops);
            } catch {
              // If stops is not valid JSON, ignore it
            }
          }

          return {
            routeId: row.routeId || row.route_id,
            name: row.name,
            farePerKm: parseFloat(row.farePerKm || row.fare_per_km) || 2.0,
            status: row.status || 'active',
            stops,
          };
        });
      }

      // Filter out invalid routes (missing routeId or name)
      const validRoutes = routesData.filter((r) => r.routeId && r.name);

      if (validRoutes.length === 0) {
        return res.status(400).json({
          code: 'INVALID_DATA',
          message: 'No valid route data found. Ensure routeId and name columns exist.',
        });
      }

      // Bulk create with batching
      const batchSize = parseInt(req.query.batchSize as string) || 100;
      const result = await bulkCreateRoutes(validRoutes, batchSize);

      res.json({
        message: 'Bulk upload completed',
        cloudinaryUrl,
        totalRows: parsedData.length,
        validRows: validRoutes.length,
        ...result,
      });
    } catch (error) {
      console.error('Bulk upload error:', error);
      res.status(500).json({
        code: 'BULK_UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to process bulk upload',
      });
    }
  }
);

export default router;


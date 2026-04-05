// Admin Portal API Client
// Centralized API functions for communicating with new-gov-api

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const ADMIN_API = `${API_BASE_URL}/admin/v1`;

/**
 * Get the auth token from localStorage
 */
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${ADMIN_API}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

// ============ AUTH ============

export async function login(email, password) {
  const response = await fetch(`${ADMIN_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

// ============ ANALYTICS ============

export async function getRealtimeAnalytics() {
  return apiRequest("/analytics/realtime");
}

export async function getTicketAnalytics(filters = {}) {
  const params = new URLSearchParams();
  if (filters.boarding_stop) params.append("boarding_stop", filters.boarding_stop);
  if (filters.destination_stop) params.append("destination_stop", filters.destination_stop);
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  
  const query = params.toString();
  return apiRequest(`/analytics/tickets${query ? `?${query}` : ""}`);
}

export async function getRoutePerformance() {
  return apiRequest("/analytics/route-performance");
}

export async function getRevenueAnalytics(date) {
  return apiRequest(`/analytics/revenue?date=${date}`);
}

export async function getDemandAnalysis(routeId) {
  return apiRequest(`/analytics/demand?route_id=${routeId}`);
}

// ============ ROUTES ============

export async function getAllRoutes() {
  return apiRequest("/routes");
}

export async function createRoute(routeData) {
  return apiRequest("/routes", {
    method: "POST",
    body: JSON.stringify(routeData),
  });
}

export async function updateRoute(routeId, routeData) {
  return apiRequest(`/routes/${routeId}`, {
    method: "PUT",
    body: JSON.stringify(routeData),
  });
}

export async function deleteRoute(routeId) {
  return apiRequest(`/routes/${routeId}`, {
    method: "DELETE",
  });
}

export async function getRouteSchedule(routeId) {
  return apiRequest(`/routes/${routeId}/schedule`);
}

export async function bulkUploadRoutes(formData) {
  const token = getToken();
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${ADMIN_API}/routes/bulk-upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Upload failed");
  }

  return data;
}

// ============ LIVE BUSES ============

export async function getLiveBuses() {
  return apiRequest("/buses/live");
}

export async function getBusTracking(busId) {
  return apiRequest(`/bus/${busId}/track`);
}

// ============ FLEET - BUSES ============

export async function getFleetBuses() {
  // Try enhanced endpoint first, fallback to regular
  try {
    const result = await apiRequest("/fleet/buses/enhanced");
    return result.buses || result;
  } catch {
    const result = await apiRequest("/fleet/buses");
    return result;
  }
}

export async function createBus(busData) {
  return apiRequest("/fleet/buses", {
    method: "POST",
    body: JSON.stringify(busData),
  });
}

export async function updateBus(busId, busData) {
  return apiRequest(`/fleet/buses/${busId}`, {
    method: "PUT",
    body: JSON.stringify(busData),
  });
}

export async function deleteBus(busId) {
  return apiRequest(`/fleet/buses/${busId}`, {
    method: "DELETE",
  });
}

export async function assignCrew(busId, driverId, conductorId) {
  return apiRequest(`/fleet/buses/${busId}/assign-crew`, {
    method: "POST",
    body: JSON.stringify({ driverId, conductorId }),
  });
}

// ============ FLEET - DRIVERS ============

export async function getFleetDrivers() {
  // Try enhanced endpoint first, fallback to regular
  try {
    const result = await apiRequest("/fleet/drivers/enhanced");
    return result.drivers || result;
  } catch {
    const result = await apiRequest("/fleet/drivers");
    return result;
  }
}

export async function createDriver(driverData) {
  return apiRequest("/fleet/drivers", {
    method: "POST",
    body: JSON.stringify(driverData),
  });
}

export async function updateDriver(driverId, driverData) {
  return apiRequest(`/fleet/drivers/${driverId}`, {
    method: "PUT",
    body: JSON.stringify(driverData),
  });
}

export async function deleteDriver(driverId) {
  return apiRequest(`/fleet/drivers/${driverId}`, {
    method: "DELETE",
  });
}

// ============ FLEET - CONDUCTORS ============

export async function getFleetConductors() {
  // Try enhanced endpoint first, fallback to regular
  try {
    const result = await apiRequest("/fleet/conductors/enhanced");
    return result.conductors || result;
  } catch {
    const result = await apiRequest("/fleet/conductors");
    return result;
  }
}

export async function createConductor(conductorData) {
  return apiRequest("/fleet/conductors", {
    method: "POST",
    body: JSON.stringify(conductorData),
  });
}

export async function updateConductor(conductorId, conductorData) {
  return apiRequest(`/fleet/conductors/${conductorId}`, {
    method: "PUT",
    body: JSON.stringify(conductorData),
  });
}

export async function deleteConductor(conductorId) {
  return apiRequest(`/fleet/conductors/${conductorId}`, {
    method: "DELETE",
  });
}

// ============ DEVICE HEALTH ============

export async function getDeviceHealth() {
  return apiRequest("/device-health");
}

// ============ BOOKINGS ============

export async function getAllBookings(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.date) params.append("date", filters.date);
  
  const query = params.toString();
  return apiRequest(`/bookings${query ? `?${query}` : ""}`);
}

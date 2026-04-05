"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Route,
  Clock,
  MapPin,
  Plus,
  Edit,
  TrendingUp,
  Filter,
  Upload,
  FileText,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Table,
  RefreshCw,
} from "lucide-react";
import { getAllRoutes, createRoute as createRouteApi, bulkUploadRoutes, deleteRoute, updateRoute, getRouteSchedule, getDemandAnalysis } from "@/lib/api";
import { toast } from "sonner";
import { StopsBuilder } from "@/components/StopsBuilder";

export default function RouteManagementPage() {
  const router = useRouter();
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [openBulkUpload, setOpenBulkUpload] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Routes Data tab state
  const [dbRoutes, setDbRoutes] = useState([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [expandedRoutes, setExpandedRoutes] = useState(new Set());
  
  // Schedule & Optimization state
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [optimizationData, setOptimizationData] = useState(null);
  const [isLoadingOptimization, setIsLoadingOptimization] = useState(false);

  const [newRoute, setNewRoute] = useState({
    name: "",
    startPoint: "",
    endPoint: "",
    distance: "",
    avgDuration: "",
    dailyPassengers: "",
    peakOccupancy: "",
    status: "optimal",
  });
  const [routeStops, setRouteStops] = useState([]);

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllRoutes();
      setRoutes(data.routes || []);
    } catch (err) {
      console.error("Failed to fetch routes:", err);
      toast.error("Failed to load routes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSchedule = useCallback(async (routeId) => {
    if (!routeId) return;
    setIsLoadingSchedule(true);
    try {
      const data = await getRouteSchedule(routeId);
      setScheduleData(data || []);
    } catch (err) {
      console.error("Failed to fetch schedule:", err);
      // toast.error("Failed to load schedule");
    } finally {
      setIsLoadingSchedule(false);
    }
  }, []);

  const fetchOptimization = useCallback(async (routeId) => {
    if (!routeId) return;
    setIsLoadingOptimization(true);
    try {
      const data = await getDemandAnalysis(routeId);
      setOptimizationData(data);
    } catch (err) {
      console.error("Failed to fetch optimization:", err);
    } finally {
      setIsLoadingOptimization(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  useEffect(() => {
    if (selectedRoute) {
      fetchSchedule(selectedRoute);
      fetchOptimization(selectedRoute);
    } else {
      setScheduleData([]);
      setOptimizationData(null);
    }
  }, [selectedRoute, fetchSchedule, fetchOptimization]);

  const routesList = routes.map((route) => ({
    id: route.route_id,
    name: route.name,
    startPoint: route.stops?.[0]?.name || route.start_point || "-",
    endPoint: route.stops?.[route.stops?.length - 1]?.name || route.end_point || "-",
    stopsList: route.stops || [],
    stops: route.stops?.map((s) => s.name).join(", ") || "-",
    distance: route.distance_km || "-",
    avgDuration: route.avg_duration || "-",
    dailyPassengers: route.daily_passengers || 0,
    peakOccupancy: route.peak_occupancy || 50,
    status:
      (route.peak_occupancy || 50) > 150
        ? "overcrowded"
        : (route.peak_occupancy || 50) > 100
        ? "good"
        : "optimal",
    lastUpdated: new Date().toLocaleDateString(),
  }));

  const filteredRoutes = routesList.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "optimal":
        return "default";
      case "good":
        return "secondary";
      case "overcrowded":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleEditRoute = (route) => {
    setNewRoute({
      name: route.name,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      distance: route.distance,
      avgDuration: route.avgDuration,
      dailyPassengers: route.dailyPassengers,
      peakOccupancy: route.peakOccupancy,
      status: route.status === "active" ? "optimal" : route.status, // Map generic status if needed
    });
    
    // Map existing stops to builder format
    const existingStops = route.stopsList.map(stop => ({
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      id: Math.random().toString(36).substr(2, 9) // temporary ID for frontend key
    }));
    setRouteStops(existingStops);
    
    setIsEditMode(true);
    setOpenAdd(true);
  };

  const handleSaveRoute = async () => {
    setIsSubmitting(true);
    try {
      const routeData = {
        name: newRoute.name || `${newRoute.startPoint} - ${newRoute.endPoint}`,
        farePerKm: 2.5,
        stops: routeStops.map((stop, idx) => ({
          name: stop.name,
          lat: stop.lat || 0,
          lng: stop.lng || 0,
          sequence: idx + 1,
        })),
        distance_km: parseFloat(newRoute.distance) || 0,
        avg_duration: newRoute.avgDuration,
        status: "active" // simplify status for now
      };

      if (isEditMode) {
        await updateRoute(selectedRoute, routeData);
        toast.success("Route updated successfully");
      } else {
        await createRouteApi(routeData);
        toast.success("Route created successfully");
      }
      
      setOpenAdd(false);
      setIsEditMode(false);
      setNewRoute({
        name: "",
        startPoint: "",
        endPoint: "",
        distance: "",
        avgDuration: "",
        dailyPassengers: "",
        peakOccupancy: "",
        status: "optimal",
      });
      setRouteStops([]);
      fetchRoutes();
    } catch (error) {
      toast.error(isEditMode ? "Failed to update route" : "Failed to create route", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a CSV file");
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const data = await bulkUploadRoutes(formData);

      setUploadResult(data);
      toast.success(
        `Bulk upload complete: ${data.created} created, ${data.updated} updated`
      );
    } catch (error) {
      toast.error(error.message || "Failed to upload routes");
      setUploadResult({ error: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      setUploadFile(file);
      setUploadResult(null);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `routeId,name,farePerKm,status,stops
RT001,"Jalandhar → Amritsar Express",2.5,active,"[{\"name\":\"Jalandhar Bus Stand\",\"lat\":31.3260,\"lng\":75.5762,\"sequence\":1},{\"name\":\"Phagwara\",\"lat\":31.2240,\"lng\":75.7708,\"sequence\":2},{\"name\":\"Amritsar Bus Stand\",\"lat\":31.6340,\"lng\":74.8723,\"sequence\":3}]"
RT002,"Ludhiana → Chandigarh Local",2.0,active,""`;
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_routes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Route Management</h1>
          <p className="text-muted-foreground">
            Manage bus routes and optimize the network
          </p>
        </div>

        <div className="flex gap-2">
          {/* FILTER DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {statusFilter && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel>Status Filter</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["optimal", "good", "overcrowded"].map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilter === s}
                  onCheckedChange={() =>
                    setStatusFilter(statusFilter === s ? null : s)
                  }
                >
                  {s}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setStatusFilter(null)}
              >
                Clear Filter
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* BULK UPLOAD DIALOG */}
          <Dialog open={openBulkUpload} onOpenChange={(open) => {
            setOpenBulkUpload(open);
            if (!open) {
              setUploadFile(null);
              setUploadResult(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Bulk Upload Routes</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* File Input */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer text-primary hover:underline"
                  >
                    {uploadFile ? uploadFile.name : "Click to select CSV file"}
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    CSV format: routeId, name, farePerKm, status, stops
                  </p>
                </div>

                {/* Download Sample */}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={downloadSampleCSV}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download sample CSV
                </Button>

                {/* Upload Result */}
                {uploadResult && (
                  <div className={`p-4 rounded-lg ${
                    uploadResult.error
                      ? "bg-destructive/10 text-destructive"
                      : "bg-green-500/10 text-green-600"
                  }`}>
                    {uploadResult.error ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <span>{uploadResult.error}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Upload Successful!</span>
                        </div>
                        <div className="text-sm ml-7">
                          <p>Created: {uploadResult.created}</p>
                          <p>Updated: {uploadResult.updated}</p>
                          {uploadResult.failed > 0 && (
                            <p className="text-destructive">Failed: {uploadResult.failed}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setOpenBulkUpload(false)}>
                  Close
                </Button>
                <Button
                  onClick={handleBulkUpload}
                  disabled={!uploadFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ADD ROUTE DIALOG */}
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setIsEditMode(false);
                setNewRoute({
                  name: "",
                  startPoint: "",
                  endPoint: "",
                  distance: "",
                  avgDuration: "",
                  dailyPassengers: "",
                  peakOccupancy: "",
                  status: "optimal",
                });
                setRouteStops([]);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Bus Route" : "Add New Bus Route"}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Route Name *</label>
                  <Input
                    placeholder="e.g., Jalandhar → Amritsar Express"
                    value={newRoute.name}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Start Point *</label>
                  <Input
                    placeholder="e.g., Jalandhar"
                    value={newRoute.startPoint}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, startPoint: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">End Point *</label>
                  <Input
                    placeholder="e.g., Amritsar"
                    value={newRoute.endPoint}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, endPoint: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Route Stops *</label>
                  <StopsBuilder stops={routeStops} onChange={setRouteStops} />
                </div>

                <div>
                  <label className="text-sm font-medium">Distance (km) *</label>
                  <Input
                    type="number"
                    placeholder="e.g., 74"
                    value={newRoute.distance}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, distance: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Avg Duration *</label>
                  <Input
                    placeholder="e.g., 1h 45m"
                    value={newRoute.avgDuration}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, avgDuration: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Daily Passengers *
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 2400"
                    value={newRoute.dailyPassengers}
                    onChange={(e) =>
                      setNewRoute({
                        ...newRoute,
                        dailyPassengers: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Peak Occupancy (%) *
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 145"
                    value={newRoute.peakOccupancy}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, peakOccupancy: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={newRoute.status}
                    onValueChange={(v) =>
                      setNewRoute({ ...newRoute, status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="optimal">Optimal</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="overcrowded">Overcrowded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setOpenAdd(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRoute}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditMode ? "Update Route" : "Save Route")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="routes-data">Routes Data</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ROUTE LIST */}
            <div className="lg:col-span-2 space-y-4">
              {filteredRoutes.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">No Routes Found</h3>
                    <p className="text-muted-foreground text-sm mt-2">
                      {routesList.length === 0
                        ? "Start by adding your first route"
                        : "No routes match your filters"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredRoutes.map((route) => (
                  <Card
                    key={route.id}
                    className={`cursor-pointer transition-all ${
                      selectedRoute === route.id
                        ? "border-primary shadow-md"
                        : "hover:shadow-sm"
                    }`}
                    onClick={() =>
                      setSelectedRoute(
                        selectedRoute === route.id ? null : route.id
                      )
                    }
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{route.name}</CardTitle>
                          <div className="text-sm text-muted-foreground mt-2 space-x-4">
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {route.startPoint} → {route.endPoint}
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Route className="w-4 h-4" />
                              <span>{route.distance} km</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{route.avgDuration}</span>
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Stops: {route.stops}
                          </div>
                        </div>
                        <Badge variant={getStatusColor(route.status)}>
                          {route.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Daily Passengers
                          </div>
                          <div className="text-lg font-semibold">
                            {route.dailyPassengers}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Peak Occupancy
                          </div>
                          <div className="text-lg font-semibold">
                            {route.peakOccupancy}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Last Updated
                          </div>
                          <div className="text-lg font-medium">
                            {route.lastUpdated}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    {selectedRoute === route.id && (
                      <CardContent className="pt-0">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditRoute(route)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit Route
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => router.push(`/analytics?route_id=${route.id}`)}>
                            <TrendingUp className="w-4 h-4 mr-1" />
                            View Analytics
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this route?')) {
                                try {
                                  await deleteRoute(route.id);
                                  toast.success('Route deleted');
                                  fetchRoutes();
                                  setSelectedRoute(null);
                                } catch (err) {
                                  toast.error('Failed to delete route');
                                }
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>

            {/* QUICK STATS */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Route Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Routes</span>
                    <span className="font-semibold">{filteredRoutes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Daily Passengers
                    </span>
                    <span className="font-semibold">
                      {filteredRoutes.reduce(
                        (sum, r) => sum + r.dailyPassengers,
                        0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Average Peak Occupancy
                    </span>
                    <span className="font-semibold">
                      {filteredRoutes.length > 0
                        ? Math.round(
                            filteredRoutes.reduce(
                              (sum, r) => sum + r.peakOccupancy,
                              0
                            ) / filteredRoutes.length
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* SCHEDULE TAB */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Trip Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedRoute ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a route to view its schedule</p>
                </div>
              ) : isLoadingSchedule ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : scheduleData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trips scheduled for this route</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Trip ID</th>
                        <th className="text-left py-3 px-2 font-medium">Start Time</th>
                        <th className="text-left py-3 px-2 font-medium">Status</th>
                        <th className="text-left py-3 px-2 font-medium">Bus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleData.map((trip) => (
                        <tr key={trip.trip_id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 font-mono text-xs">{trip.trip_id}</td>
                          <td className="py-3 px-2">
                            {new Date(trip.start_time).toLocaleString()}
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={trip.status === "active" ? "default" : "secondary"}>
                              {trip.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">{trip.bus_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* OPTIMIZATION TAB */}
        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle>Route Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedRoute ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a route to view optimization insights</p>
                </div>
              ) : isLoadingOptimization ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !optimizationData ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No enough data to generate recommendations yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-blue-50/50">
                      <div className="text-sm font-medium text-blue-900">Current Efficiency</div>
                      <div className="text-2xl font-bold text-blue-700 mt-1">
                        {Math.round(optimizationData.data.reduce((acc, curr) => acc + (curr.passengers / (curr.capacity * curr.requiredBuses)), 0) / optimizationData.data.length * 100)}%
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-green-50/50">
                      <div className="text-sm font-medium text-green-900">Peak Hours</div>
                      <div className="text-lg font-semibold text-green-700 mt-1">
                        {optimizationData.data
                          .filter(d => d.requiredBuses > 1)
                          .map(d => d.time.split(':')[0])
                          .slice(0, 3)
                          .join(", ") || "None"}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-amber-50/50">
                      <div className="text-sm font-medium text-amber-900">Potential Savings</div>
                      <div className="text-2xl font-bold text-amber-700 mt-1">
                        ₹{optimizationData.data.filter(d => d.passengers < 10).length * 500}/day
                      </div>
                    </div>
                  </div>

                  {/* Recommendations List */}
                  <div>
                    <h3 className="font-medium mb-3">AI Recommendations</h3>
                    <div className="space-y-3">
                      {optimizationData.data.some(d => d.requiredBuses > 1) && (
                        <div className="flex items-start gap-3 p-3 rounded-md bg-red-50 border border-red-100">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-red-900">Increase Frequency during Peak Hours</div>
                            <p className="text-sm text-red-700">
                              High demand detected at {optimizationData.data.filter(d => d.requiredBuses > 1).map(d => d.time).join(", ")}. 
                              deployed {Math.max(...optimizationData.data.map(d => d.requiredBuses)) - 1} extra buses to match demand.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {optimizationData.data.some(d => d.passengers < 15) && (
                        <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50 border border-amber-100">
                          <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-amber-900">Reduce Frequency during Off-Peak</div>
                            <p className="text-sm text-amber-700">
                              Low occupancy detected at {optimizationData.data.filter(d => d.passengers < 15).map(d => d.time).slice(0, 5).join(", ")}. 
                              Consider merging trips to save operational costs.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3 p-3 rounded-md bg-blue-50 border border-blue-100">
                        <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-blue-900">Dynamic Pricing Opportunity</div>
                          <p className="text-sm text-blue-700">
                            Demand pattern suggests potential for dynamic pricing. 
                            Increasing fare by 10% during 08:00-10:00 could revenue without affecting ridership.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROUTES DATA TAB */}
        <TabsContent value="routes-data">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Routes from Database</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsLoadingRoutes(true);
                      try {
                        const data = await getAllRoutes();
                        setDbRoutes(data.routes || []);
                        toast.success(`Loaded ${data.routes?.length || 0} routes`);
                      } catch (error) {
                        toast.error("Failed to fetch routes");
                      } finally {
                        setIsLoadingRoutes(false);
                      }
                    }}
                    disabled={isLoadingRoutes}
                  >
                    {isLoadingRoutes ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (dbRoutes.length === 0) {
                        toast.error("No routes to export");
                        return;
                      }
                      // Generate CSV
                      const headers = "routeId,routeName,farePerKm,status,stopOrder,stopName,latitude,longitude";
                      const rows = [];
                      for (const route of dbRoutes) {
                        if (route.stops && route.stops.length > 0) {
                          for (const stop of route.stops) {
                            rows.push(
                              `${route.route_id},"${route.name}",${route.fare_per_km},${route.status},${stop.sequence},"${stop.name}",${stop.lat},${stop.lng}`
                            );
                          }
                        } else {
                          rows.push(
                            `${route.route_id},"${route.name}",${route.fare_per_km},${route.status},,,`
                          );
                        }
                      }
                      const csv = headers + "\n" + rows.join("\n");
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `routes_export_${new Date().toISOString().split("T")[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("CSV exported successfully");
                    }}
                    disabled={dbRoutes.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dbRoutes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold text-lg mb-2">No Routes Loaded</h3>
                  <p className="text-sm">Click "Refresh" to load routes from the database</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Route ID</th>
                        <th className="text-left py-3 px-2 font-medium">Name</th>
                        <th className="text-left py-3 px-2 font-medium">Fare/km</th>
                        <th className="text-left py-3 px-2 font-medium">Status</th>
                        <th className="text-left py-3 px-2 font-medium">Stops</th>
                        <th className="text-left py-3 px-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbRoutes.map((route) => (
                        <Fragment key={route.route_id}>
                          <tr className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2 font-mono text-xs">{route.route_id}</td>
                            <td className="py-3 px-2">{route.name}</td>
                            <td className="py-3 px-2">₹{route.fare_per_km}</td>
                            <td className="py-3 px-2">
                              <Badge variant={route.status === "active" ? "default" : "secondary"}>
                                {route.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">{route.stops?.length || 0} stops</td>
                            <td className="py-3 px-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newExpanded = new Set(expandedRoutes);
                                  if (newExpanded.has(route.route_id)) {
                                    newExpanded.delete(route.route_id);
                                  } else {
                                    newExpanded.add(route.route_id);
                                  }
                                  setExpandedRoutes(newExpanded);
                                }}
                              >
                                {expandedRoutes.has(route.route_id) ? "Hide Stops" : "View Stops"}
                              </Button>
                            </td>
                          </tr>
                          {expandedRoutes.has(route.route_id) && route.stops?.length > 0 && (
                            <tr key={`${route.route_id}-stops`}>
                              <td colSpan={6} className="bg-muted/30 p-4">
                                <div className="text-xs font-medium mb-2">Stops:</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {route.stops.map((stop, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 bg-background rounded px-2 py-1"
                                    >
                                      <span className="text-xs font-mono bg-primary/10 px-1.5 py-0.5 rounded">
                                        {stop.sequence}
                                      </span>
                                      <span className="text-sm">{stop.name}</span>
                                      <span className="text-xs text-muted-foreground ml-auto">
                                        {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Total: {dbRoutes.length} routes
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

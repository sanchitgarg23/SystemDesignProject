"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Filter,
  Users,
  Clock,
  Zap,
  Bus,
  MapPin,
} from "lucide-react";
import { getLiveBuses, getBusTracking } from "@/lib/api";

export default function LiveTrackingPage() {
  const searchParams = useSearchParams();
  const routeIdParam = searchParams.get("route_id");

  const [selectedBus, setSelectedBus] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveBuses, setLiveBuses] = useState([]);
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

  useEffect(() => {
    const fetchBuses = async () => {
      setIsLoading(true);
      try {
        const data = await getLiveBuses();
        setLiveBuses(data.buses || []);
      } catch (err) {
        console.error("Failed to fetch buses:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBuses();
    const interval = setInterval(fetchBuses, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!selectedBus) {
        setTrackingData(null);
        return;
      }
      setIsLoadingTracking(true);
      try {
        const data = await getBusTracking(selectedBus);
        setTrackingData(data);
      } catch (err) {
        console.error("Failed to fetch tracking:", err);
        setTrackingData(null);
      } finally {
        setIsLoadingTracking(false);
      }
    };
    fetchTracking();
  }, [selectedBus]);

  // Group buses by route
  const busesByRoute = useMemo(() => {
    const grouped = {};
    liveBuses.forEach((bus) => {
      const routeName = bus.route_name || bus.route_id || "Unknown Route";
      if (!grouped[routeName]) {
        grouped[routeName] = [];
      }
      grouped[routeName].push(bus);
    });
    return grouped;
  }, [liveBuses]);

  const getOccupancyColor = (loadPct) => {
    if (loadPct < 70) return "success";
    if (loadPct < 90) return "warning";
    return "destructive";
  };

  const filteredRoutes = useMemo(() => {
    return Object.entries(busesByRoute).filter(
      ([routeName, buses]) => {
        // Deep link filtering by route_id from URL params
        if (routeIdParam) {
          // Find if any bus belongs to this route
          const belongsToRoute = buses.some(b => b.route_id === routeIdParam);
          if (!belongsToRoute) return false;
        }

        const matchesSearch =
          routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          buses.some((bus) =>
            bus.bus_id.toLowerCase().includes(searchQuery.toLowerCase())
          );
        return matchesSearch;
      }
    );
  }, [busesByRoute, searchQuery, routeIdParam]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Live Bus Tracking
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of active routes and buses
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search buses, routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linear Route View */}
        <div className="lg:col-span-2 space-y-6">
          {filteredRoutes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active routes found matching your search.</p>
              </CardContent>
            </Card>
          ) : (
            filteredRoutes.map(([routeName, buses]) => (
              <Card key={routeName} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bus className="h-5 w-5 text-primary" />
                      {routeName}
                    </CardTitle>
                    <Badge variant="outline">{buses.length} Active Buses</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Linear Visualization */}
                  <div className="relative py-8 px-4">
                    {/* Route Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted-foreground/20 -translate-y-1/2 rounded-full"></div>

                    {/* Start/End Points */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
                      <span className="text-xs text-muted-foreground mt-2 whitespace-nowrap">
                        Start
                      </span>
                    </div>
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
                      <span className="text-xs text-muted-foreground mt-2 whitespace-nowrap">
                        End
                      </span>
                    </div>

                    {/* Buses on the line */}
                    {buses.map((bus, idx) => {
                      const position =
                        10 +
                        (parseInt(bus.bus_id.replace(/\D/g, "")) % 80);

                      return (
                        <div
                          key={bus.bus_id}
                          className="absolute top-1/2 -translate-y-1/2 transform transition-all duration-500 hover:z-10"
                          style={{ left: `${position}%` }}
                        >
                          <div
                            className={`cursor-pointer flex flex-col items-center group ${
                              selectedBus === bus.bus_id
                                ? "scale-110 z-20"
                                : "hover:scale-110"
                            }`}
                            onClick={() =>
                              setSelectedBus(
                                selectedBus === bus.bus_id ? null : bus.bus_id
                              )
                            }
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white ${
                                getOccupancyColor(bus.passenger_load_pct) ===
                                "success"
                                  ? "bg-green-500"
                                  : getOccupancyColor(bus.passenger_load_pct) ===
                                    "warning"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                            >
                              <Bus className="h-4 w-4 text-white" />
                            </div>

                            {/* Tooltip-like info */}
                            <div
                              className={`absolute bottom-full mb-2 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg border whitespace-nowrap ${
                                selectedBus === bus.bus_id
                                  ? "block"
                                  : "hidden group-hover:block"
                              }`}
                            >
                              <div className="font-bold">{bus.bus_id}</div>
                              <div>Load: {Math.round(bus.passenger_load_pct)}%</div>
                              <div>Speed: {bus.speed_kmph} km/h</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* List of buses on this route */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {buses.map((bus) => (
                      <div
                        key={bus.bus_id}
                        className={`flex items-center justify-between p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                          selectedBus === bus.bus_id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-accent"
                        }`}
                        onClick={() =>
                          setSelectedBus(
                            selectedBus === bus.bus_id ? null : bus.bus_id
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{bus.bus_id}</Badge>
                          <div className="flex flex-col">
                            <span className="font-medium">{bus.current_stop}</span>
                            <span className="text-xs text-muted-foreground">
                              Next: {bus.next_stop}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${
                              getOccupancyColor(bus.passenger_load_pct) ===
                              "success"
                                ? "text-green-600"
                                : getOccupancyColor(bus.passenger_load_pct) ===
                                  "warning"
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {Math.round(bus.passenger_load_pct)}% Load
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {bus.eta_minutes} min away
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Sidebar Details Panel */}
        <div className="space-y-4">
          {selectedBus && trackingData ? (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Bus Details</span>
                  <Badge variant="secondary">{selectedBus}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-lg font-bold">
                      {Math.round(trackingData.passenger_load_pct)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Occupancy</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <Zap className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-lg font-bold">
                      {trackingData.current_location.speed_kmph}
                    </div>
                    <div className="text-xs text-muted-foreground">km/h</div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Stop Timeline
                  </h3>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="relative border-l-2 border-muted ml-2 space-y-6 py-2">
                      {trackingData.stop_timeline.map((stop, idx) => (
                        <div key={idx} className="relative pl-6">
                          <div
                            className={`absolute left-[-5px] top-1 w-3 h-3 rounded-full border-2 border-background ${
                              stop.status === "passed"
                                ? "bg-green-500"
                                : stop.status === "current"
                                ? "bg-blue-500 scale-125"
                                : "bg-muted-foreground"
                            }`}
                          ></div>
                          <div className="flex justify-between items-start">
                            <div>
                              <div
                                className={`font-medium ${
                                  stop.status === "current" ? "text-primary" : ""
                                }`}
                              >
                                {stop.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {stop.status === "passed"
                                  ? "Departed"
                                  : stop.status === "current"
                                  ? "At Stop"
                                  : "Upcoming"}
                              </div>
                            </div>
                            {stop.eta_minutes && (
                              <Badge variant="outline" className="text-xs">
                                {stop.eta_minutes} min
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a bus to view detailed tracking info</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, Users, Bus } from "lucide-react";
import { getLiveBuses } from "@/lib/api";

import FormattedTime from "@/components/FormattedTime";

const LiveBusFeed = () => {
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const data = await getLiveBuses();
      setBuses(data.buses || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch live buses:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sort by urgency: High Load first
  const sortedBuses = [...buses].sort((a, b) => {
    const loadA = a.passenger_load_pct || 0;
    const loadB = b.passenger_load_pct || 0;
    return loadB - loadA;
  });

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Live Bus Updates</CardTitle>
            <Skeleton className="h-5 w-16" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Bus Updates</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {buses.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full px-4 pb-4">
          <div className="space-y-3">
            {sortedBuses.map((bus) => (
              <div
                key={bus.bus_id}
                className="flex flex-col space-y-2 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm">{bus.bus_id}</span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                      {bus.speed_kmph > 0 ? "Moving" : "Stopped"}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {bus.last_update ? new Date(bus.last_update).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : "--:--"}
                  </span>
                </div>

                <div
                  className="text-xs font-medium truncate"
                  title={bus.route_name}
                >
                  {bus.route_name || `Route ${bus.route_id}`}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>ETA: {bus.eta_minutes || "--"}m</span>
                  </div>
                  <div className="flex items-center truncate">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">Next: {bus.next_stop || "--"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" /> Occupancy
                    </span>
                    <span
                      className={
                        (bus.passenger_load_pct || 0) > 90
                          ? "text-red-500 font-bold"
                          : ""
                      }
                    >
                      {Math.round(bus.passenger_load_pct || 0)}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${(bus.passenger_load_pct || 0) > 90
                          ? "bg-red-500"
                          : (bus.passenger_load_pct || 0) > 70
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      style={{ width: `${bus.passenger_load_pct || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {sortedBuses.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                <Bus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No active buses found.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveBusFeed;


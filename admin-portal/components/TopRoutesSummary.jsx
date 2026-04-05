"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { getLiveBuses } from "@/lib/api";

const TopRoutesSummary = () => {
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLiveBuses();
        setBuses(data.buses || []);
      } catch (err) {
        console.error("Failed to fetch buses:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Aggregate data by route
  const routeStats = useMemo(() => {
    const stats = {};

    buses.forEach((bus) => {
      const routeName = bus.route_name || bus.route_id || "Unknown";
      if (!stats[routeName]) {
        stats[routeName] = { name: routeName, totalLoad: 0, count: 0, maxLoad: 0 };
      }
      const load = bus.passenger_load_pct || 0;
      stats[routeName].totalLoad += load;
      stats[routeName].count += 1;
      stats[routeName].maxLoad = Math.max(stats[routeName].maxLoad, load);
    });

    return Object.values(stats)
      .map((stat) => ({
        name: stat.name,
        avgOccupancy: Math.round(stat.totalLoad / stat.count),
        maxOccupancy: Math.round(stat.maxLoad),
        busCount: stat.count,
      }))
      .sort((a, b) => b.avgOccupancy - a.avgOccupancy)
      .slice(0, 5);
  }, [buses]);

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col max-h-[400px]">
        <CardHeader className="pb-3 flex-none">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Top Congested Routes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col max-h-[400px]">
      <CardHeader className="pb-3 flex-none">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Top Congested Routes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
        <div className="divide-y">
          {routeStats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No active route data
            </div>
          ) : (
            routeStats.map((route, i) => (
              <div
                key={i}
                className="p-3 hover:bg-muted/30 transition-colors flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div
                    className="font-medium text-sm truncate max-w-[180px]"
                    title={route.name}
                  >
                    {route.name}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <span
                      className={
                        route.avgOccupancy > 80
                          ? "text-destructive font-medium"
                          : ""
                      }
                    >
                      {route.avgOccupancy}% Avg Load
                    </span>
                    <span>•</span>
                    <span>{route.busCount} Buses</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className="text-[10px] mb-1 bg-muted/50"
                  >
                    {route.maxOccupancy > 90 ? "Add Bus" : "Monitor"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopRoutesSummary;


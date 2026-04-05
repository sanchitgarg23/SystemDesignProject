"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wifi, WifiOff, Activity } from "lucide-react";
import { getLiveBuses } from "@/lib/api";

const DataQualityPanel = () => {
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

  // Calculate "Stale" buses (last update > 5 mins ago)
  const staleCount = buses.filter((bus) => {
    if (!bus.last_update) return true;
    const lastUpdate = new Date(bus.last_update).getTime();
    const now = new Date().getTime();
    return now - lastUpdate > 5 * 60 * 1000;
  }).length;

  const activeCount = buses.length;
  const onlinePct =
    activeCount > 0
      ? Math.round(((activeCount - staleCount) / activeCount) * 100)
      : 100;

  if (isLoading) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            System Health
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Wifi className="h-3 w-3" /> Online Status
            </div>
            <div className="text-lg font-bold text-success">{onlinePct}%</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <WifiOff className="h-3 w-3" /> Stale Devices
            </div>
            <div
              className={`text-lg font-bold ${staleCount > 0 ? "text-warning" : ""}`}
            >
              {staleCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                buses
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataQualityPanel;


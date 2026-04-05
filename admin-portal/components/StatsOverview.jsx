"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bus, Users, Clock, MapPin } from "lucide-react";
import { getRealtimeAnalytics } from "@/lib/api";

import FormattedTime from "@/components/FormattedTime";

const StatsOverview = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());

  const fetchData = async () => {
    try {
      const data = await getRealtimeAnalytics();
      setAnalytics(data);
      setTimestamp(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center text-muted-foreground py-4">
        Unable to load analytics. Please try again.
      </div>
    );
  }

  const stats = [
    {
      id: "active_buses",
      title: "Active Buses",
      value: analytics.active_buses?.toString() || "0",
      subtitle: "Currently on routes",
      icon: Bus,
      color: "text-primary",
    },
    {
      id: "low_crowding",
      title: "Low Crowding",
      value: analytics.crowding_breakdown?.low?.toString() || "0",
      subtitle: "Buses with low load",
      icon: Users,
      color: "text-success",
    },
    {
      id: "high_crowding",
      title: "High Crowding",
      value: analytics.crowding_breakdown?.high?.toString() || "0",
      subtitle: "Buses with high load",
      icon: MapPin,
      color: "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {stats.map((stat) => (
        <Card
          key={stat.id}
          className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stat.value}
            </div>
            <div className="flex justify-between items-end mt-1">
              <div>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
              <span className="text-[10px] text-muted-foreground/60">
                Updated: <FormattedTime />
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsOverview;


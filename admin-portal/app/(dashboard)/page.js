"use client";

import { useState } from "react";
import StatsOverview from "@/components/StatsOverview";
import NetworkGraphView from "@/components/NetworkGraphView";
import LiveBusFeed from "@/components/LiveBusFeed";
import DataQualityPanel from "@/components/DataQualityPanel";
import TopRoutesSummary from "@/components/TopRoutesSummary";
import { Button } from "@/components/ui/button";
import { RefreshCw, PauseCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import FormattedTime from "@/components/FormattedTime";

export default function DashboardPage() {
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setLastUpdated(new Date());
    toast.success("Dashboard Refreshed", {
      description: "Latest data fetched from server.",
    });
  };

  const toggleLive = () => {
    setIsLive(!isLive);
    toast.info(isLive ? "Live Updates Paused" : "Live Updates Resumed");
  };

  return (
    <div className="space-y-4 h-[calc(100vh-2rem)] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-none">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            NextStop Dashboard
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Real-time Operations Center
            <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground"></span>
            Last updated: <FormattedTime date={lastUpdated} />
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={
              isLive ? "text-primary border-primary/20 bg-primary/5" : ""
            }
            onClick={toggleLive}
          >
            {isLive ? (
              <PauseCircle className="h-4 w-4 mr-2" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            {isLive ? "Live" : "Paused"}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="flex-none">
        <StatsOverview />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Graph & Data Quality */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-full overflow-hidden">
          <div className="flex-1 min-h-0">
            <NetworkGraphView />
          </div>
          {/* <div className="flex-none">
            <DataQualityPanel />
          </div> */}
        </div>

        {/* Right Column: Live Feed & Top Routes */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
          <div className="flex-1 min-h-0">
            <LiveBusFeed />
          </div>
          <div className="flex-1 min-h-0">
            <TopRoutesSummary />
          </div>
        </div>
      </div>
    </div>
  );
}

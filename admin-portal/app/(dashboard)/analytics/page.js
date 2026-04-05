"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Filter,
  DollarSign,
  Users,
  Ticket,
  Bus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getTicketAnalytics, getRoutePerformance, getAllRoutes } from "@/lib/api";

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const routeIdParam = searchParams.get("route_id");

  // Route Performance
  const [selectedRoute, setSelectedRoute] = useState("all");
  // Ticket Analytics
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const [isLoading, setIsLoading] = useState(true);
  const [ticketData, setTicketData] = useState(null);
  const [routePerformance, setRoutePerformance] = useState([]);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ticketRes, perfRes, routesRes] = await Promise.all([
          getTicketAnalytics(),
          getRoutePerformance(),
          getAllRoutes(),
        ]);
        setTicketData(ticketRes);
        setRoutePerformance(perfRes.performance || []);
        
        const fetchedRoutes = routesRes.routes || [];
        setRoutes(fetchedRoutes);

        // Handle deep link param
        if (routeIdParam) {
          const matchedRoute = fetchedRoutes.find(r => r.route_id === routeIdParam);
          if (matchedRoute) {
            setSelectedRoute(matchedRoute.name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [routeIdParam]);

  // Filter route performance
  const filteredPerformance =
    selectedRoute === "all"
      ? routePerformance
      : routePerformance.filter((r) => r.name === selectedRoute);

  // Pagination
  const totalPages = Math.ceil(
    (ticketData?.buses?.length || 0) / itemsPerPage
  );
  const paginatedBuses = ticketData?.buses?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            View performance metrics and ticket data
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-[150px] w-full rounded-xl" />
            <Skeleton className="h-[150px] w-full rounded-xl" />
            <Skeleton className="h-[150px] w-full rounded-xl" />
          </div>
        </div>
      ) : (
      <Tabs defaultValue="route-performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="route-performance">Route Performance</TabsTrigger>
          <TabsTrigger value="ticket-analytics">Ticket Analytics</TabsTrigger>
        </TabsList>

        {/* ROUTE PERFORMANCE TAB */}
        <TabsContent value="route-performance">
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filter by Route:</span>
                  </div>
                  <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Select route" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Routes</SelectItem>
                      {routes.map((route) => (
                        <SelectItem key={route.route_id} value={route.name}>
                          {route.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPerformance.map((route, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bus className="h-4 w-4 text-primary" />
                      {route.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Daily Passengers
                      </span>
                      <span className="font-semibold flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {route.daily_passengers.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Efficiency
                        </span>
                        <span className="font-semibold">{route.efficiency}%</span>
                      </div>
                      <Progress value={route.efficiency} className="h-2" />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Revenue
                      </span>
                      <span className="font-semibold text-green-600 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />₹
                        {route.revenue.toLocaleString()}
                      </span>
                    </div>

                    <Badge
                      variant={route.efficiency >= 90 ? "default" : "secondary"}
                      className={
                        route.efficiency >= 90
                          ? "bg-green-500 hover:bg-green-600"
                          : ""
                      }
                    >
                      {route.efficiency >= 90
                        ? "Optimal"
                        : route.efficiency >= 80
                        ? "Good"
                        : "Needs Improvement"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPerformance.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No route performance data available</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* TICKET ANALYTICS TAB */}
        <TabsContent value="ticket-analytics">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bus className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">
                    {ticketData.combined_totals.total_buses}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Buses
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">
                    {ticketData.combined_totals.total_trips}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Trips
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Ticket className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">
                    {ticketData.combined_totals.total_tickets.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Tickets
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">
                    {ticketData.combined_totals.unique_seats_occupied}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Seats Occupied
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">
                    ₹{ticketData.combined_totals.total_revenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Revenue
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Ticket className="h-6 w-6 mx-auto mb-2 text-indigo-500" />
                  <div className="text-2xl font-bold">
                    ₹{ticketData.combined_totals.avg_fare.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Fare</div>
                </CardContent>
              </Card>
            </div>

            {/* Bus-wise breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Bus-wise Ticket Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">
                          Bus ID
                        </th>
                        <th className="text-left py-3 px-2 font-medium">
                          Route
                        </th>
                        <th className="text-right py-3 px-2 font-medium">
                          Trips
                        </th>
                        <th className="text-right py-3 px-2 font-medium">
                          Tickets
                        </th>
                        <th className="text-right py-3 px-2 font-medium">
                          Seats
                        </th>
                        <th className="text-right py-3 px-2 font-medium">
                          Revenue
                        </th>
                        <th className="text-right py-3 px-2 font-medium">
                          Avg Fare
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBuses?.map((bus, idx) => (
                        <tr
                          key={idx}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-3 px-2">
                            <Badge variant="outline">{bus.bus_id}</Badge>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {bus.route_id}
                          </td>
                          <td className="text-right py-3 px-2">
                            {bus.total_trips}
                          </td>
                          <td className="text-right py-3 px-2">
                            {bus.total_tickets}
                          </td>
                          <td className="text-right py-3 px-2">
                            {bus.seats_occupied}
                          </td>
                          <td className="text-right py-3 px-2 text-green-600 font-medium">
                            ₹{bus.total_revenue.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-2">
                            ₹{bus.avg_fare.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}

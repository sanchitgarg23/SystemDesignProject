"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    Users,
    Bus,
    Clock,
    AlertTriangle,
    CheckCircle,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { getAllRoutes } from "@/lib/api";
import { useDemandAnalysis } from "@/lib/useDemandAnalysis";
import { DemandChart } from "@/components/DemandChart";

export default function DemandAnalysisPage() {
    const [selectedRouteId, setSelectedRouteId] = useState("");
    const [routes, setRoutes] = useState([]);

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const data = await getAllRoutes();
                const routeList = data.routes || [];
                setRoutes(routeList);
                if (routeList.length > 0 && !selectedRouteId) {
                    setSelectedRouteId(routeList[0].route_id);
                }
            } catch (err) {
                console.error("Failed to fetch routes:", err);
            }
        };
        fetchRoutes();
    }, []);

    // Use the custom hook to fetch demand data
    const { data, summary, routeName, capacity, isLoading, error } = useDemandAnalysis(
        selectedRouteId
    );

    // Get optimization suggestions based on data
    const getOptimizationSuggestions = () => {
        if (!summary) return [];

        const suggestions = [];

        // Check if peak demand is very high
        if (summary.peakBuses > summary.avgBuses * 1.5) {
            suggestions.push({
                type: "warning",
                icon: AlertTriangle,
                title: "High Peak Demand",
                description: `Peak demand at ${summary.peakTime} requires ${summary.peakBuses} buses, which is ${Math.round((summary.peakBuses / summary.avgBuses - 1) * 100)}% above average.`,
                action: "Consider adding extra buses during peak hours.",
            });
        }

        // Check if there's low utilization during off-peak
        const offPeakData = data.filter((d) => {
            const hour = parseInt(d.time.split(":")[0]);
            return hour < 7 || (hour > 9 && hour < 17) || hour > 19;
        });

        const avgOffPeak = offPeakData.length > 0
            ? offPeakData.reduce((sum, d) => sum + d.passengers, 0) / offPeakData.length
            : 0;

        if (avgOffPeak < capacity * 0.5 && summary.avgBuses > 1) {
            suggestions.push({
                type: "info",
                icon: TrendingUp,
                title: "Low Off-Peak Utilization",
                description: `Average off-peak passengers (${Math.round(avgOffPeak)}) is below 50% capacity.`,
                action: "Consider reducing bus frequency during off-peak hours.",
            });
        }

        // Add positive feedback if efficiency is good
        if (summary.avgPassengers >= capacity * 0.6 && summary.peakBuses <= summary.avgBuses * 1.3) {
            suggestions.push({
                type: "success",
                icon: CheckCircle,
                title: "Good Fleet Efficiency",
                description: "The current bus allocation matches demand patterns well.",
                action: "Maintain current scheduling.",
            });
        }

        return suggestions;
    };

    const suggestions = getOptimizationSuggestions();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        Demand Analysis
                    </h1>
                    <p className="text-muted-foreground">
                        Analyze passenger demand patterns and optimize bus allocation
                    </p>
                </div>
            </div>

            {/* Route Selector */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex items-center gap-2">
                            <Bus className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Select Route:</span>
                        </div>
                        <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                            <SelectTrigger className="w-[350px]">
                                <SelectValue placeholder="Select a route" />
                            </SelectTrigger>
                            <SelectContent>
                                {routes.map((route) => (
                                    <SelectItem key={route.route_id} value={route.route_id}>
                                        <div className="flex items-center gap-2">
                                            <span>{route.name}</span>
                                            {route.distance_km && (
                                                <Badge variant="outline" className="text-xs">
                                                    {route.distance_km} km
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Optional: Date range selector (placeholder for future) */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Showing: Today&apos;s Data</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <Skeleton className="h-4 w-20 mb-2" />
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : error ? (
                <Card>
                    <CardContent className="py-8 text-center text-destructive">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        <p>{error.message}</p>
                    </CardContent>
                </Card>
            ) : summary ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">Peak Time</div>
                                <Clock className="h-4 w-4 text-orange-500" />
                            </div>
                            <div className="text-2xl font-bold mt-1">{summary.peakTime}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {summary.peakPassengers} passengers
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">Avg Passengers</div>
                                <Users className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="text-2xl font-bold mt-1">{summary.avgPassengers}</div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3 text-green-500" />
                                Per time slot
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">Peak Buses</div>
                                <Bus className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="text-2xl font-bold mt-1">{summary.peakBuses}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                At {summary.peakTime}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">Avg Buses</div>
                                <Bus className="h-4 w-4 text-purple-500" />
                            </div>
                            <div className="text-2xl font-bold mt-1">{summary.avgBuses}</div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                {summary.peakBuses > summary.avgBuses * 1.3 ? (
                                    <>
                                        <ArrowDownRight className="h-3 w-3 text-amber-500" />
                                        <span>Variable demand</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        <span>Stable demand</span>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : null}

            {/* Main Chart */}
            {isLoading ? (
                <Card>
                    <CardContent className="pt-6">
                        <Skeleton className="h-[400px] w-full" />
                    </CardContent>
                </Card>
            ) : (
                <DemandChart
                    data={data}
                    routeName={routeName}
                    showRequiredBuses={true}
                    capacity={capacity}
                />
            )}

            {/* Optimization Suggestions */}
            {!isLoading && suggestions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Optimization Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {suggestions.map((suggestion, idx) => {
                                const IconComponent = suggestion.icon;
                                return (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-lg border ${suggestion.type === "warning"
                                                ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
                                                : suggestion.type === "success"
                                                    ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800"
                                                    : "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <IconComponent
                                                className={`h-5 w-5 mt-0.5 ${suggestion.type === "warning"
                                                        ? "text-amber-600"
                                                        : suggestion.type === "success"
                                                            ? "text-green-600"
                                                            : "text-blue-600"
                                                    }`}
                                            />
                                            <div>
                                                <h4 className="font-medium text-sm">{suggestion.title}</h4>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {suggestion.description}
                                                </p>
                                                <p className="text-sm font-medium mt-2">
                                                    {suggestion.action}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Data Table */}
            {!isLoading && data.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Detailed Time Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2 font-medium">Time</th>
                                        <th className="text-right py-3 px-2 font-medium">Passengers</th>
                                        <th className="text-right py-3 px-2 font-medium">Capacity</th>
                                        <th className="text-right py-3 px-2 font-medium">Utilization</th>
                                        <th className="text-right py-3 px-2 font-medium">Required Buses</th>
                                        <th className="text-center py-3 px-2 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, idx) => {
                                        const utilization = Math.round((row.passengers / (row.requiredBuses * row.capacity)) * 100);
                                        return (
                                            <tr
                                                key={idx}
                                                className="border-b hover:bg-muted/50 transition-colors"
                                            >
                                                <td className="py-3 px-2 font-medium">{row.time}</td>
                                                <td className="text-right py-3 px-2">{row.passengers}</td>
                                                <td className="text-right py-3 px-2">{row.capacity}</td>
                                                <td className="text-right py-3 px-2">
                                                    <span
                                                        className={
                                                            utilization >= 80
                                                                ? "text-green-600"
                                                                : utilization >= 50
                                                                    ? "text-amber-600"
                                                                    : "text-red-500"
                                                        }
                                                    >
                                                        {utilization}%
                                                    </span>
                                                </td>
                                                <td className="text-right py-3 px-2 font-medium">
                                                    {row.requiredBuses}
                                                </td>
                                                <td className="text-center py-3 px-2">
                                                    <Badge
                                                        variant={
                                                            utilization >= 80
                                                                ? "default"
                                                                : utilization >= 50
                                                                    ? "secondary"
                                                                    : "outline"
                                                        }
                                                        className={
                                                            utilization >= 80
                                                                ? "bg-green-500 hover:bg-green-600"
                                                                : utilization >= 50
                                                                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                                                                    : ""
                                                        }
                                                    >
                                                        {utilization >= 80
                                                            ? "High"
                                                            : utilization >= 50
                                                                ? "Medium"
                                                                : "Low"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

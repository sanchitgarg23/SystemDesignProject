"use client";

import { useMemo } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Bus, Users } from "lucide-react";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

/**
 * Reusable demand analysis chart component using Chart.js
 * Displays passenger demand and required buses over time
 * 
 * @param {Object} props
 * @param {Array<{time: string, passengers: number, capacity: number, requiredBuses: number}>} props.data - Chart data points
 * @param {string} props.routeName - Route name for the title
 * @param {boolean} props.showRequiredBuses - Toggle required buses line (default: true)
 * @param {number} props.capacity - Bus capacity for reference
 * @param {string} props.className - Additional CSS classes
 */
export function DemandChart({
    data = [],
    routeName = "",
    showRequiredBuses = true,
    capacity = 0,
    className = "",
}) {
    // Find peak values for annotations
    const peakPassengers = useMemo(
        () => (data.length > 0 ? Math.max(...data.map((d) => d.passengers)) : 0),
        [data]
    );
    const peakBuses = useMemo(
        () => (data.length > 0 ? Math.max(...data.map((d) => d.requiredBuses)) : 0),
        [data]
    );

    // Prepare Chart.js data
    const chartData = useMemo(() => ({
        labels: data.map((d) => d.time),
        datasets: [
            {
                label: "Passengers",
                data: data.map((d) => d.passengers),
                borderColor: "rgb(59, 130, 246)", // blue-500
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "rgb(59, 130, 246)",
                pointHoverBorderColor: "#fff",
                pointHoverBorderWidth: 2,
                yAxisID: "y",
            },
            ...(showRequiredBuses
                ? [
                    {
                        label: "Required Buses",
                        data: data.map((d) => d.requiredBuses),
                        borderColor: "rgb(34, 197, 94)", // green-500
                        backgroundColor: "rgba(34, 197, 94, 0.05)",
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0,
                        stepped: "after",
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: "rgb(34, 197, 94)",
                        pointHoverBorderColor: "#fff",
                        pointHoverBorderWidth: 2,
                        yAxisID: "y1",
                    },
                ]
                : []),
        ],
    }), [data, showRequiredBuses]);

    // Chart.js options
    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index",
            intersect: false,
        },
        plugins: {
            legend: {
                position: "top",
                labels: {
                    usePointStyle: true,
                    pointStyle: "circle",
                    padding: 20,
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                titleFont: {
                    size: 14,
                    weight: "bold",
                },
                bodyFont: {
                    size: 13,
                },
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    afterBody: (context) => {
                        const dataIndex = context[0].dataIndex;
                        const item = data[dataIndex];
                        if (item) {
                            return `\nBus Capacity: ${item.capacity}`;
                        }
                        return "";
                    },
                },
            },
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: "Time",
                    font: {
                        size: 12,
                        weight: "bold",
                    },
                },
                grid: {
                    display: false,
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 12,
                },
            },
            y: {
                type: "linear",
                display: true,
                position: "left",
                title: {
                    display: true,
                    text: "Passengers",
                    font: {
                        size: 12,
                        weight: "bold",
                    },
                },
                grid: {
                    color: "rgba(0, 0, 0, 0.05)",
                },
                beginAtZero: true,
            },
            ...(showRequiredBuses
                ? {
                    y1: {
                        type: "linear",
                        display: true,
                        position: "right",
                        title: {
                            display: true,
                            text: "Required Buses",
                            font: {
                                size: 12,
                                weight: "bold",
                            },
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                        },
                    },
                }
                : {}),
        },
    }), [data, showRequiredBuses]);

    if (!data || data.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No demand data available</p>
                    <p className="text-sm mt-1">Select a route to view demand analysis</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Passenger Demand Over Time
                        </CardTitle>
                        {routeName && (
                            <p className="text-sm text-muted-foreground mt-1">{routeName}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Peak: {peakPassengers}
                        </Badge>
                        {showRequiredBuses && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Bus className="h-3 w-3" />
                                Max Buses: {peakBuses}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <Line data={chartData} options={options} />
                </div>

                {/* Legend explanation */}
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-blue-500 rounded" />
                            <span>Passenger demand throughout the day</span>
                        </div>
                        {showRequiredBuses && (
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-0.5 bg-green-500 rounded"
                                    style={{ borderTopWidth: 2, borderStyle: "dashed" }}
                                />
                                <span>Required buses (capacity: {data[0]?.capacity || capacity})</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default DemandChart;

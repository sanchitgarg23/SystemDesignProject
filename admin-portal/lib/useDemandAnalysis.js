"use client";

import { useState, useEffect } from "react";
import { getDemandAnalysis } from "@/lib/api";

/**
 * Compute summary statistics from the demand data
 */
const computeSummary = (demandData) => {
    if (!demandData || demandData.length === 0) {
        return null;
    }

    const peakEntry = demandData.reduce(
        (max, entry) => (entry.passengers > max.passengers ? entry : max),
        demandData[0]
    );

    const avgPassengers = Math.round(
        demandData.reduce((sum, entry) => sum + entry.passengers, 0) /
        demandData.length
    );

    const avgBuses =
        Math.round(
            (demandData.reduce((sum, entry) => sum + entry.requiredBuses, 0) /
                demandData.length) *
            10
        ) / 10;

    const peakBuses = Math.max(...demandData.map((entry) => entry.requiredBuses));

    return {
        peakTime: peakEntry.time,
        peakPassengers: peakEntry.passengers,
        avgPassengers,
        peakBuses,
        avgBuses,
        totalCapacity: peakBuses * peakEntry.capacity,
    };
};

/**
 * Custom hook for fetching and transforming demand analysis data
 */
export function useDemandAnalysis(routeId, dateRange) {
    const [state, setState] = useState({
        data: [],
        routeName: "",
        capacity: 0,
        summary: null,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            if (!routeId) {
                setState({
                    data: [],
                    routeName: "",
                    capacity: 0,
                    summary: null,
                    isLoading: false,
                    error: null,
                });
                return;
            }

            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const response = await getDemandAnalysis(routeId);

                if (cancelled) return;

                if (!response) {
                    throw new Error(`No data found for route ${routeId}`);
                }

                const transformedData = response.data.map((entry) => ({
                    time: entry.time,
                    passengers: entry.passengers,
                    capacity: entry.capacity,
                    requiredBuses: Math.ceil(entry.passengers / entry.capacity),
                }));

                setState({
                    data: transformedData,
                    routeName: response.routeName,
                    capacity: response.capacity,
                    summary: computeSummary(transformedData),
                    isLoading: false,
                    error: null,
                });
            } catch (err) {
                if (cancelled) return;
                setState({
                    data: [],
                    routeName: "",
                    capacity: 0,
                    summary: null,
                    isLoading: false,
                    error: err instanceof Error ? err : new Error("Failed to fetch demand data"),
                });
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [routeId]); // Only depend on routeId for now

    return {
        data: state.data,
        summary: state.summary,
        routeName: state.routeName,
        capacity: state.capacity,
        isLoading: state.isLoading,
        error: state.error,
        refetch: () => {
            setState((prev) => ({ ...prev, isLoading: true }));
        },
    };
}


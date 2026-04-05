"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Maximize,
  Network,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  Map as MapIcon,
  Minimize,
  Expand,
  Globe,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getAllRoutes, getLiveBuses } from "@/lib/api";
import OlaMap from "@/components/OlaMap";

const NetworkGraphView = () => {
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState("macro");
  const [selectedMacroEdge, setSelectedMacroEdge] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState("map");
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routesData, busesData] = await Promise.all([
          getAllRoutes(),
          getLiveBuses(),
        ]);
        setRoutes(routesData.routes || []);
        setBuses(busesData.buses || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Identify Hubs
  const hubs = useMemo(() => {
    const hubSet = new Set();
    routes.forEach((route) => {
      if (route.stops.length > 0) {
        hubSet.add(route.stops[0].name.toLowerCase().trim());
        hubSet.add(route.stops[route.stops.length - 1].name.toLowerCase().trim());
      }
    });
    return hubSet;
  }, [routes]);

  // Build Graph Data
  const graphData = useMemo(() => {
    if (!routes.length) return { macro: { nodes: {}, edges: [], width: 1000 } };

    const macroNodes = {};
    const macroEdges = {};

    const getMacroNode = (stop) => {
      const id = stop.name.toLowerCase().trim();
      if (!macroNodes[id]) {
        macroNodes[id] = { ...stop, id, type: "hub" };
      }
      return macroNodes[id];
    };

    routes.forEach((route) => {
      const routeHubs = route.stops.filter((stop) =>
        hubs.has(stop.name.toLowerCase().trim())
      );
      if (routeHubs.length < 2) return;

      for (let i = 0; i < routeHubs.length - 1; i++) {
        const fromHub = routeHubs[i];
        const toHub = routeHubs[i + 1];
        const fromId = fromHub.name.toLowerCase().trim();
        const toId = toHub.name.toLowerCase().trim();

        getMacroNode(fromHub);
        getMacroNode(toHub);

        const edgeKey = `${fromId}-${toId}`;
        if (!macroEdges[edgeKey]) {
          macroEdges[edgeKey] = {
            from: fromId,
            to: toId,
            routes: [],
            stops: [],
          };
        }
        macroEdges[edgeKey].routes.push(route);
      }
    });

    // Linear Layout
    const sortedNodeIds = Object.keys(macroNodes).sort(
      (a, b) => macroNodes[a].lng - macroNodes[b].lng
    );

    const MIN_WIDTH = 1000;
    const NODE_SPACING = 150;
    const TOTAL_WIDTH = Math.max(
      MIN_WIDTH,
      sortedNodeIds.length * NODE_SPACING + 200
    );
    const PADDING_X = 100;
    const BASE_Y = 500;

    let minLat = Infinity,
      maxLat = -Infinity;
    Object.values(macroNodes).forEach((node) => {
      minLat = Math.min(minLat, node.lat);
      maxLat = Math.max(maxLat, node.lat);
    });
    const latSpan = maxLat - minLat || 0.01;

    sortedNodeIds.forEach((id, index) => {
      const node = macroNodes[id];
      const xStep =
        (TOTAL_WIDTH - 2 * PADDING_X) / Math.max(1, sortedNodeIds.length - 1);
      node.x = PADDING_X + index * xStep;
      const normalizedLat = (node.lat - minLat) / latSpan;
      const yDeviation = (normalizedLat - 0.5) * -300;
      node.y = BASE_Y + yDeviation;
    });

    return {
      macro: { nodes: macroNodes, edges: Object.values(macroEdges), width: TOTAL_WIDTH },
    };
  }, [routes, hubs]);

  const handleEdgeClick = (edge) => {
    setSelectedMacroEdge(edge);
    setViewMode("micro");
    setZoom(1);
  };

  const handleBack = () => {
    setViewMode("macro");
    setSelectedMacroEdge(null);
    setZoom(1);
  };

  const currentNodes = graphData.macro.nodes;
  const currentEdges = graphData.macro.edges;
  const currentWidth = graphData.macro.width;

  return (
    <Card
      className={cn(
        "lg:col-span-2 flex flex-col overflow-hidden transition-all duration-300",
        isFullScreen
          ? "fixed inset-0 z-50 rounded-none h-screen w-screen"
          : "h-full"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-card z-10 border-b">
        <div className="flex items-center space-x-2">
          {viewMode === "micro" && activeTab === "network" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle className="flex items-center space-x-2">
            {activeTab === "network" ? (
              viewMode === "macro" ? (
                <Network className="h-5 w-5 text-primary" />
              ) : (
                <Network className="h-5 w-5 text-primary" />
              )
            ) : (
              <Globe className="h-5 w-5 text-primary" />
            )}
            <span>
              {activeTab === "network"
                ? viewMode === "macro"
                  ? "Inter-City Network"
                  : `Route Details: ${selectedMacroEdge?.from} ↔ ${selectedMacroEdge?.to}`
                : "Live Map View"}
            </span>
            <Badge variant="outline" className="ml-2">
              {buses.length} Active
            </Badge>
          </CardTitle>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex bg-muted rounded-lg p-1 mr-2">
            <Button
              variant={activeTab === "map" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveTab("map")}
            >
              <MapIcon className="h-3 w-3 mr-1" />
              Map
            </Button>
            <Button
              variant={activeTab === "network" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveTab("network")}
            >
              <Network className="h-3 w-3 mr-1" />
              Network
            </Button>
            
          </div>

          {activeTab === "network" && (
            <>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => setZoom(1)}
              >
                <Maximize className="h-3 w-3 mr-1" />
                Fit
              </Button>
            </>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 ml-2"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Expand className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[500px] p-0 relative bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {activeTab === "map" ? (
          <OlaMap />
        ) : (
          <div className="absolute inset-0 overflow-auto flex items-center justify-center">
            <svg
              className="h-full"
              style={{
                width: currentWidth,
                minWidth: "100%",
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                transition: "transform 0.2s",
              }}
              viewBox={`0 0 ${currentWidth} 1000`}
            >
              {/* Grid Pattern */}
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.05"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Edges */}
              {currentEdges.map((edge) => {
                const startNode = currentNodes[edge.from];
                const endNode = currentNodes[edge.to];
                if (!startNode || !endNode) return null;

                return (
                  <g
                    key={`${edge.from}-${edge.to}`}
                    onClick={() => handleEdgeClick(edge)}
                    className="cursor-pointer hover:opacity-80 transition-opacity group"
                  >
                    <line
                      x1={startNode.x}
                      y1={startNode.y}
                      x2={endNode.x}
                      y2={endNode.y}
                      stroke="#6366f1"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className="group-hover:stroke-indigo-400 transition-colors"
                    />
                    <line
                      x1={startNode.x}
                      y1={startNode.y}
                      x2={endNode.x}
                      y2={endNode.y}
                      stroke="transparent"
                      strokeWidth="30"
                    />
                    <circle
                      cx={(startNode.x + endNode.x) / 2}
                      cy={(startNode.y + endNode.y) / 2}
                      r="14"
                      fill="white"
                      stroke="#6366f1"
                      strokeWidth="2"
                    />
                    <text
                      x={(startNode.x + endNode.x) / 2}
                      y={(startNode.y + endNode.y) / 2}
                      dy="5"
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-indigo-600 pointer-events-none"
                    >
                      {edge.routes.length}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {Object.values(currentNodes).map((node) => (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <circle
                    r={12}
                    fill="#1e293b"
                    stroke="white"
                    strokeWidth="2"
                    className="z-10 shadow-sm"
                  />
                  <text
                    y={28}
                    textAnchor="middle"
                    className="text-sm fill-foreground font-bold pointer-events-none"
                    style={{ textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}
                  >
                    {node.name}
                  </text>
                </g>
              ))}

              {/* Buses */}
              {buses.slice(0, 5).map((bus, idx) => {
                const route = routes.find((r) => r.route_id === bus.route_id);
                if (!route) return null;

                const startNode = currentNodes[route.stops[0].name.toLowerCase().trim()];
                const endNode = currentNodes[route.stops[route.stops.length - 1].name.toLowerCase().trim()];
                if (!startNode || !endNode) return null;

                const ratio = 0.3 + (idx * 0.15);
                const x = startNode.x + (endNode.x - startNode.x) * ratio;
                const y = startNode.y + (endNode.y - startNode.y) * ratio;

                const isCrowded = bus.passenger_load_pct > 90;
                const isModerate = bus.passenger_load_pct > 70;
                const color = isCrowded
                  ? "#ef4444"
                  : isModerate
                    ? "#f59e0b"
                    : "#22c55e";

                return (
                  <TooltipProvider key={bus.bus_id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <g
                          className="cursor-pointer"
                          style={{ transform: `translate(${x}px, ${y}px)` }}
                        >
                          <circle r={6} fill={color} stroke="white" strokeWidth="2" />
                        </g>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="font-bold">{bus.bus_id}</div>
                        <div className="text-xs">{bus.route_name}</div>
                        <div className="text-xs">
                          Load: {Math.round(bus.passenger_load_pct)}%
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </svg>
          </div>
        )}

        {/* Legend */}
        {activeTab === "network" && (
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur p-3 rounded-lg border shadow-sm text-xs z-20">
            <div className="font-semibold mb-2">Major Connections</div>
            <div className="text-muted-foreground">
              Click on a connection line to see detailed routes.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkGraphView;

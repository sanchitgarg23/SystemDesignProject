"use client";

import { getAllRoutes } from "@/lib/api";
import { useEffect, useRef } from "react";

const OlaMap = () => {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initMap = async () => {
      try {
        const sdk = await import("olamaps-web-sdk");
        const { OlaMaps } = sdk;

        // Access Popup and Marker from SDK or OlaMaps static properties
        const Popup = sdk.Popup || OlaMaps.Popup;
        const Marker = sdk.Marker || OlaMaps.Marker;

        const olaMaps = new OlaMaps({
          apiKey: process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY,
        });

        const myMap = olaMaps.init({
          style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
          container: mapContainerRef.current,
          center: [75.61, 30.93], // Default center (Bangalore)
          zoom: 8,
        });

        // Fetch routes and add markers
        try {
          const data = await getAllRoutes();
          console.log(data, "data")
          if (data.routes) {
            data.routes.forEach((route, index) => {
              if (route.stops && route.stops.length > 0) {
                // Draw Polyline for the route
                const coordinates = route.stops.map(stop => [stop.lng, stop.lat]);
                const routeColor = `hsl(${index * 137.5 % 360}, 70%, 50%)`; // Generate distinct colors

                const addRouteLayer = () => {
                  // Ensure map is loaded before adding sources/layers
                  if (myMap.getSource(`route-${route.route_id}`)) {
                    return; // Already added
                  }

                  myMap.addSource(`route-${route.route_id}`, {
                    type: "geojson",
                    data: {
                      type: "Feature",
                      properties: {},
                      geometry: {
                        type: "LineString",
                        coordinates: coordinates,
                      },
                    },
                  });

                  myMap.addLayer({
                    id: `route-layer-${route.route_id}`,
                    type: "line",
                    source: `route-${route.route_id}`,
                    layout: {
                      "line-join": "round",
                      "line-cap": "round",
                    },
                    paint: {
                      "line-color": routeColor,
                      "line-width": 4,
                      "line-opacity": 0.8
                    },
                  });

                  // Add click listener for navigation
                  myMap.on('click', `route-layer-${route.route_id}`, () => {
                    // Using window.location for simpler navigation from within map callback
                    // or could pass router from component
                    window.location.href = `/tracking?route_id=${route.route_id}`;
                  });

                  // Change cursor on hover
                  myMap.on('mouseenter', `route-layer-${route.route_id}`, () => {
                    myMap.getCanvas().style.cursor = 'pointer';
                  });

                  myMap.on('mouseleave', `route-layer-${route.route_id}`, () => {
                    myMap.getCanvas().style.cursor = '';
                  });
                };

                if (myMap.loaded()) {
                  addRouteLayer();
                } else {
                  myMap.on('load', addRouteLayer);
                }

                // Add markers for each stop
                if (Marker && Popup) {
                  route.stops.forEach((stop) => {
                    const el = document.createElement('div');
                    el.className = 'stop-marker';
                    el.style.width = '12px';
                    el.style.height = '12px';
                    el.style.backgroundColor = routeColor;
                    el.style.borderRadius = '50%';
                    el.style.border = '2px solid white';
                    el.style.cursor = 'pointer';
                    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

                    const popup = new Popup({ offset: 10 })
                      .setHTML(`<div style="color:black;font-weight:bold;">${stop.name}</div><div style="color:gray;">${route.name}</div>`);

                    new Marker({ element: el })
                      .setLngLat([stop.lng, stop.lat])
                      .setPopup(popup)
                      .addTo(myMap);
                  });
                }
              }
            });
          } else if (!Marker || !Popup) {
            console.error("Ola Maps Marker or Popup constructor not found in SDK");
          }
        } catch (err) {
          console.error("Error fetching routes:", err);
        }

        return () => {
          myMap.remove();
        };
      } catch (error) {
        console.error("Error loading Ola Maps:", error);
      }
    };

    initMap();
  }, []);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />;
};

export default OlaMap;

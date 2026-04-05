"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bus, MapPin, BarChart3, Menu, X, Route, Clock, TrendingUp } from "lucide-react";
import FormattedTime from "@/components/FormattedTime";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: BarChart3,
      description: "Live overview & statistics",
    },
    {
      name: "Live Tracking",
      href: "/tracking",
      icon: MapPin,
      description: "Real-time bus locations",
    },
    {
      name: "Route Management",
      href: "/routes",
      icon: Route,
      description: "Manage routes & schedules",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      description: "Insights & predictions",
    },
    {
      name: "Demand Analysis",
      href: "/demand-analysis",
      icon: TrendingUp,
      description: "Analyze passenger demand patterns",
    },
    {
      name: "Fleet Management",
      href: "/fleet",
      icon: Bus,
      description: "Manage buses, drivers & conductors",
    },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-14 h-14 bg-white rounded-lg overflow-hidden">
                <img
                  src="/Untitled_design.png"
                  alt="NextStop logo"
                  className="h-21 w-21 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  NextStop Admin
                </h1>
                <p className="text-xs text-muted-foreground">
                  Real-Time System
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg transition-colors group",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 mt-0.5",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-accent-foreground"
                    )}
                  />
                  <div>
                    <div
                      className={cn(
                        "font-medium text-sm",
                        isActive ? "text-primary-foreground" : "text-foreground"
                      )}
                    >
                      {item.name}
                    </div>
                    <div
                      className={cn(
                        "text-xs",
                        isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: <FormattedTime /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;

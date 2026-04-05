"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bus,
  Users,
  UserCircle,
  Search,
  Plus,
  Phone,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { getFleetBuses, getFleetDrivers, getFleetConductors } from "@/lib/api";
import CreateBusModal from "@/components/CreateBusModal";
import EditBusModal from "@/components/EditBusModal";
import CreateDriverModal from "@/components/CreateDriverModal";
import EditDriverModal from "@/components/EditDriverModal";
import CreateConductorModal from "@/components/CreateConductorModal";
import EditConductorModal from "@/components/EditConductorModal";

export default function FleetManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);

  // Modal states
  const [isCreateBusOpen, setIsCreateBusOpen] = useState(false);
  const [isEditBusOpen, setIsEditBusOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);

  const [isCreateDriverOpen, setIsCreateDriverOpen] = useState(false);
  const [isEditDriverOpen, setIsEditDriverOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const [isCreateConductorOpen, setIsCreateConductorOpen] = useState(false);
  const [isEditConductorOpen, setIsEditConductorOpen] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [busesData, driversData, conductorsData] = await Promise.all([
        getFleetBuses(),
        getFleetDrivers(),
        getFleetConductors(),
      ]);
      setBuses(Array.isArray(busesData) ? busesData : busesData?.buses || []);
      setDrivers(Array.isArray(driversData) ? driversData : driversData?.drivers || []);
      setConductors(Array.isArray(conductorsData) ? conductorsData : conductorsData?.conductors || []);
    } catch (err) {
      console.error("Failed to fetch fleet data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter Logic
  const filterData = (data, type) => {
    if (!data) return [];
    const query = searchQuery.toLowerCase();

    return data.filter((item) => {
      if (type === "bus") {
        return (
          item.bus_id.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query)
        );
      } else {
        return (
          item.name.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
          (type === "driver" ? item.driver_id : item.conductor_id)
            .toLowerCase()
            .includes(query)
        );
      }
    });
  };

  const filteredBuses = filterData(buses, "bus");
  const filteredDrivers = filterData(drivers, "driver");
  const filteredConductors = filterData(conductors, "conductor");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fleet Management</h1>
          <p className="text-muted-foreground">
            Manage buses, drivers, and conductors
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateBusOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Bus
          </Button>
          <Button onClick={() => setIsCreateDriverOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Driver
          </Button>
          <Button onClick={() => setIsCreateConductorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Conductor
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CreateBusModal
        isOpen={isCreateBusOpen}
        onClose={() => setIsCreateBusOpen(false)}
        onSuccess={fetchData}
      />
      <EditBusModal
        isOpen={isEditBusOpen}
        onClose={() => setIsEditBusOpen(false)}
        bus={selectedBus}
        drivers={drivers}
        conductors={conductors}
        onSuccess={fetchData}
      />
      <CreateDriverModal
        isOpen={isCreateDriverOpen}
        onClose={() => setIsCreateDriverOpen(false)}
        onSuccess={fetchData}
      />
      <EditDriverModal
        isOpen={isEditDriverOpen}
        onClose={() => setIsEditDriverOpen(false)}
        driver={selectedDriver}
        onSuccess={fetchData}
      />
      <CreateConductorModal
        isOpen={isCreateConductorOpen}
        onClose={() => setIsCreateConductorOpen(false)}
        onSuccess={fetchData}
      />
      <EditConductorModal
        isOpen={isEditConductorOpen}
        onClose={() => setIsEditConductorOpen(false)}
        conductor={selectedConductor}
        onSuccess={fetchData}
      />

      {/* Search */}
      <div className="flex items-center space-x-2 bg-background p-1 rounded-lg border w-full max-w-md">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Search fleet..."
          className="border-0 focus-visible:ring-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="buses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="buses" className="flex items-center gap-2">
            <Bus className="h-4 w-4" />
            Buses
            <Badge variant="secondary" className="ml-1">
              {buses.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Drivers
            <Badge variant="secondary" className="ml-1">
              {drivers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="conductors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Conductors
            <Badge variant="secondary" className="ml-1">
              {conductors.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* BUSES TAB */}
        <TabsContent value="buses">
          <Card>
            <CardHeader>
              <CardTitle>Bus Fleet</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredBuses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bus className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No buses found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBuses.map((bus) => (
                    <div
                      key={bus.bus_id}
                      className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bus className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{bus.bus_id}</h3>
                            <p className="text-xs text-muted-foreground">
                              {bus.type}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            bus.status === "active" ? "default" : "secondary"
                          }
                        >
                          {bus.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm mt-4">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Capacity</span>
                          <span className="text-foreground font-medium">
                            {bus.capacity} Seats
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>Last Seen</span>
                          <span className="text-foreground font-medium">
                            {bus.last_seen
                              ? new Date(bus.last_seen).toLocaleString()
                              : "Never"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => {
                          setSelectedBus(bus);
                          setIsEditBusOpen(true);
                        }}
                      >
                        Edit Bus
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DRIVERS TAB */}
        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle>Drivers Directory</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDrivers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No drivers found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDrivers.map((driver) => (
                    <div
                      key={driver.driver_id}
                      className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserCircle className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{driver.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              ID: {driver.driver_id}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            driver.status === "On Duty" ? "default" : "secondary"
                          }
                          className={
                            driver.status === "On Duty"
                              ? "bg-green-500 hover:bg-green-600"
                              : ""
                          }
                        >
                          {driver.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm mt-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="h-3 w-3" />
                          <span>{driver.license_no}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{driver.phone}</span>
                        </div>
                        {driver.current_bus && (
                          <div className="flex items-center gap-2 text-primary mt-2 pt-2 border-t">
                            <Bus className="h-3 w-3" />
                            <span className="font-medium">
                              Driving: {driver.current_bus}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setIsEditDriverOpen(true);
                        }}
                      >
                        Edit Driver
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONDUCTORS TAB */}
        <TabsContent value="conductors">
          <Card>
            <CardHeader>
              <CardTitle>Conductors Directory</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredConductors.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No conductors found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredConductors.map((conductor) => (
                    <div
                      key={conductor.conductor_id}
                      className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{conductor.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              ID: {conductor.conductor_id}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            conductor.status === "On Duty"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            conductor.status === "On Duty"
                              ? "bg-green-500 hover:bg-green-600"
                              : ""
                          }
                        >
                          {conductor.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm mt-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="h-3 w-3" />
                          <span>{conductor.license_no}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{conductor.phone}</span>
                        </div>
                        {conductor.current_bus && (
                          <div className="flex items-center gap-2 text-primary mt-2 pt-2 border-t">
                            <Bus className="h-3 w-3" />
                            <span className="font-medium">
                              On Bus: {conductor.current_bus}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => {
                          setSelectedConductor(conductor);
                          setIsEditConductorOpen(true);
                        }}
                      >
                        Edit Conductor
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { updateBus, deleteBus, assignCrew } from "@/lib/api";

export default function EditBusModal({ isOpen, onClose, bus, drivers = [], conductors = [], onSuccess }) {
  const [formData, setFormData] = useState({
    bus_id: "",
    type: "",
    capacity: "",
    status: "",
  });
  const [assignedDriver, setAssignedDriver] = useState("");
  const [assignedConductor, setAssignedConductor] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (bus) {
      setFormData({
        bus_id: bus.bus_id || "",
        type: bus.type || "AC Deluxe",
        capacity: bus.capacity?.toString() || "",
        status: bus.status || "active",
      });

      // Find currently assigned crew
      const driver = drivers.find(d => d.current_bus === bus.bus_id);
      const conductor = conductors.find(c => c.current_bus === bus.bus_id);

      setAssignedDriver(driver ? driver.driver_id : "none");
      setAssignedConductor(conductor ? conductor.conductor_id : "none");
    }
  }, [bus, drivers, conductors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Update basic bus info
      await updateBus(formData.bus_id, {
        type: formData.type,
        capacity: parseInt(formData.capacity),
        status: formData.status,
      });

      // 2. Assign crew if changed
      if (assignedDriver !== "none" || assignedConductor !== "none") {
        await assignCrew(
          formData.bus_id,
          assignedDriver === "none" ? null : assignedDriver,
          assignedConductor === "none" ? null : assignedConductor
        );
      } else {
        // Explicitly clear if both are none (optional, handled by nulls above)
        await assignCrew(formData.bus_id, null, null);
      }

      toast.success("Bus updated successfully");
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to update bus", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Bus</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bus_id">Bus ID</Label>
              <Input id="bus_id" value={formData.bus_id} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Bus Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC Deluxe">AC Deluxe</SelectItem>
                <SelectItem value="Super Deluxe">Super Deluxe</SelectItem>
                <SelectItem value="Ordinary">Ordinary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 border-t mt-4">
            <Label className="mb-2 block font-semibold text-sm">Crew Assignment</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver" className="text-xs text-muted-foreground">Driver</Label>
                <Select value={assignedDriver} onValueChange={setAssignedDriver}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- None --</SelectItem>
                    {drivers.map(d => (
                      <SelectItem key={d.driver_id} value={d.driver_id}>
                        {d.name} {d.current_bus && d.current_bus !== formData.bus_id ? `(On ${d.current_bus})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conductor" className="text-xs text-muted-foreground">Conductor</Label>
                <Select value={assignedConductor} onValueChange={setAssignedConductor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select conductor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- None --</SelectItem>
                    {conductors.map(c => (
                      <SelectItem key={c.conductor_id} value={c.conductor_id}>
                        {c.name} {c.current_bus && c.current_bus !== formData.bus_id ? `(On ${c.current_bus})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (confirm("Are you sure you want to delete this bus?")) {
                  try {
                    await deleteBus(bus.bus_id);
                    toast.success("Bus deleted successfully");
                    onClose();
                    onSuccess?.();
                  } catch (error) {
                    toast.error("Failed to delete bus");
                  }
                }
              }}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Bus
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


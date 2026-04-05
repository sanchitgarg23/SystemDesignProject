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
import { toast } from "sonner";
import { updateDriver, deleteDriver } from "@/lib/api";

export default function EditDriverModal({ isOpen, onClose, driver, onSuccess }) {
  const [formData, setFormData] = useState({
    driver_id: "",
    name: "",
    phone: "",
    license_no: "",
    status: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (driver) {
      setFormData({
        driver_id: driver.driver_id || "",
        name: driver.name || "",
        phone: driver.phone || "",
        license_no: driver.license_no || "",
        status: driver.status || "Off Duty",
      });
    }
  }, [driver]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateDriver(formData.driver_id, {
        name: formData.name,
        phone: formData.phone,
        license_no: formData.license_no,
        status: formData.status === "On Duty" ? "active" : "inactive",
      });

      toast.success("Driver updated successfully");
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to update driver", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Driver</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driver_id">Driver ID</Label>
            <Input id="driver_id" value={formData.driver_id} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license_no">License Number</Label>
            <Input
              id="license_no"
              value={formData.license_no}
              onChange={(e) =>
                setFormData({ ...formData, license_no: e.target.value })
              }
            />
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
                <SelectItem value="On Duty">On Duty</SelectItem>
                <SelectItem value="Off Duty">Off Duty</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (confirm("Are you sure you want to delete this driver?")) {
                  try {
                    await deleteDriver(driver.driver_id);
                    toast.success("Driver deleted successfully");
                    onClose();
                    onSuccess?.();
                  } catch (error) {
                    toast.error("Failed to delete driver");
                  }
                }
              }}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Driver
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


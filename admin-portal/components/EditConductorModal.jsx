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
import { updateConductor, deleteConductor } from "@/lib/api";

export default function EditConductorModal({ isOpen, onClose, conductor, onSuccess }) {
  const [formData, setFormData] = useState({
    conductor_id: "",
    name: "",
    phone: "",
    license_no: "",
    status: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (conductor) {
      setFormData({
        conductor_id: conductor.conductor_id || "",
        name: conductor.name || "",
        phone: conductor.phone || "",
        license_no: conductor.license_no || "",
        status: conductor.status || "Off Duty",
      });
    }
  }, [conductor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateConductor(formData.conductor_id, {
        name: formData.name,
        phone: formData.phone,
        license_no: formData.license_no,
        status: formData.status === "On Duty" ? "active" : "inactive",
      });

      toast.success("Conductor updated successfully");
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to update conductor", {
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
          <DialogTitle>Edit Conductor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="conductor_id">Conductor ID</Label>
            <Input id="conductor_id" value={formData.conductor_id} disabled />
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
                if (confirm("Are you sure you want to delete this conductor?")) {
                  try {
                    await deleteConductor(conductor.conductor_id);
                    toast.success("Conductor deleted successfully");
                    onClose();
                    onSuccess?.();
                  } catch (error) {
                    toast.error("Failed to delete conductor");
                  }
                }
              }}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Conductor
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


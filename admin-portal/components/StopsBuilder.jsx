"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, GripVertical } from "lucide-react";

export function StopsBuilder({ stops = [], onChange }) {
  const [newStopName, setNewStopName] = useState("");

  const addStop = () => {
    if (!newStopName.trim()) return;

    const newStop = {
      id: `stop-${Date.now()}`,
      name: newStopName.trim(),
      sequence: stops.length + 1,
    };

    onChange([...stops, newStop]);
    setNewStopName("");
  };

  const removeStop = (id) => {
    const updated = stops
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, sequence: idx + 1 }));
    onChange(updated);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addStop();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Enter stop name..."
          value={newStopName}
          onChange={(e) => setNewStopName(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button type="button" size="sm" onClick={addStop}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {stops.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {stops
            .sort((a, b) => a.sequence - b.sequence)
            .map((stop) => (
              <div
                key={stop.id}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {stop.sequence}
                </Badge>
                <span className="flex-1 text-sm">{stop.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => removeStop(stop.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
        </div>
      )}

      {stops.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add at least 2 stops to define the route
        </p>
      )}
    </div>
  );
}

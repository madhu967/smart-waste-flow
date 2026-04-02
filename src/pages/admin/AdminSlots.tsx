import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_TIME_SLOTS } from "@/constants/app";

const AdminSlots = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [slots, setSlots] = useState<
    Array<{ time: string; available: boolean }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  useEffect(() => {
    // Initialize slots based on selected date
    // In a real app, fetch from Firestore with date-based queries
    const initialSlots = AVAILABLE_TIME_SLOTS.map((time) => ({
      time,
      available: true, // Default to available
    }));
    setSlots(initialSlots);
  }, [selectedDate]);

  const handleToggleSlot = (index: number) => {
    setSlots((prev) => {
      const updated = [...prev];
      updated[index].available = !updated[index].available;
      return updated;
    });
    setSuccess(
      `Slot "${slots[index].time}" ${slots[index].available ? "disabled" : "enabled"}`,
    );
  };

  const handleAddSlot = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // In a real app, save slots to Firestore with date
      // For now, just show success
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccess("Slots updated successfully");
    } catch (err) {
      setError("Failed to update slots");
    } finally {
      setIsLoading(false);
    }
  };

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="pb-6 border-b">
            <h1 className="text-3xl font-bold text-foreground">Time Slots</h1>
            <p className="text-muted-foreground mt-1">
              Configure available pickup time slots for each day
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Select Date</CardTitle>
                <div className="w-48">
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() + i);
                        const dateStr = date.toISOString().split("T")[0];
                        return (
                          <SelectItem key={dateStr} value={dateStr}>
                            {date.toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">Total Slots</p>
                  <p className="text-3xl font-bold mt-2">{slots.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">Available</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {availableCount}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">Disabled</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {slots.length - availableCount}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Slots Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Time Slots</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {slots.map((slot, i) => (
                <motion.div
                  key={`${selectedDate}-${slot.time}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card-hover rounded-lg p-5 flex items-center justify-between border"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">
                        {slot.time}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs mt-1 ${
                          slot.available
                            ? "text-success border-success/30"
                            : "text-destructive border-destructive/30"
                        }`}
                      >
                        {slot.available ? "Available" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant={slot.available ? "outline" : "destructive"}
                    size="sm"
                    onClick={() => handleToggleSlot(i)}
                  >
                    {slot.available ? "Disable" : "Enable"}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleAddSlot}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              <strong>Note:</strong> These time slots are system-wide and
              available daily from 8:00 AM to 6:00 PM. You can disable specific
              slots if they are not available on certain dates. Disabled slots
              will not appear to users when booking spot pickups.
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSlots;


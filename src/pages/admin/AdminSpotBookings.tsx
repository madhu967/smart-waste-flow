import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, CalendarCheck, Calendar, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StatCard from "@/components/StatCard";
import {
  getPendingSpotPickups,
  updateSpotPickup,
  getCollectorsByRole,
  addTaskToCollector,
} from "@/services/firestoreService";
import { SpotPickup, Collector, User } from "@/types/database";
import { collection, getDoc, doc } from "firebase/firestore";
import { db } from "@/config/firebase";

const AdminSpotBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<
    (SpotPickup & { userName?: string; userPhone?: string })[]
  >([]);
  const [filteredBookings, setFilteredBookings] = useState<
    (SpotPickup & { userName?: string; userPhone?: string })[]
  >([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = bookings.filter(
      (b) =>
        b.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.userPhone?.includes(searchQuery) ||
        b.id?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredBookings(filtered);
  }, [searchQuery, bookings]);

  const fetchData = async () => {
    setIsFetching(true);
    setError(null);
    try {
      // Fetch spot collectors
      const collectorData = await getCollectorsByRole("spot_collector");
      setCollectors(collectorData);

      // Fetch pending bookings
      const bookingsData = await getPendingSpotPickups();

      // Fetch user details for each booking
      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          try {
            const userDoc = await getDoc(doc(db, "users", booking.userId));
            const userData = userDoc.data() as User | undefined;
            return {
              ...booking,
              userName: userData?.name || "Unknown",
              userPhone: userData?.phone || "-",
            };
          } catch {
            return {
              ...booking,
              userName: "Unknown",
              userPhone: "-",
            };
          }
        }),
      );

      setBookings(enrichedBookings);
      setFilteredBookings(enrichedBookings);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load bookings");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAssignCollector = async (
    bookingId: string,
    collectorId: string,
  ) => {
    setError(null);
    setSuccess(null);
    setIsAssigning(bookingId);

    try {
      // Get collector details
      const selectedCollector = collectors.find((c) => c.id === collectorId);

      // Update spot pickup with collector and status
      await updateSpotPickup(bookingId, {
        collectorId,
        collectorName: selectedCollector?.name || "Unknown",
        collectorPhone: selectedCollector?.phone || "",
        status: "assigned",
      });

      // Add task to collector
      await addTaskToCollector(collectorId, bookingId);

      setSuccess(
        `Booking assigned to ${selectedCollector?.name || "collector"}`,
      );

      // Remove from pending list
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setFilteredBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err: any) {
      setError(err.message || "Failed to assign collector");
    } finally {
      setIsAssigning(null);
    }
  };

  const pendingCount = bookings.length;
  const totalCount = bookings.length; // Since we only fetch pending

  const formatWaste = (booking: SpotPickup) => {
    const waste = [];
    if (booking.metalWaste) {
      waste.push(`${booking.metalWaste} metal`);
    }
    if (booking.nonMetalWaste) {
      waste.push(`${booking.nonMetalWaste} non-metal`);
    }
    return waste.length > 0 ? waste.join(", ") : "Not specified";
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate?.() || new Date(timestamp);
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="pb-6 border-b">
            <h1 className="text-3xl font-bold text-foreground">
              Spot Bookings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and assign spot pickup requests to collectors
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

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={CalendarCheck}
              label="Total Bookings"
              value={totalCount.toString()}
            />
            <StatCard
              icon={Calendar}
              label="Today"
              value={filteredBookings.length.toString()}
            />
            <StatCard
              icon={Clock}
              label="Pending"
              value={pendingCount.toString()}
            />
            <StatCard
              icon={CalendarCheck}
              label="Collectors"
              value={collectors.length.toString()}
            />
          </div>

          {/* Bookings Table */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Pending Spot Pickups</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, phone or ID..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isFetching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No bookings match your search"
                      : "No pending bookings at the moment"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          User Info
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Waste Details
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Date / Time
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Status
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Assign Collector
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((b, i) => (
                        <motion.tr
                          key={b.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-border/30 hover:bg-muted/20"
                        >
                          <td className="px-6 py-3">
                            <div className="text-sm font-medium text-foreground">
                              {b.userName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {b.userPhone}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-muted-foreground">
                            {formatWaste(b)}
                            {b.estimatedWeight && (
                              <div className="text-xs mt-1">
                                Est: {b.estimatedWeight} kg
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm text-muted-foreground">
                            <div>{formatDate(b.date)}</div>
                            <div className="text-xs">{b.timeSlot}</div>
                          </td>
                          <td className="px-6 py-3">
                            <Badge
                              variant="outline"
                              className="text-warning border-warning/30"
                            >
                              {b.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-3">
                            <Select
                              onValueChange={(collectorId) =>
                                handleAssignCollector(b.id, collectorId)
                              }
                              disabled={
                                isAssigning === b.id || collectors.length === 0
                              }
                            >
                              <SelectTrigger className="h-8 text-xs w-40">
                                <SelectValue
                                  placeholder={
                                    collectors.length === 0
                                      ? "No collectors"
                                      : "Assign..."
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {collectors.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isAssigning === b.id && (
                              <Loader2 className="w-3 h-3 animate-spin inline ml-2" />
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          {collectors.length === 0 && bookings.length > 0 && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertDescription className="text-yellow-800">
                <strong>Note:</strong> No spot collectors assigned yet. Please
                add spot collectors first in the Spot Collectors tab before
                assigning pickups.
              </AlertDescription>
            </Alert>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSpotBookings;

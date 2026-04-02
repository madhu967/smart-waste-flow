import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserNavbar from "@/components/UserNavbar";
import MapPlaceholder from "@/components/MapPlaceholder";
import LiveTracker from "@/components/LiveTracker";
import { CalendarDays, CheckCircle, Clock, Truck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { getWeeklyPickupsByUser, getUser } from "@/services/firestoreService";
import { WeeklyPickup, User } from "@/types/database";

const WeeklyPickupPage = () => {
  const { user } = useAuth();
  const [pickups, setPickups] = useState<WeeklyPickup[]>([]);
  const [collector, setCollector] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's weekly pickups
        const pickupData = await getWeeklyPickupsByUser(user.id);
        setPickups(pickupData);

        // Fetch assigned collector info if exists
        if (user.assignedWeeklyCollector) {
          const collectorData = await getUser(user.assignedWeeklyCollector);
          setCollector(collectorData);
        }
      } catch (err: any) {
        console.error("Failed to fetch pickup data:", err);
        setError("Failed to load pickup information");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <UserNavbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const nextPickupDate =
    pickups.length > 0 ? new Date(pickups[0].scheduledDate) : null;

  return (
    <div className="min-h-screen">
      <UserNavbar />

      {/* Notification banner */}
      <div className="gradient-primary">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2 text-primary-foreground text-sm font-medium">
          <Truck className="w-4 h-4" />
          Your next pickup is scheduled. Keep your waste ready by 8 AM.
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Weekly Pickup</h1>
          <p className="text-muted-foreground">
            Your automatic waste collection schedule
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Active Pickup Tracking */}
        {pickups.some(
          (p) => p.status === "in_transit" || p.trackingStatus === "live",
        ) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Live Tracking
              </h2>
              <Badge className="bg-green-100 text-green-800 animate-pulse">
                Live
              </Badge>
            </div>

            {pickups
              .filter(
                (p) => p.status === "in_transit" || p.trackingStatus === "live",
              )
              .map((pickup, index) => (
                <Card
                  key={pickup.id}
                  className="border-orange-200 bg-orange-50"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Collector En Route</span>
                      <Badge className="bg-green-100 text-green-800 animate-pulse">
                        Live
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {collector && pickup.collectorId && (
                      <LiveTracker
                        collectorId={pickup.collectorId}
                        userId={user?.id || ""}
                        collectorName={collector.name}
                        collectorPhone={collector.phone || ""}
                        userLocation={
                          user?.coordinates
                            ? {
                                lat: user.coordinates.latitude,
                                lng: user.coordinates.longitude,
                              }
                            : null
                        }
                        isCollector={false}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Schedule Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Schedule Info</CardTitle>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <CalendarDays className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Assigned Day
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.street?.includes("street1") ||
                      user?.street?.includes("street2") ||
                      user?.street?.includes("street3") ||
                      user?.street?.includes("street4") ||
                      user?.street?.includes("street5")
                        ? "Every Monday & Thursday"
                        : "Every Tuesday & Friday"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Time Slot
                    </p>
                    <p className="text-sm text-muted-foreground">
                      8:00 AM - 6:00 PM
                    </p>
                  </div>
                </div>

                {nextPickupDate && (
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Truck className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Next Pickup
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {nextPickupDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Collector Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Assigned Collector</CardTitle>
              </CardHeader>
              <CardContent>
                {collector ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="font-semibold text-foreground">
                        {collector.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {collector.email}
                      </p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Phone
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {collector.phone || "N/A"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-800 font-medium">
                        Collector Verified
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      No collector assigned yet. You will be notified once a
                      collector is assigned.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold text-foreground mb-3">
            Collector Route
          </h3>
          <MapPlaceholder
            label={
              collector ? `${collector.name} will visit you soon` : "Route map"
            }
            className="h-64"
          />
          <p className="text-sm text-muted-foreground mt-2">
            {collector
              ? "Estimated arrival: ~15 minutes"
              : "Waiting for collector assignment"}
          </p>
        </motion.div>

        {/* Pickup History */}
        {pickups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Pickup History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pickups.slice(0, 5).map((pickup) => (
                    <div
                      key={pickup.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-foreground">
                            {new Date(
                              pickup.scheduledDate,
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Status: {pickup.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WeeklyPickupPage;

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserNavbar from "@/components/UserNavbar";
import SimpleMapTracker from "@/components/SimpleMapTracker";
import {
  listenToActivePickupsForUser,
  getUser,
  updateSpotPickup,
} from "@/services/firestoreService";
import {
  listenToCollectorLocation,
  calculateDistance,
} from "@/services/locationService";
import { LiveLocation } from "@/services/locationService";
import { SpotPickup } from "@/types/database";
import {
  MapPin,
  Phone,
  Clock,
  Truck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Weight,
  DollarSign,
  Navigation,
  Package,
} from "lucide-react";
import { Unsubscribe } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PickupWithCollector extends SpotPickup {
  collectorInfo?: any;
  distance?: number;
  collectorLocation?: LiveLocation;
}

const TrackingPage = () => {
  const { user } = useAuth();
  const [pickups, setPicks] = useState<{
    active: SpotPickup[];
    completed: SpotPickup[];
    pending: SpotPickup[];
  }>({ active: [], completed: [], pending: [] });
  const [collectorData, setCollectorData] = useState<{ [key: string]: any }>(
    {},
  );
  const [collectorLocations, setCollectorLocations] = useState<{
    [key: string]: LiveLocation;
  }>({});
  const [distances, setDistances] = useState<{ [key: string]: number | null }>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [reachedPickups, setReachedPickups] = useState<Set<string>>(new Set());
  const [locationUnsubscribes, setLocationUnsubscribes] = useState<{
    [key: string]: Unsubscribe;
  }>({});

  // Listen to pickups
  useEffect(() => {
    if (!user?.id) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    const unsubscribe = listenToActivePickupsForUser(user.id, (data) => {
      setPicks(data);
      setLoading(false);

      // Load collector info for new pickups
      async function loadCollectorData() {
        const collectors: { [key: string]: any } = {};
        const allPickups = [...data.active, ...data.completed, ...data.pending];

        for (const pickup of allPickups) {
          if (
            pickup.collectorId &&
            !collectors[pickup.collectorId] &&
            !collectorData[pickup.collectorId]
          ) {
            try {
              const collector = await getUser(pickup.collectorId);
              if (collector) {
                collectors[pickup.collectorId] = collector;
              }
            } catch (err) {
              console.error("Failed to load collector:", err);
            }
          }
        }

        if (Object.keys(collectors).length > 0) {
          setCollectorData((prev) => ({
            ...prev,
            ...collectors,
          }));
        }
      }

      loadCollectorData();

      // Auto-select first active pickup
      if (data.active.length > 0 && !selectedPickup) {
        setSelectedPickup(data.active[0].id);
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Listen to collector locations for active pickups
  useEffect(() => {
    const newUnsubscribes: { [key: string]: Unsubscribe } = {};

    for (const pickup of pickups.active) {
      if (pickup.collectorId && !locationUnsubscribes[pickup.collectorId]) {
        const unsub = listenToCollectorLocation(
          pickup.collectorId,
          (location) => {
            setCollectorLocations((prev) => ({
              ...prev,
              [pickup.collectorId!]: location,
            }));
          },
        );
        newUnsubscribes[pickup.collectorId] = unsub;
      }
    }

    // Unsubscribe from collectors no longer in active pickups
    const activeCollectorIds = pickups.active
      .map((p) => p.collectorId)
      .filter(Boolean);
    Object.keys(locationUnsubscribes).forEach((collectorId) => {
      if (!activeCollectorIds.includes(collectorId)) {
        locationUnsubscribes[collectorId]();
      }
    });

    setLocationUnsubscribes((prev) => ({
      ...Object.fromEntries(
        Object.entries(prev).filter(([id]) => activeCollectorIds.includes(id)),
      ),
      ...newUnsubscribes,
    }));

    return () => {
      Object.values(newUnsubscribes).forEach((unsub) => unsub());
    };
  }, [pickups.active]);

  // Calculate distances
  useEffect(() => {
    if (!user?.coordinates) return;

    const newDistances: { [key: string]: number | null } = {};

    for (const [collectorId, location] of Object.entries(collectorLocations)) {
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        user.coordinates.latitude,
        user.coordinates.longitude,
      );
      newDistances[collectorId] = dist;
    }

    setDistances(newDistances);
  }, [collectorLocations, user?.coordinates]);

  // Load collector data for pending and completed pickups
  useEffect(() => {
    const loadMissingCollectorData = async () => {
      const collectors: { [key: string]: any } = {};
      const allPickups = [...pickups.completed, ...pickups.pending];

      for (const pickup of allPickups) {
        if (pickup.collectorId && !collectorData[pickup.collectorId]) {
          try {
            const collector = await getUser(pickup.collectorId);
            if (collector) {
              collectors[pickup.collectorId] = collector;
            }
          } catch (err) {
            console.error("Failed to load collector data:", err);
          }
        }
      }

      if (Object.keys(collectors).length > 0) {
        setCollectorData((prev) => ({
          ...prev,
          ...collectors,
        }));
      }
    };

    if (pickups.completed.length > 0 || pickups.pending.length > 0) {
      loadMissingCollectorData();
    }
  }, [pickups.completed, pickups.pending]);

  const handleReached = async (pickupId: string) => {
    setReachedPickups((prev) => new Set(prev).add(pickupId));
  };

  const handleCollectionComplete = async (pickupId: string) => {
    try {
      await updateSpotPickup(pickupId, {
        status: "completed" as const,
        trackingStatus: "completed" as const,
        completionTime: new Date(),
      });
    } catch (err) {
      console.error("Failed to complete pickup:", err);
      setError("Failed to mark pickup as completed");
    }
  };

  const currentPickup = [
    ...pickups.active,
    ...pickups.completed,
    ...pickups.pending,
  ].find((p) => p.id === selectedPickup);

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      in_transit: "bg-orange-100 text-orange-800 animate-pulse",
      arrived: "bg-purple-100 text-purple-800",
      in_progress: "bg-indigo-100 text-indigo-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getDistanceMessage = (distance: number | null | undefined) => {
    if (!distance) return "Loading...";
    if (distance < 0.05) return "🎉 Arriving now!";
    if (distance < 0.1) return "⏰ Almost here!";
    if (distance < 0.5) return "🚗 Very close";
    if (distance < 1) return "📍 On the way";
    if (distance < 2) return "🚚 Heading to you";
    return `📍 ${distance.toFixed(1)} km away`;
  };

  const getPickupTotal = (pickup: SpotPickup): number => {
    let total = 0;
    const metalPrices: { [key: string]: number } = {
      iron: 30,
      copper: 500,
      aluminum: 100,
      zinc: 60,
      steel: 40,
    };
    const plasticPrice = 15; // per kg

    // Calculate metal waste value
    if (pickup.metalWaste) {
      Object.entries(pickup.metalWaste).forEach(([type, amount]) => {
        if (amount && metalPrices[type]) {
          total += amount * metalPrices[type];
        }
      });
    }

    // Calculate non-metal waste value
    if (pickup.nonMetalWaste) {
      if (pickup.nonMetalWaste.plastic) {
        total += pickup.nonMetalWaste.plastic * plasticPrice;
      }
    }

    return total;
  };

  // Render empty state
  if (
    !loading &&
    pickups.active.length === 0 &&
    pickups.pending.length === 0 &&
    pickups.completed.length === 0
  ) {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                <h3 className="text-lg font-semibold text-foreground">
                  No Pickups Yet
                </h3>
                <p className="text-muted-foreground">
                  You don't have any waste pickups scheduled. Book one now!
                </p>
                <Button
                  className="mt-4"
                  onClick={() => (window.location.href = "/spot-pickup")}
                >
                  Book a Pickup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pickups</h1>
          <p className="text-muted-foreground">
            Track your waste pickups - active, pending, and completed
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Active ({pickups.active.length})
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Pending ({pickups.pending.length})
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Completed ({pickups.completed.length})
                </TabsTrigger>
              </TabsList>

              {/* Active Pickups Tab */}
              <TabsContent value="active" className="space-y-4">
                {pickups.active.length === 0 ? (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">
                        No active pickups
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Pickup List */}
                    <div className="lg:col-span-1 space-y-3">
                      <h3 className="font-semibold text-foreground">
                        Your Active Pickups
                      </h3>
                      <div className="space-y-2">
                        {pickups.active.map((pickup) => (
                          <motion.button
                            key={pickup.id}
                            onClick={() => setSelectedPickup(pickup.id)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                              selectedPickup === pickup.id
                                ? "border-primary bg-primary/5"
                                : "border-transparent bg-muted/50 hover:bg-muted"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate">
                                  {new Date(
                                    pickup.pickupDate,
                                  ).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {pickup.timeSlot}
                                </p>
                              </div>
                              <Badge
                                className={`flex-shrink-0 ${getStatusBadge(
                                  pickup.status,
                                )}`}
                              >
                                {pickup.status}
                              </Badge>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Pickup Details Panel */}
                    <div className="lg:col-span-2 space-y-4">
                      {currentPickup &&
                      pickups.active.includes(currentPickup) ? (
                        <>
                          {/* Collector Information */}
                          {currentPickup.collectorId &&
                            collectorData[currentPickup.collectorId] && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <Card className="border-green-200 bg-green-50">
                                  <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Truck className="w-5 h-5 text-green-600" />
                                        <span>Collector</span>
                                      </div>
                                      <Badge
                                        className={getStatusBadge(
                                          currentPickup.status,
                                        )}
                                      >
                                        {currentPickup.status === "in_transit"
                                          ? "🟢 Live"
                                          : "Active"}
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div>
                                      <p className="text-sm text-muted-foreground">
                                        Name
                                      </p>
                                      <p className="font-semibold text-foreground">
                                        {
                                          collectorData[
                                            currentPickup.collectorId
                                          ].name
                                        }
                                      </p>
                                    </div>

                                    <Button
                                      asChild
                                      className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                      <a
                                        href={`tel:${
                                          collectorData[
                                            currentPickup.collectorId
                                          ]?.phone
                                        }`}
                                      >
                                        <Phone className="w-4 h-4 mr-2" />
                                        Call Collector
                                      </a>
                                    </Button>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )}

                          {/* Live Location Tracking - Only Show During in_transit */}
                          {currentPickup.collectorId &&
                            currentPickup.status === "in_transit" && (
                              <SimpleMapTracker
                                collectorId={currentPickup.collectorId}
                                userLocation={
                                  currentPickup.coordinates
                                    ? {
                                        lat: currentPickup.coordinates.latitude,
                                        lng: currentPickup.coordinates
                                          .longitude,
                                      }
                                    : user?.coordinates
                                      ? {
                                          lat: user.coordinates.latitude,
                                          lng: user.coordinates.longitude,
                                        }
                                      : null
                                }
                                collectorName={
                                  collectorData[currentPickup.collectorId]
                                    ?.name || "Collector"
                                }
                                collectorPhone={
                                  collectorData[currentPickup.collectorId]
                                    ?.phone || ""
                                }
                              />
                            )}

                          {/* Collector Reached Message - Show when arrived/in_progress */}
                          {(currentPickup.status === "arrived" ||
                            currentPickup.status === "in_progress") && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              <Card className="border-green-400 bg-green-50 shadow-lg">
                                <CardContent className="py-8 space-y-4">
                                  <div className="flex items-center justify-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                                      <CheckCircle2 className="w-7 h-7 text-white" />
                                    </div>
                                    <p className="text-green-900 font-bold text-2xl">
                                      Collector Reached!
                                    </p>
                                  </div>
                                  <p className="text-green-800 text-center">
                                    The collector is currently completing the
                                    collection form with your waste details.
                                  </p>
                                  <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing collection...
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )}

                          {/* Collection Form Preview - Show ONLY during in_transit */}
                          {currentPickup.status === "in_transit" && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <Card className="border-blue-200 bg-blue-50">
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    Waste Collection Form
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <Alert className="bg-white border-blue-200">
                                    <AlertDescription className="text-blue-800 text-sm">
                                      The collector will fill in these details
                                      when they arrive and complete the
                                      collection.
                                    </AlertDescription>
                                  </Alert>

                                  {/* Waste Categories Preview */}
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-sm font-semibold text-foreground mb-3">
                                        Metal Waste Items
                                      </p>
                                      <div className="grid grid-cols-2 gap-2">
                                        {[
                                          "Iron",
                                          "Copper",
                                          "Aluminum",
                                          "Zinc",
                                          "Steel",
                                        ].map((item) => (
                                          <div
                                            key={item}
                                            className="p-2 bg-white rounded border border-blue-200 text-sm"
                                          >
                                            <p className="font-medium text-foreground">
                                              {item}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              — kg
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-sm font-semibold text-foreground mb-3">
                                        Non-Metal Waste Items
                                      </p>
                                      <div className="grid grid-cols-2 gap-2">
                                        {["Plastic", "Furniture", "Others"].map(
                                          (item) => (
                                            <div
                                              key={item}
                                              className="p-2 bg-white rounded border border-blue-200 text-sm"
                                            >
                                              <p className="font-medium text-foreground">
                                                {item}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                — kg
                                              </p>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>

                                    {/* Total Weight */}
                                    <div className="p-3 bg-white rounded-lg border border-blue-300 flex items-center justify-between">
                                      <p className="font-semibold text-foreground">
                                        Total Weight
                                      </p>
                                      <p className="text-lg font-bold text-primary">
                                        — kg
                                      </p>
                                    </div>

                                    {/* Total Amount */}
                                    <div className="p-3 bg-white rounded-lg border border-blue-300 flex items-center justify-between">
                                      <p className="font-semibold text-foreground">
                                        Amount to Earn
                                      </p>
                                      <p className="text-lg font-bold text-green-600">
                                        ₹ —
                                      </p>
                                    </div>
                                  </div>

                                  {/* Notes Field Preview */}
                                  <div>
                                    <p className="text-sm font-semibold text-foreground mb-2">
                                      Collector Notes
                                    </p>
                                    <div className="p-3 bg-white rounded border border-blue-200 text-sm text-muted-foreground italic min-h-20 flex items-center">
                                      (Collector will add notes here when
                                      collecting)
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )}

                          {/* Pickup Details */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">
                                  Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                  <Calendar className="w-5 h-5 text-primary" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Date
                                    </p>
                                    <p className="font-semibold text-foreground">
                                      {new Date(
                                        currentPickup.pickupDate,
                                      ).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                  <Clock className="w-5 h-5 text-primary" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Time Slot
                                    </p>
                                    <p className="font-semibold text-foreground">
                                      {currentPickup.timeSlot}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                  <MapPin className="w-5 h-5 text-primary" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Location
                                    </p>
                                    <p className="font-semibold text-foreground">
                                      {currentPickup.coordinates
                                        ? `${currentPickup.coordinates.latitude.toFixed(
                                            4,
                                          )}, ${currentPickup.coordinates.longitude.toFixed(
                                            4,
                                          )}`
                                        : "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </>
                      ) : (
                        <Card>
                          <CardContent className="py-8">
                            <p className="text-center text-muted-foreground">
                              Select a pickup to view details
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Pending Pickups Tab */}
              <TabsContent value="pending" className="space-y-4">
                {pickups.pending.length === 0 ? (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">
                        No pending pickups
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {pickups.pending.map((pickup) => (
                      <motion.div
                        key={pickup.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="border-yellow-200 bg-yellow-50">
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground">
                                  {new Date(
                                    pickup.pickupDate,
                                  ).toLocaleDateString()}
                                </h3>
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  Pending
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Time: {pickup.timeSlot}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Status: Waiting for collector assignment
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Completed Pickups Tab */}
              <TabsContent value="completed" className="space-y-4">
                {pickups.completed.length === 0 ? (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">
                        No completed pickups yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {pickups.completed.map((pickup) => (
                      <motion.div
                        key={pickup.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                          {/* Header */}
                          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                            <CardTitle className="flex items-center justify-between text-lg">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6" />
                                <span>Collection Completed</span>
                              </div>
                              <Badge className="bg-white text-green-700 text-xs">
                                ✓ Done
                              </Badge>
                            </CardTitle>
                          </CardHeader>

                          <CardContent className="pt-6 space-y-6">
                            {/* Collector Details */}
                            {pickup.collectorId && (
                              <div className="bg-white rounded-lg border border-green-200 p-4">
                                <p className="text-sm font-semibold text-green-900 mb-3">
                                  Collector Details
                                </p>
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {
                                      (collectorData[pickup.collectorId]
                                        ?.name ||
                                        pickup.collectorName ||
                                        "C")?.[0]
                                    }
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-foreground text-lg">
                                      {collectorData[pickup.collectorId]
                                        ?.name ||
                                        pickup.collectorName ||
                                        "Collector"}
                                    </p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Phone className="w-4 h-4" />
                                      {collectorData[pickup.collectorId]
                                        ?.phone ||
                                        pickup.collectorPhone ||
                                        "Contact not available"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Key Stats */}
                            <div className="grid grid-cols-2 gap-3">
                              {/* Weight */}
                              {pickup.estimatedWeight > 0 && (
                                <div className="p-4 bg-white rounded-lg border-2 border-blue-300 text-center">
                                  <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center justify-center gap-1">
                                    <Weight className="w-4 h-4 text-blue-600" />
                                    Total Weight
                                  </p>
                                  <p className="text-3xl font-bold text-blue-600">
                                    {pickup.estimatedWeight}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    kg
                                  </p>
                                </div>
                              )}

                              {/* Amount */}
                              {getPickupTotal(pickup) > 0 && (
                                <div className="p-4 bg-white rounded-lg border-2 border-green-300 text-center">
                                  <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center justify-center gap-1">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    Amount Earned
                                  </p>
                                  <p className="text-3xl font-bold text-green-600">
                                    ₹{getPickupTotal(pickup)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    paid
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Waste Items Collected */}
                            {(Object.values(pickup.metalWaste || {}).some(
                              (v) => v,
                            ) ||
                              Object.values(pickup.nonMetalWaste || {}).some(
                                (v) => v,
                              )) && (
                              <div className="bg-white rounded-lg border border-blue-200 p-4 space-y-4">
                                <p className="font-semibold text-foreground flex items-center gap-2">
                                  <Package className="w-5 h-5 text-blue-600" />
                                  Items Collected
                                </p>

                                {/* Metal Waste */}
                                {pickup.metalWaste &&
                                  Object.values(pickup.metalWaste).some(
                                    (v) => v,
                                  ) && (
                                    <div className="space-y-2">
                                      <p className="text-sm font-semibold text-blue-900 border-b border-blue-100 pb-2">
                                        🔧 Metal Waste
                                      </p>
                                      <div className="space-y-2 pl-2">
                                        {Object.entries(pickup.metalWaste).map(
                                          ([type, amount]) =>
                                            amount ? (
                                              <div
                                                key={type}
                                                className="flex items-center justify-between text-sm"
                                              >
                                                <span className="capitalize text-foreground font-medium">
                                                  • {type}
                                                </span>
                                                <span className="text-blue-600 font-bold">
                                                  {amount} kg
                                                </span>
                                              </div>
                                            ) : null,
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Non-Metal Waste */}
                                {pickup.nonMetalWaste &&
                                  Object.values(pickup.nonMetalWaste).some(
                                    (v) => v,
                                  ) && (
                                    <div className="space-y-2">
                                      <p className="text-sm font-semibold text-blue-900 border-b border-blue-100 pb-2">
                                        ♻️ Non-Metal Waste
                                      </p>
                                      <div className="space-y-2 pl-2">
                                        {Object.entries(
                                          pickup.nonMetalWaste,
                                        ).map(([type, amount]) =>
                                          amount ? (
                                            <div
                                              key={type}
                                              className="flex items-center justify-between text-sm"
                                            >
                                              <span className="capitalize text-foreground font-medium">
                                                • {type}
                                              </span>
                                              <span className="text-blue-600 font-bold">
                                                {amount} kg
                                              </span>
                                            </div>
                                          ) : null,
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}

                            {/* Collection Notes */}
                            {pickup.collectionDetails?.collectorNotes && (
                              <div className="bg-white rounded-lg border border-amber-200 p-4">
                                <p className="text-sm font-semibold text-amber-900 mb-2">
                                  📝 Collector Notes
                                </p>
                                <p className="text-sm text-foreground italic">
                                  {pickup.collectionDetails.collectorNotes}
                                </p>
                              </div>
                            )}

                            {/* Timeline */}
                            <div className="space-y-2 text-xs text-muted-foreground border-t border-green-200 pt-4">
                              {pickup.pickupDate && (
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Pickup Scheduled
                                  </span>
                                  <span className="font-semibold text-foreground">
                                    {new Date(
                                      pickup.pickupDate,
                                    ).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}{" "}
                                    {pickup.timeSlot}
                                  </span>
                                </div>
                              )}
                              {pickup.completionTime && (
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    Completed
                                  </span>
                                  <span className="font-semibold text-foreground">
                                    {new Date(
                                      pickup.completionTime,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}{" "}
                                    at{" "}
                                    {new Date(
                                      pickup.completionTime,
                                    ).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;

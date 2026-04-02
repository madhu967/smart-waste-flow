import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CollectorNavbar from "@/components/CollectorNavbar";
import MapPlaceholder from "@/components/MapPlaceholder";
import LiveTracker from "@/components/LiveTracker";
import CollectorTrackingPanel from "@/components/CollectorTrackingPanel";
import CollectionTaskTracker from "@/components/CollectionTaskTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Navigation,
  CheckCircle,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  DollarSign,
  Package,
  Video,
  VideoOff,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  getPendingSpotPickups,
  getSpotPickupsByCollector,
  updateSpotPickup,
  confirmArrival,
  completePickupTracking,
  createTransaction,
  updateWalletBalance,
  getWalletByUser,
} from "@/services/firestoreService";
import {
  startCollectorTracking,
  stopLocationTracking,
} from "@/services/locationService";

const SpotCollectorDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTaskTracker, setShowTaskTracker] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingUnsubscribe, setTrackingUnsubscribe] = useState<
    (() => void) | null
  >(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [formData, setFormData] = useState({
    weight: 0,
    amount: 0,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch pickups assigned to this collector
        const assignedSpots = await getSpotPickupsByCollector(user.id);
        console.log("Fetched bookings:", assignedSpots);
        setBookings(assignedSpots);
      } catch (err: any) {
        console.error("Failed to fetch bookings:", err);
        setError("Failed to load spot pickups");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user?.id]);

  // Filter and compute bookings data
  const pendingBookings = bookings.filter(
    (b) =>
      b.status === "pending" ||
      b.status === "assigned" ||
      b.status === "in_transit" ||
      b.status === "arrived",
  );
  const completedBookings = bookings.filter((b) => b.status === "completed");

  // Helper functions to get weight from both old and new formats
  const getWeight = (b: any) => {
    return b.collectionDetails?.weight || b.weight || b.estimatedWeight || 0;
  };

  const getAmount = (b: any) => {
    return b.collectionDetails?.totalPrice || b.amount || 0;
  };

  // Pre-fill form with booking details
  const prefillFormWithBooking = () => {
    if (!selected) return;
    const booking = bookings.find((b) => b.id === selected);
    if (booking) {
      const estimatedWeight = getWeight(booking);
      const estimatedAmount = getAmount(booking);

      setFormData({
        weight: estimatedWeight,
        amount: estimatedAmount,
        notes: "",
      });

      console.log("Form pre-filled with booking data:", {
        weight: estimatedWeight,
        amount: estimatedAmount,
        bookingId: selected,
      });
    }
  };

  const getCollectionDate = (b: any) => {
    return b.collectionDetails?.collectionDate || b.completedDate;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const displayBookings =
    tab === "pending" ? pendingBookings : completedBookings;

  const handleSubmit = async () => {
    if (!selected) return;

    try {
      setSubmitting(true);
      setError(null);

      console.log("Submitting collection data:", {
        selected,
        formData,
        userId: user?.id,
      });

      // Get the booking to find the user who booked it
      const booking = bookings.find((b) => b.id === selected);
      if (!booking) {
        setError("Booking not found");
        return;
      }

      const pickupUserId = booking.userId;
      const amount = parseFloat(formData.amount.toString()) || 0;

      console.log("Processing pickup completion:", {
        pickupId: selected,
        pickupUserId,
        amount,
        weight: formData.weight,
      });

      // Step 1: Get user's wallet first (needed for transaction)
      const userWallet = await getWalletByUser(pickupUserId);
      if (!userWallet) {
        setError("User wallet not found");
        console.error("Wallet not found for user:", pickupUserId);
        return;
      }

      console.log("User wallet found:", {
        walletId: userWallet.id,
        currentBalance: userWallet.balance,
      });

      // Step 2: Update the spot pickup with completed status
      await updateSpotPickup(selected, {
        status: "completed",
        collectionDetails: {
          images: [],
          collectorNotes: formData.notes,
          collectionDate: new Date(),
          totalPrice: amount,
          weight: formData.weight,
        },
        estimatedWeight: formData.weight,
      });

      console.log("SpotPickup updated with completed status");

      // Step 3: Create transaction for the user (they earn money)
      const transactionId = await createTransaction({
        userId: pickupUserId,
        type: "credit",
        amount: amount,
        pickupId: selected,
        pickupType: "spot",
        walletId: userWallet.id,
        description: `Spot pickup collection - ${formData.weight}kg`,
      });

      console.log("Transaction created:", {
        transactionId,
        amount,
        walletId: userWallet.id,
      });

      // Step 4: Update wallet balance using increment
      await updateWalletBalance(userWallet.id, amount);

      console.log("Wallet balance updated successfully:", {
        userId: pickupUserId,
        walletId: userWallet.id,
        amountAdded: amount,
        expectedNewBalance: userWallet.balance + amount,
      });

      setCompleted(true);
      setTimeout(() => {
        setCompleted(false);
        setSelected(null);
        setShowForm(false);
        setFormData({ weight: 0, amount: 0, notes: "" });
        setBookings((prev) => prev.filter((b) => b.id !== selected));
      }, 2000);
    } catch (err: any) {
      setError(`Failed to submit collection: ${err.message}`);
      console.error("Error in handleSubmit:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartTracking = async () => {
    if (!selected || !user?.id) return;

    try {
      setTrackingError(null);
      const booking = bookings.find((b) => b.id === selected);

      // Start collector tracking
      const unsubscribe = await startCollectorTracking(user.id, (error) => {
        if (error) {
          setTrackingError(error);
          console.error("Tracking error:", error);
        }
      });

      if (unsubscribe) {
        setTrackingUnsubscribe(() => unsubscribe);
        setIsTracking(true);
      }
    } catch (error) {
      setTrackingError("Failed to start tracking. Please try again.");
      console.error("Tracking error:", error);
    }
  };

  const handleStopTracking = async () => {
    if (trackingUnsubscribe) {
      stopLocationTracking(trackingUnsubscribe);
      setIsTracking(false);
      setTrackingUnsubscribe(null);
    }

    if (selected) {
      try {
        await completePickupTracking(selected, true);
      } catch (error) {
        console.error("Error completing tracking:", error);
      }
    }
  };

  const handleArrivalConfirm = async () => {
    if (!selected) return;

    try {
      await confirmArrival(selected, true);
    } catch (error) {
      setError("Failed to confirm arrival. Please try again.");
      console.error(error);
    }
  };

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      if (trackingUnsubscribe) {
        stopLocationTracking(trackingUnsubscribe);
      }
    };
  }, [trackingUnsubscribe]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <CollectorNavbar type="spot" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen">
        <CollectorNavbar type="spot" />
        <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Collection Complete!
            </h2>
            <p className="text-muted-foreground mt-2">
              Successfully recorded and wallet updated.
            </p>
          </motion.div>
          <Button
            variant="outline"
            onClick={() => {
              setCompleted(false);
              setSelected(null);
              setShowForm(false);
            }}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <CollectorNavbar type="spot" />

      {/* Banner */}
      <div className="gradient-primary">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2 text-primary-foreground text-sm font-medium">
          <Package className="w-4 h-4" />
          Complete spot pickups to earn additional income
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Spot Pickups</h1>
            <p className="text-muted-foreground">
              Your assigned on-demand collections
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary text-base px-4 py-2">
            {tab === "pending"
              ? pendingBookings.length
              : completedBookings.length}{" "}
            {tab === "pending" ? "Pending" : "Completed"}
          </Badge>
        </div>

        {/* Stats Card - Only completed count */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">
                Collections Completed
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {completedBookings.length}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bookings List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={tab === "pending" ? "default" : "outline"}
                onClick={() => setTab("pending")}
                size="sm"
              >
                Pending ({pendingBookings.length})
              </Button>
              <Button
                variant={tab === "completed" ? "default" : "outline"}
                onClick={() => setTab("completed")}
                size="sm"
              >
                Completed ({completedBookings.length})
              </Button>
            </div>

            {displayBookings.length > 0 ? (
              displayBookings.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 border rounded-lg transition-all ${
                    selected === b.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-foreground">
                      {b.userName || "User"}
                    </p>
                    <Badge
                      className={
                        tab === "pending"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          : "bg-green-100 text-green-800 hover:bg-green-100"
                      }
                    >
                      {tab === "pending" ? "Pending" : "Completed"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    📍 {b.coordinates?.latitude.toFixed(4)},{" "}
                    {b.coordinates?.longitude.toFixed(4)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(b.pickupDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {b.timeSlot}
                    </span>
                  </div>
                  {b.phoneNumber && (
                    <p className="text-sm text-muted-foreground mb-3">
                      📞 {b.phoneNumber}
                    </p>
                  )}

                  {tab === "completed" && (
                    <div className="mb-3 p-2 bg-blue-50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Collection Date:
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatDate(getCollectionDate(b) || "")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-muted-foreground">
                          Weight Collected:
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {getWeight(b)} kg
                        </span>
                      </div>
                    </div>
                  )}

                  {tab === "pending" && (
                    <Button
                      onClick={() => {
                        setSelected(b.id);
                        setShowTaskTracker(true);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      START Collection
                    </Button>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>
                  No {tab === "pending" ? "pending" : "completed"} spot pickups
                </p>
              </div>
            )}
          </motion.div>

          {/* Right Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {selected && showForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Collection Confirmation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* User's Booking Details */}
                    {selected && bookings.find((b) => b.id === selected) && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                        <p className="text-sm font-semibold text-blue-900">
                          User's Booking Details
                        </p>
                        {bookings.find((b) => b.id === selected)
                          ?.selectedCategories && (
                          <div>
                            <p className="text-xs text-blue-800 font-medium">
                              Waste Categories:
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {bookings
                                .find((b) => b.id === selected)
                                ?.selectedCategories?.map(
                                  (cat: any, idx: number) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {cat.categoryId}: {cat.amount} kg
                                    </Badge>
                                  ),
                                )}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-blue-800">
                          <span className="font-medium">
                            Estimated Weight:{" "}
                            {getWeight(bookings.find((b) => b.id === selected))}{" "}
                            kg
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">
                        Weight Collected (kg)
                      </label>
                      <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            weight: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">
                        Amount Paid (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            amount: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        rows={3}
                        placeholder="Any additional notes..."
                      />
                    </div>

                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        You earn: ₹{formData.amount.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowForm(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 bg-primary text-white hover:bg-primary/90"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        {submitting ? "Submitting..." : "Confirm Collection"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Completed Booking Details View */}
            {selected && tab === "completed" && !showForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {bookings.find((b) => b.id === selected) && (
                  <>
                    <Card className="border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
                      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Collection Completed
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-6">
                        {/* User Details */}
                        <div className="bg-white rounded-lg border border-green-200 p-4">
                          <p className="text-sm font-semibold text-green-900 mb-3">
                            User Details
                          </p>
                          <div>
                            <p className="font-semibold text-foreground text-lg">
                              {bookings.find((b) => b.id === selected)
                                ?.userName || "User"}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="w-4 h-4" />
                              {bookings.find((b) => b.id === selected)
                                ?.phoneNumber || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Key Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 bg-white rounded-lg border-2 border-blue-300 text-center">
                            <p className="text-xs text-muted-foreground font-semibold mb-2">
                              📦 Weight
                            </p>
                            <p className="text-3xl font-bold text-blue-600">
                              {getWeight(
                                bookings.find((b) => b.id === selected),
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              kg
                            </p>
                          </div>

                          <div className="p-4 bg-white rounded-lg border-2 border-green-300 text-center">
                            <p className="text-xs text-muted-foreground font-semibold mb-2">
                              💰 Amount
                            </p>
                            <p className="text-3xl font-bold text-green-600">
                              ₹
                              {bookings.find((b) => b.id === selected)
                                ?.collectionDetails?.totalPrice || 0}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              earned
                            </p>
                          </div>
                        </div>

                        {/* Collection Notes */}
                        {bookings.find((b) => b.id === selected)
                          ?.collectionDetails?.collectorNotes && (
                          <div className="bg-white rounded-lg border border-amber-200 p-4">
                            <p className="text-sm font-semibold text-amber-900 mb-2">
                              📝 Your Notes
                            </p>
                            <p className="text-sm text-foreground">
                              {
                                bookings.find((b) => b.id === selected)
                                  ?.collectionDetails?.collectorNotes
                              }
                            </p>
                          </div>
                        )}

                        {/* Collection Date */}
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                          <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Collection Date
                          </p>
                          <p className="font-semibold text-foreground">
                            {formatDate(
                              getCollectionDate(
                                bookings.find((b) => b.id === selected),
                              ) || "",
                            )}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Collection Task Tracker Modal */}
      {showTaskTracker && selected && (
        <CollectionTaskTracker
          taskId={selected}
          collectorId={user?.id || ""}
          collectorName={user?.name || "Collector"}
          userId={bookings.find((b) => b.id === selected)?.userId || ""}
          userName={bookings.find((b) => b.id === selected)?.userName || "User"}
          userPhone={bookings.find((b) => b.id === selected)?.phoneNumber || ""}
          userLocation={
            bookings.find((b) => b.id === selected)?.coordinates
              ? {
                  lat:
                    bookings.find((b) => b.id === selected)?.coordinates
                      ?.latitude || 0,
                  lng:
                    bookings.find((b) => b.id === selected)?.coordinates
                      ?.longitude || 0,
                }
              : null
          }
          onClose={() => {
            setShowTaskTracker(false);
            setSelected(null);
          }}
          onCompleted={() => {
            console.log(
              "Collection completed - closing tracker and showing form",
            );
            setShowTaskTracker(false);
            prefillFormWithBooking();
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
};

export default SpotCollectorDashboard;

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserNavbar from "@/components/UserNavbar";
import LiveTracker from "@/components/LiveTracker";
import UserCollectorTracker from "@/components/UserCollectorTracker";
import {
  createSpotPickup,
  listenToActivePickupsForUser,
  listenToActiveWasteCategories,
} from "@/services/firestoreService";
import {
  updateUserLocationOnce,
  startLocationTracking,
  stopLocationTracking,
} from "@/services/locationService";
import { WasteCategory } from "@/types/database";
import {
  MapPin,
  Calendar,
  Clock,
  Package,
  Loader2,
  CheckCircle,
  Navigation,
  Trash2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { Unsubscribe } from "firebase/firestore";

const SpotPickupPage = () => {
  const { user } = useAuth();

  // Waste categories state
  const [wasteCategories, setWasteCategories] = useState<WasteCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<
    { categoryId: string; amount: number }[]
  >([]);

  const [formData, setFormData] = useState({
    date: "",
    time: "8:00",
    phone: user?.phone || "",
    notes: "",
    latitude: 0,
    longitude: 0,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [activePickups, setActivePickups] = useState<any[]>([]);
  const [loadingActivePickups, setLoadingActivePickups] = useState(true);
  const [isShareLocation, setIsShareLocation] = useState(false);
  const [shareLocationLoading, setShareLocationLoading] = useState(false);
  const [locationShareUnsubscribe, setLocationShareUnsubscribe] =
    useState<Unsubscribe | null>(null);

  // Load waste categories
  useEffect(() => {
    const unsubscribe = listenToActiveWasteCategories((categories) => {
      setWasteCategories(categories);
      setLoadingCategories(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to active pickups in real-time
  useEffect(() => {
    if (!user?.id) {
      setLoadingActivePickups(false);
      return;
    }

    const unsubscribe = listenToActivePickupsForUser(user.id, (pickups) => {
      setActivePickups(pickups.active);
      setLoadingActivePickups(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const timeSlots = [
    "8:00",
    "9:00",
    "10:00",
    "11:00",
    "12:00",
    "1:00",
    "2:00",
    "3:00",
    "4:00",
    "5:00",
    "6:00",
  ];

  const getLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setGeoLoading(false);
      },
      (err) => {
        setError("Unable to get your location. Please enable location access.");
        setGeoLoading(false);
      },
    );
  };

  const handleStartShareLocation = async () => {
    if (!user?.id) {
      setError("You must be logged in");
      return;
    }

    try {
      setShareLocationLoading(true);
      setError(null);

      // Start continuous location sharing
      const unsubscribe = await startLocationTracking(user.id, (error) => {
        if (error) {
          setError(error);
          setIsShareLocation(false);
        }
      });

      if (unsubscribe) {
        setLocationShareUnsubscribe(() => unsubscribe);
        setIsShareLocation(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to start location sharing");
    } finally {
      setShareLocationLoading(false);
    }
  };

  const handleStopShareLocation = () => {
    if (locationShareUnsubscribe) {
      stopLocationTracking(locationShareUnsubscribe);
      setLocationShareUnsubscribe(null);
      setIsShareLocation(false);
    }
  };

  const handleUpdateLocationOnce = async () => {
    if (!user?.id) {
      setError("You must be logged in");
      return;
    }

    try {
      setGeoLoading(true);
      setError(null);
      await updateUserLocationOnce(user.id);
    } catch (err: any) {
      setError(err.message || "Failed to update location");
    } finally {
      setGeoLoading(false);
    }
  };

  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const existing = prev.find((c) => c.categoryId === categoryId);
      if (existing) {
        // Remove category
        return prev.filter((c) => c.categoryId !== categoryId);
      } else {
        // Add category with default amount 0
        return [...prev, { categoryId, amount: 0 }];
      }
    });
  };

  const handleCategoryAmountChange = (categoryId: string, amount: number) => {
    setSelectedCategories((prev) =>
      prev.map((c) => (c.categoryId === categoryId ? { ...c, amount } : c)),
    );
  };

  const getTotalWeight = () => {
    return selectedCategories.reduce((sum, item) => sum + item.amount, 0);
  };

  const getTotalAmount = () => {
    return selectedCategories.reduce((sum, item) => {
      const category = wasteCategories.find((c) => c.id === item.categoryId);
      return sum + (category ? category.pricePerKg * item.amount : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError("You must be logged in");
      return;
    }

    if (!formData.date) {
      setError("Please select a date");
      return;
    }

    if (formData.latitude === 0 && formData.longitude === 0) {
      setError("Please enable location or select a location");
      return;
    }

    if (selectedCategories.length === 0) {
      setError("Please select at least one waste category");
      return;
    }

    if (getTotalWeight() === 0) {
      setError("Please enter weight for at least one category");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Organize selected categories by type
      const metalWaste: { [key: string]: number } = {};
      const nonMetalWaste: { [key: string]: number } = {};

      for (const selected of selectedCategories) {
        const category = wasteCategories.find(
          (c) => c.id === selected.categoryId,
        );
        if (category && selected.amount > 0) {
          const categoryKey = category.name.toLowerCase();
          if (category.category === "metal") {
            metalWaste[categoryKey] = selected.amount;
          } else {
            nonMetalWaste[categoryKey] = selected.amount;
          }
        }
      }

      const spotPickupData = {
        userId: user.id,
        userName: user.name || "User",
        pickupDate: new Date(formData.date),
        timeSlot: formData.time,
        phoneNumber: formData.phone,
        coordinates: {
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
        status: "pending" as const,
        metalWaste,
        nonMetalWaste,
        estimatedWeight: getTotalWeight(),
        amount: getTotalAmount(), // IMPORTANT: Save the estimated amount
        selectedCategories: selectedCategories, // Save for admin to see details
      };

      await createSpotPickup(spotPickupData as any);
      setSuccess(true);
      setFormData({
        date: "",
        time: "8:00",
        phone: user?.phone || "",
        notes: "",
        latitude: 0,
        longitude: 0,
      });
      setSelectedCategories([]);

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error("Error creating spot pickup:", err);
      setError("Failed to book pickup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const thirtyDaysLater = new Date(tomorrow);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 29);
  const maxDate = thirtyDaysLater.toISOString().split("T")[0];

  return (
    <div className="min-h-screen">
      <UserNavbar />

      {/* Notification banner */}
      <div className="gradient-primary">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2 text-primary-foreground text-sm font-medium">
          <Package className="w-4 h-4" />
          Book a spot pickup anytime you have waste to dispose
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Active Pickups Section */}
        {loadingActivePickups ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : activePickups.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Live Tracking
              </h2>
              <Badge className="bg-orange-100 text-orange-800">
                {activePickups.length} Active
              </Badge>
            </div>

            {activePickups.map((pickup, index) => (
              <motion.div
                key={pickup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {pickup.collectorId && (
                  <UserCollectorTracker
                    collectorId={pickup.collectorId}
                    collectorName={pickup.collectorName || "Your Collector"}
                    collectorPhone={pickup.collectorPhone || ""}
                    userLocation={
                      user?.coordinates
                        ? {
                            lat: user.coordinates.latitude,
                            lng: user.coordinates.longitude,
                          }
                        : null
                    }
                    pickupId={pickup.id}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {/* Location Sharing Control */}
        {activePickups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  Location Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-white border-blue-200">
                  <AlertDescription className="text-blue-800 text-sm">
                    {isShareLocation
                      ? "Your location is being shared with the collector in real-time. They can see where you are."
                      : "Share your live location with the collector so they can navigate to you easily."}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  {!isShareLocation ? (
                    <>
                      <Button
                        onClick={handleStartShareLocation}
                        disabled={shareLocationLoading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                      >
                        {shareLocationLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4" />
                            Start Sharing Live Location
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleUpdateLocationOnce}
                        disabled={geoLoading}
                        variant="outline"
                        className="flex-1 gap-2"
                      >
                        {geoLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4" />
                            Update Once
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleStopShareLocation}
                      disabled={shareLocationLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700 gap-2"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Stop Sharing Location
                    </Button>
                  )}
                </div>

                {isShareLocation && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 border border-green-300 rounded-lg text-center"
                  >
                    <p className="text-sm font-semibold text-green-800">
                      ✓ Live location sharing active
                    </p>
                    <p className="text-xs text-green-700">
                      Your location updates automatically as you move
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Booking Form */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Spot Pickup</h1>
          <p className="text-muted-foreground">
            Request an on-demand waste collection
          </p>
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✓ Pickup scheduled successfully! A collector will contact you
                soon.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Book Your Spot Pickup</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      min={minDate}
                      max={maxDate}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  {/* Time Slot */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Preferred Time
                    </label>
                    <select
                      value={formData.time}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          time: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot} AM
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="10-digit phone number"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  {/* Waste Categories Selection */}
                  <div className="space-y-4">
                    <Label>Select Waste Categories *</Label>

                    {/* Loading State */}
                    {loadingCategories && (
                      <div className="flex items-center justify-center py-8 border rounded-lg bg-gray-50">
                        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                        <span className="text-muted-foreground">
                          Loading waste categories...
                        </span>
                      </div>
                    )}

                    {/* Empty State */}
                    {!loadingCategories && wasteCategories.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-amber-50">
                        <Trash2 className="w-12 h-12 text-amber-300 mb-3" />
                        <p className="text-center text-muted-foreground mb-2">
                          No waste categories available yet
                        </p>
                        <p className="text-center text-sm text-muted-foreground mb-4 max-w-sm">
                          The admin needs to add and activate waste categories
                          before you can book a pickup. Please check back soon!
                        </p>
                        {user?.role === "admin" && (
                          <p className="text-center text-sm text-blue-600 font-medium">
                            As admin, please go to Waste Categories management
                            to add categories.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Categories Grid */}
                    {!loadingCategories && wasteCategories.length > 0 && (
                      <div className="grid grid-cols-1 gap-3">
                        {wasteCategories.map((category) => {
                          const isSelected = selectedCategories.some(
                            (c) => c.categoryId === category.id,
                          );
                          const selectedItem = selectedCategories.find(
                            (c) => c.categoryId === category.id,
                          );

                          return (
                            <div key={category.id} className="space-y-2">
                              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                                <Checkbox
                                  id={`category-${category.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() =>
                                    handleToggleCategory(category.id)
                                  }
                                />
                                <label
                                  htmlFor={`category-${category.id}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="font-medium">
                                    {category.name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    ₹{category.pricePerKg}/kg
                                  </div>
                                </label>
                              </div>

                              {isSelected && (
                                <div className="pl-8 space-y-2">
                                  <Label
                                    htmlFor={`amount-${category.id}`}
                                    className="text-sm"
                                  >
                                    Weight (kg)
                                  </Label>
                                  <Input
                                    id={`amount-${category.id}`}
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={selectedItem?.amount || 0}
                                    onChange={(e) =>
                                      handleCategoryAmountChange(
                                        category.id,
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    placeholder="Enter weight in kg"
                                  />
                                  {selectedItem && selectedItem.amount > 0 && (
                                    <p className="text-sm text-gray-600">
                                      Amount: ₹
                                      {(
                                        category.pricePerKg *
                                        selectedItem.amount
                                      ).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Summary */}
                    {selectedCategories.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                        <p className="text-sm font-medium">Summary:</p>
                        <div className="flex justify-between text-sm">
                          <span>Total Weight:</span>
                          <span className="font-medium">
                            {getTotalWeight().toFixed(2)} kg
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Amount:</span>
                          <span className="font-medium">
                            ₹{getTotalAmount().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Pickup Location
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={getLocation}
                        disabled={geoLoading}
                        variant="outline"
                        className="flex-1"
                      >
                        {geoLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <MapPin className="w-4 h-4 mr-2" />
                        )}
                        Get My Location
                      </Button>
                    </div>
                    {formData.latitude > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ Location captured ({formData.latitude.toFixed(4)},
                        {formData.longitude.toFixed(4)})
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="e.g., Gate is locked, call when you arrive"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white hover:bg-primary/90"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {loading ? "Booking..." : "Book Spot Pickup"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="text-primary font-bold">1</span>
                  <p>Select waste category and book your date</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">2</span>
                  <p>Share your location and contact details</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">3</span>
                  <p>A collector will confirm within 1 hour</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">4</span>
                  <p>Pay via wallet at time of pickup</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Organic Waste</span>
                  <span className="font-semibold">₹50/kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Inorganic Waste</span>
                  <span className="font-semibold">₹30/kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Recyclables</span>
                  <span className="font-semibold">₹60/kg</span>
                </div>
                <div className="flex justify-between">
                  <span>E-Waste</span>
                  <span className="font-semibold">₹100/unit</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotPickupPage;

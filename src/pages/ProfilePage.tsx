import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserNavbar from "@/components/UserNavbar";
import {
  updateUser,
  getWeeklyPickupsByUser,
  getSpotPickupsByUser,
} from "@/services/firestoreService";
import { WeeklyPickup } from "@/types/database";
import {
  Loader2,
  User as UserIcon,
  MapPin,
  MapPinned,
  Calendar,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { isValidPhoneNumber } from "@/utils/authUtils";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [weeklyPickup, setWeeklyPickup] = useState<WeeklyPickup | null>(null);
  const [spotPickups, setSpotPickups] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    street: "",
    address: "",
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        city: user.city,
        street: user.street,
        address: user.address,
      });

      // Fetch weekly pickup info and spot pickups
      fetchWeeklyPickup();
      fetchSpotPickups();
    }
  }, [user]);

  const fetchWeeklyPickup = async () => {
    if (!user) return;
    setIsFetching(true);
    try {
      const pickups = await getWeeklyPickupsByUser(user.id);
      if (pickups.length > 0) {
        setWeeklyPickup(pickups[0]);
      }
    } catch (err) {
      console.error("Failed to fetch weekly pickup:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchSpotPickups = async () => {
    if (!user) return;
    try {
      const pickups = await getSpotPickupsByUser(user.id);
      setSpotPickups(pickups);
    } catch (err) {
      console.error("Failed to fetch spot pickups:", err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setSuccess(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (formData.name.length < 2) {
      setError("Name must be at least 2 characters");
      return false;
    }
    if (!formData.address.trim()) {
      setError("Address is required");
      return false;
    }
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      setError("Please enter a valid 10-digit phone number");
      return false;
    }
    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateForm() || !user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUser(user.id, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      });
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4 pb-6 border-b">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                {user.name}
              </h1>
              <p className="text-muted-foreground">
                {user.role === "user" ? "Regular User" : user.role}
              </p>
            </div>
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

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="pickup">Weekly Pickup</TabsTrigger>
              <TabsTrigger value="spot">Spot Pickups</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Manage your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isEditing ? (
                    // View Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Full Name
                          </Label>
                          <p className="text-lg font-semibold mt-1">
                            {user.name}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Email
                          </Label>
                          <p className="text-lg font-semibold mt-1">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Phone Number
                        </Label>
                        <p className="text-lg font-semibold mt-1">
                          {user.phone || "Not provided"}
                        </p>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Account Type
                        </Label>
                        <p className="text-lg font-semibold mt-1 capitalize">
                          {user.role === "user" ? "Regular User" : user.role}
                        </p>
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="w-full"
                        >
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">
                            Email (Cannot be changed)
                          </Label>
                          <Input
                            id="email"
                            value={formData.email}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="10-digit mobile number"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          disabled={isLoading}
                        />
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveChanges}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle>Location Information</CardTitle>
                  <CardDescription>
                    Your residential address and assigned street
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isEditing ? (
                    // View Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            City
                          </Label>
                          <p className="text-lg font-semibold mt-1">
                            {user.city}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Street
                          </Label>
                          <p className="text-lg font-semibold mt-1 capitalize">
                            {user.street}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground flex items-center gap-2">
                          <MapPinned className="w-4 h-4" />
                          Full Address
                        </Label>
                        <p className="text-lg font-semibold mt-1">
                          {user.address}
                        </p>
                      </div>

                      {user.coordinates && (
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">
                            Live Coordinates
                          </p>
                          <p className="text-sm font-mono">
                            Lat: {user.coordinates.latitude.toFixed(4)}, Lng:{" "}
                            {user.coordinates.longitude.toFixed(4)}
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="w-full"
                        >
                          Edit Address
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Full Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) =>
                            handleInputChange("address", e.target.value)
                          }
                          disabled={isLoading}
                          placeholder="House no, Building name, Street"
                        />
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveChanges}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Weekly Pickup Tab */}
            <TabsContent value="pickup">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Pickup Schedule</CardTitle>
                  <CardDescription>
                    Your assigned waste collection day based on your street
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isFetching ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : weeklyPickup ? (
                    <div className="space-y-4">
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                        <div className="flex items-center gap-4">
                          <Calendar className="w-8 h-8 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Collection Day
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                              {weeklyPickup.pickupDay}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Assigned Street
                          </Label>
                          <p className="text-lg font-semibold mt-1 capitalize">
                            {weeklyPickup.street}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Status
                          </Label>
                          <p className="text-lg font-semibold mt-1 capitalize">
                            {weeklyPickup.status}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Next Pickup Date
                        </Label>
                        <p className="text-lg font-semibold mt-1">
                          {new Date(
                            weeklyPickup.nextPickupDate,
                          ).toLocaleDateString("en-IN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Tip:</strong> Make sure your waste is ready
                          by 9:00 AM on your collection day. The collector will
                          pick it up between 9:00 AM and 6:00 PM.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No weekly pickup assigned yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Spot Pickups Tab */}
            <TabsContent value="spot">
              <Card>
                <CardHeader>
                  <CardTitle>Spot Pickups & Earnings</CardTitle>
                  <CardDescription>
                    Your on-demand pickups and earnings from waste disposal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {spotPickups.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium">
                            Total Earnings from Spot Pickups
                          </p>
                          <p className="text-3xl font-bold text-green-900">
                            ₹
                            {spotPickups
                              .filter((p) => p.status === "completed")
                              .reduce(
                                (sum, p) =>
                                  sum +
                                  (p.amount ||
                                    p.collectionDetails?.totalPrice ||
                                    0),
                                0,
                              )
                              .toFixed(2)}
                          </p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
                      </div>
                    </div>
                  )}

                  {spotPickups.length > 0 ? (
                    <div className="space-y-3">
                      {spotPickups.map((pickup, index) => (
                        <motion.div
                          key={pickup.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  pickup.status === "completed"
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <p className="font-semibold text-foreground">
                                {pickup.status === "completed"
                                  ? "Completed"
                                  : "Pending"}
                              </p>
                            </div>
                            {pickup.status === "completed" && (
                              <span className="text-lg font-bold text-green-600">
                                ₹
                                {(
                                  pickup.amount ||
                                  pickup.collectionDetails?.totalPrice ||
                                  0
                                ).toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">
                                Booked Date
                              </p>
                              <p className="font-semibold text-foreground">
                                {new Date(pickup.createdAt).toLocaleDateString(
                                  "en-IN",
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Scheduled</p>
                              <p className="font-semibold text-foreground">
                                {new Date(pickup.pickupDate).toLocaleDateString(
                                  "en-IN",
                                )}{" "}
                                {pickup.timeSlot}
                              </p>
                            </div>
                          </div>

                          {pickup.status === "completed" && (
                            <div className="grid grid-cols-2 gap-3 text-sm mt-3 pt-3 border-t">
                              <div>
                                <p className="text-muted-foreground">
                                  Weight Collected
                                </p>
                                <p className="font-semibold text-foreground">
                                  {pickup.weight ||
                                    pickup.estimatedWeight ||
                                    "N/A"}{" "}
                                  kg
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Completed
                                </p>
                                <p className="font-semibold text-foreground">
                                  {pickup.completedDate
                                    ? new Date(
                                        pickup.completedDate,
                                      ).toLocaleDateString("en-IN")
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">
                        No spot pickups yet.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Book a pickup to start earning!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full"
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;

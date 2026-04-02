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
import { getCollectorsByRole } from "@/services/firestoreService";
import { createCollectorAccount } from "@/services/authService";
import { Collector } from "@/types/database";
import { Loader2, Plus, Trash2, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { isValidEmail, isValidPhoneNumber } from "@/utils/authUtils";

const AdminSpotCollectors = () => {
  const { user } = useAuth();
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  useEffect(() => {
    fetchCollectors();
  }, []);

  const fetchCollectors = async () => {
    setIsFetching(true);
    try {
      const data = await getCollectorsByRole("spot_collector");
      setCollectors(data);
    } catch (err) {
      console.error("Failed to fetch collectors:", err);
      setError("Failed to load collectors");
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!isValidEmail(formData.email)) {
      setError("Valid email is required");
      return false;
    }
    if (!isValidPhoneNumber(formData.phone)) {
      setError("Valid 10-digit phone number is required");
      return false;
    }
    if (!formData.password.trim()) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleAddCollector = async () => {
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await createCollectorAccount(
        formData.email,
        formData.password,
        formData.name,
        formData.phone,
        "spot_collector",
      );

      setCredentials({
        email: result.email,
        password: result.password,
      });
      setShowCredentials(true);
      setSuccess("Spot collector account created successfully!");
      setFormData({ name: "", email: "", phone: "", password: "" });
      setShowForm(false);
      await fetchCollectors();
    } catch (err: any) {
      console.error("Error creating collector account:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already in use");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use a stronger password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError(err.message || "Failed to add collector");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Spot Collectors
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your spot waste collection team
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Collector
            </Button>
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

          {/* Add Collector Form */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Spot Collector</CardTitle>
                <CardDescription>
                  Create a new spot waste collector account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Collector name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="collector@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="10-digit number"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        password: "",
                      });
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddCollector}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Collector"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Collectors List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Active Collectors</h2>
            {isFetching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : collectors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collectors.map((collector) => (
                  <Card key={collector.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="text-lg font-semibold">
                            {collector.name}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="text-sm text-foreground">
                            {collector.email}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="text-sm text-foreground">
                            {collector.phone}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Current Tasks
                          </p>
                          <p className="text-sm font-semibold">
                            {collector.currentTasks.length} active
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Collections
                          </p>
                          <p className="text-sm font-semibold">
                            {collector.totalCollections}
                          </p>
                        </div>

                        <div className="pt-4 border-t">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full gap-2"
                            disabled
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">
                    No spot collectors found. Add one to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Spot collectors are assigned to handle
                on-demand waste pickups. You can have up to 2 spot collectors.
                Currently you have <strong>{collectors.length}/2</strong>.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Credentials Modal */}
      {showCredentials && credentials && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Collector Account Created
                </h2>
                <p className="text-muted-foreground mt-2">
                  Share these credentials with the collector
                </p>
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Email</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-white p-2 rounded border">
                      {credentials.email}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(credentials.email)}
                      className="h-10 w-10"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Password</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-white p-2 rounded border">
                      {credentials.password}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(credentials.password)}
                      className="h-10 w-10"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800 text-sm">
                  ⚠️ Save these credentials securely. The collector will need
                  them to sign in to the application.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => {
                  setShowCredentials(false);
                  setCredentials(null);
                }}
                className="w-full"
              >
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminSpotCollectors;

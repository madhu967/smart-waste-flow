import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CollectorNavbar from "@/components/CollectorNavbar";
import MapPlaceholder from "@/components/MapPlaceholder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Navigation,
  Upload,
  CheckCircle,
  Loader2,
  Users,
  MapPin,
  DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  getAllUsers,
  updateWeeklyPickup,
  createTransaction,
  updateWalletBalance,
  getWalletByUser,
} from "@/services/firestoreService";

const WeeklyCollectorDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    weight: 0,
    wasteType: "mixed",
    notes: "",
    amount: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id || !user?.assignedStreets) return;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch users assigned to collector's streets
        const allUsers = await getAllUsers("user");
        const usersList = allUsers.filter((u: any) =>
          user.assignedStreets?.some((s) => u.street?.includes(s)),
        );

        // Format as tasks
        const formattedTasks = usersList.map((u: any) => ({
          id: u.id,
          name: u.name,
          address: u.location || u.street,
          street: u.street,
          phone: u.phone,
          status: "pending",
        }));

        setTasks(formattedTasks);
      } catch (err: any) {
        console.error("Failed to fetch tasks:", err);
        setError("Failed to load collection tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user?.id, user?.assignedStreets]);

  // Pre-fill form with default collection values
  const prefillFormWithDefaults = () => {
    // Set reasonable defaults for weekly collection
    setFormData({
      weight: 10, // Default 10kg
      wasteType: "mixed",
      notes: "",
      amount: 500, // Default ₹500
    });

    console.log("Form pre-filled with default values for weekly pickup");
  };

  const handleSubmit = async () => {
    if (!selected) return;

    try {
      setSubmitting(true);
      setError(null);

      const selectedTask = tasks.find((t) => t.id === selected);
      if (!selectedTask) {
        setError("Task not found");
        return;
      }

      const pickupUserId = selectedTask.userId;
      const amount = parseFloat(formData.amount.toString()) || 0;

      console.log("Processing weekly pickup completion:", {
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

      // Step 2: Update the weekly pickup with completed status
      await updateWeeklyPickup(selected, {
        status: "completed",
        weight: formData.weight,
        wasteType: formData.wasteType,
        collectedBy: user?.id,
        collectionDate: new Date().toISOString(),
        notes: formData.notes,
        amount: formData.amount,
      });

      console.log("WeeklyPickup updated with completed status");

      // Step 3: Create transaction for the user (they earn money)
      const transactionId = await createTransaction({
        userId: pickupUserId,
        type: "credit",
        amount: amount,
        pickupId: selected,
        pickupType: "weekly",
        walletId: userWallet.id,
        description: `Weekly pickup collection - ${formData.weight}kg of ${formData.wasteType}`,
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

      // Update task status locally
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selected ? { ...t, status: "completed" } : t,
        ),
      );
      setShowForm(false);
      setFormData({ weight: 0, wasteType: "mixed", notes: "", amount: 0 });
      setSelected(null);
    } catch (err: any) {
      setError(`Failed to submit collection: ${err.message}`);
      console.error("Error in handleSubmit:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <CollectorNavbar type="weekly" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="min-h-screen">
      <CollectorNavbar type="weekly" />

      {/* Banner */}
      <div className="gradient-primary">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2 text-primary-foreground text-sm font-medium">
          <Users className="w-4 h-4" />
          Complete all collections to maximize your earnings
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Today's Route
            </h1>
            <p className="text-muted-foreground">
              Assigned Streets:{" "}
              {user?.assignedStreets?.join(", ") || "Loading..."}
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary text-base px-4 py-2">
            {pendingCount} Remaining
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {tasks.length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {completedCount}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Earnings Today
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ₹
                    {tasks
                      .filter((t) => t.status === "completed")
                      .reduce((sum, t) => sum + (t.amount || 0), 0)
                      .toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Tasks List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3"
          >
            <h3 className="font-semibold text-foreground mb-4">
              Collection Tasks
            </h3>
            {tasks.length > 0 ? (
              tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setSelected(task.id);
                    setShowForm(false);
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selected === task.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-muted hover:border-primary/50"
                  } ${
                    task.status === "completed" ? "bg-green-50 opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {task.name}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {task.address}
                      </p>
                      {task.phone && (
                        <p className="text-sm text-muted-foreground mt-1">
                          📞 {task.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {task.status === "completed" ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          ✓ Done
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Navigation className="w-4 h-4 text-primary" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tasks assigned today</p>
              </div>
            )}
          </motion.div>

          {/* Right Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {selected && !showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {tasks.find((t) => t.id === selected)?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MapPlaceholder
                      label={`Navigate to ${tasks.find((t) => t.id === selected)?.name}`}
                      className="h-48 mb-4"
                    />
                    <Button
                      onClick={() => {
                        prefillFormWithDefaults();
                        setShowForm(true);
                      }}
                      className="w-full bg-primary text-white hover:bg-primary/90"
                    >
                      Start Collection
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Collection Confirmation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                        Waste Type
                      </label>
                      <select
                        value={formData.wasteType}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            wasteType: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="mixed">Mixed</option>
                        <option value="organic">Organic</option>
                        <option value="inorganic">Inorganic</option>
                        <option value="recyclable">Recyclable</option>
                      </select>
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

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Earnings: ₹{formData.amount.toFixed(2)}
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCollectorDashboard;

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserNavbar from "@/components/UserNavbar";
import {
  getTransactionsByUser,
  getWalletByUser,
  getSpotPickupsByUser,
} from "@/services/firestoreService";
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Loader2,
  CheckCircle,
  Clock,
  User,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Wallet } from "@/types/database";
import { db } from "@/config/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const WalletPage = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [enrichedTransactions, setEnrichedTransactions] = useState<any[]>([]);
  const [spotPickups, setSpotPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch wallet
        const walletData = await getWalletByUser(user.id);
        setWallet(walletData);

        // Fetch transactions
        const txns = await getTransactionsByUser(user.id);
        setTransactions(txns);

        // Enrich transactions with pickup and collector details
        const enriched = await Promise.all(
          txns.map(async (txn: any) => {
            try {
              let pickupDetails = null;
              let collectorName = "Unknown Collector";

              // Fetch pickup details
              if (txn.pickupType === "spot") {
                const pickupDoc = await getDoc(
                  doc(db, "spotPickups", txn.pickupId),
                );
                if (pickupDoc.exists()) {
                  pickupDetails = pickupDoc.data();
                  // Fetch collector name
                  if (pickupDetails?.collectorId) {
                    const collectorDoc = await getDoc(
                      doc(db, "users", pickupDetails.collectorId),
                    );
                    if (collectorDoc.exists()) {
                      collectorName = collectorDoc.data().name || "Unknown";
                    }
                  }
                }
              } else if (txn.pickupType === "weekly") {
                const pickupDoc = await getDoc(
                  doc(db, "weeklyPickups", txn.pickupId),
                );
                if (pickupDoc.exists()) {
                  pickupDetails = pickupDoc.data();
                  // Fetch collector name
                  if (pickupDetails?.collectorId) {
                    const collectorDoc = await getDoc(
                      doc(db, "users", pickupDetails.collectorId),
                    );
                    if (collectorDoc.exists()) {
                      collectorName = collectorDoc.data().name || "Unknown";
                    }
                  }
                }
              }

              return {
                ...txn,
                pickupDetails,
                collectorName,
              };
            } catch (err) {
              console.error("Error enriching transaction:", err);
              return txn;
            }
          }),
        );

        setEnrichedTransactions(enriched);

        // Fetch spot pickups
        const pickups = await getSpotPickupsByUser(user.id);
        setSpotPickups(pickups);
      } catch (err: any) {
        console.error("Failed to fetch wallet data:", err);
        setError("Failed to load wallet information");
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

  const currentMonth = transactions.filter((t: any) => {
    const txDate = new Date(t.createdAt);
    const now = new Date();
    return (
      txDate.getMonth() === now.getMonth() &&
      txDate.getFullYear() === now.getFullYear()
    );
  });

  const earnings = transactions
    .filter((t: any) => t.type === "credit")
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  const expenses = transactions
    .filter((t: any) => t.type === "debit")
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  // Spot pickup helper functions
  const getAmount = (p: any) => {
    return p.collectionDetails?.totalPrice || p.amount || 0;
  };

  const getWeight = (p: any) => {
    return p.collectionDetails?.weight || p.weight || p.estimatedWeight || 0;
  };

  const getCollectionDate = (p: any) => {
    return p.collectionDetails?.collectionDate || p.completedDate;
  };

  const pendingSpotPickups = spotPickups.filter(
    (p) =>
      p.status === "pending" ||
      p.status === "assigned" ||
      p.status === "in_transit" ||
      p.status === "arrived",
  );

  const completedSpotPickups = spotPickups.filter(
    (p) => p.status === "completed",
  );

  const spotPickupEarnings = completedSpotPickups.reduce(
    (sum, p) => sum + getAmount(p),
    0,
  );

  const pendingAmount = pendingSpotPickups.reduce(
    (sum, p) => sum + (p.amount || 0),
    0,
  );

  return (
    <div className="min-h-screen">
      <UserNavbar />

      {/* Banner */}
      <div className="gradient-primary">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2 text-primary-foreground text-sm font-medium">
          <CreditCard className="w-4 h-4" />
          Your wallet is secured and ready for transactions
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Wallet</h1>
          <p className="text-muted-foreground">
            Manage your earnings from spot pickups
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Wallet Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-primary rounded-xl p-8 text-white"
        >
          <p className="text-sm opacity-90 mb-2">Available Balance</p>
          <h2 className="text-5xl font-bold mb-4">
            ₹{(wallet?.balance || 0).toFixed(2)}
          </h2>
          <div className="flex gap-4">
            <button className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg transition">
              Add Money
            </button>
            <button className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg transition">
              Withdraw
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Earned
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      ₹{spotPickupEarnings.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pending Amount
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      ₹{pendingAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Completed Pickups
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {completedSpotPickups.length}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Transactions & Pickups Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>History & Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="transactions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="transactions">
                    Transactions ({enrichedTransactions.length})
                  </TabsTrigger>
                  <TabsTrigger value="pickups">
                    Pickups ({spotPickups.length})
                  </TabsTrigger>
                </TabsList>

                {/* Transactions Tab */}
                <TabsContent value="transactions" className="space-y-3 mt-4">
                  {enrichedTransactions.length > 0 ? (
                    enrichedTransactions.map((txn: any, idx: number) => (
                      <motion.div
                        key={txn.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`border rounded-lg p-4 ${
                          txn.type === "credit"
                            ? "bg-green-50 hover:bg-green-100/50"
                            : "bg-red-50 hover:bg-red-100/50"
                        } transition`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                txn.type === "credit"
                                  ? "bg-green-100"
                                  : "bg-red-100"
                              }`}
                            >
                              {txn.type === "credit" ? (
                                <ArrowDownLeft
                                  className={`w-5 h-5 ${
                                    txn.type === "credit"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                />
                              ) : (
                                <ArrowUpRight className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {txn.type === "credit"
                                  ? "Earnings"
                                  : "Deduction"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {txn.pickupType === "spot"
                                  ? "Spot Pickup"
                                  : "Weekly Pickup"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-2xl font-bold ${
                                txn.type === "credit"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {txn.type === "credit" ? "+" : "-"}₹
                              {txn.amount?.toFixed(2) || "0.00"}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                txn.type === "credit"
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : "bg-red-100 text-red-800 border-red-300"
                              }`}
                            >
                              {txn.type === "credit" ? "Credit" : "Debit"}
                            </Badge>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div className="bg-white/60 rounded p-3">
                            <p className="text-muted-foreground text-xs font-medium">
                              COLLECTOR
                            </p>
                            <p className="font-semibold text-foreground flex items-center gap-2 mt-1">
                              <Truck className="w-4 h-4" />
                              {txn.collectorName}
                            </p>
                          </div>
                          <div className="bg-white/60 rounded p-3">
                            <p className="text-muted-foreground text-xs font-medium">
                              DATE & TIME
                            </p>
                            <p className="font-semibold text-foreground">
                              {new Date(txn.createdAt).toLocaleDateString(
                                "en-IN",
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(txn.createdAt).toLocaleTimeString(
                                "en-IN",
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Pickup Details */}
                        {txn.pickupDetails && (
                          <div className="bg-white/60 rounded p-3 mb-4 space-y-2">
                            <p className="text-muted-foreground text-xs font-medium">
                              PICKUP DETAILS
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="text-muted-foreground text-xs">
                                  Weight Collected
                                </span>
                                <p className="font-semibold text-foreground">
                                  {txn.pickupDetails?.collectionDetails
                                    ?.weight ||
                                    txn.pickupDetails?.weight ||
                                    txn.pickupDetails?.estimatedWeight ||
                                    "0"}{" "}
                                  kg
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-xs">
                                  Status
                                </span>
                                <Badge className="mt-1 text-xs">
                                  {txn.pickupDetails?.status ||
                                    txn.pickupDetails?.collectionDetails
                                      ?.status ||
                                    "N/A"}
                                </Badge>
                              </div>
                            </div>

                            {/* Waste Categories (for spot pickups) */}
                            {txn.pickupType === "spot" &&
                              txn.pickupDetails?.selectedCategories && (
                                <div>
                                  <span className="text-muted-foreground text-xs">
                                    WASTE CATEGORIES
                                  </span>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {Object.entries(
                                      txn.pickupDetails.selectedCategories,
                                    ).map(([catId, catData]: [string, any]) => (
                                      <Badge
                                        key={catId}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {catData.name}: {catData.amount} kg
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {/* Transaction ID */}
                        <div className="flex items-center justify-between border-t pt-3">
                          <span className="text-xs text-muted-foreground">
                            Transaction ID
                          </span>
                          <span className="text-xs font-mono text-foreground">
                            {txn.id?.slice(0, 8)}...
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No transactions yet</p>
                    </div>
                  )}
                </TabsContent>

                {/* Pickups Tab */}
                <TabsContent value="pickups" className="space-y-3 mt-4">
                  {spotPickups.length > 0 ? (
                    <Tabs defaultValue="pending" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">
                          Pending (
                          {
                            spotPickups.filter((p) =>
                              [
                                "pending",
                                "assigned",
                                "in_transit",
                                "arrived",
                              ].includes(p.status),
                            ).length
                          }
                          )
                        </TabsTrigger>
                        <TabsTrigger value="completed">
                          Completed (
                          {
                            spotPickups.filter((p) => p.status === "completed")
                              .length
                          }
                          )
                        </TabsTrigger>
                      </TabsList>

                      {/* Pending Pickups */}
                      <TabsContent value="pending" className="space-y-3 mt-4">
                        {spotPickups.filter((p) =>
                          [
                            "pending",
                            "assigned",
                            "in_transit",
                            "arrived",
                          ].includes(p.status),
                        ).length > 0 ? (
                          spotPickups
                            .filter((p) =>
                              [
                                "pending",
                                "assigned",
                                "in_transit",
                                "arrived",
                              ].includes(p.status),
                            )
                            .map((pickup, idx) => (
                              <motion.div
                                key={pickup.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="border rounded-lg p-4 hover:bg-muted/50 transition"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <p className="font-semibold text-foreground">
                                      Awaiting Collection
                                    </p>
                                  </div>
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                    {pickup.status}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                  <div>
                                    <p className="text-muted-foreground">
                                      Booked Date
                                    </p>
                                    <p className="font-semibold text-foreground">
                                      {new Date(
                                        pickup.createdAt,
                                      ).toLocaleDateString("en-IN")}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">
                                      Scheduled
                                    </p>
                                    <p className="font-semibold text-foreground">
                                      {new Date(
                                        pickup.pickupDate,
                                      ).toLocaleDateString("en-IN")}{" "}
                                      {pickup.timeSlot}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">
                                      Expected Amount
                                    </p>
                                    <p className="font-semibold text-foreground">
                                      ₹{pickup.amount || "TBD"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">
                                      Location
                                    </p>
                                    <p className="font-semibold text-foreground text-xs">
                                      {pickup.coordinates?.latitude.toFixed(2)},{" "}
                                      {pickup.coordinates?.longitude.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No pending pickups</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* Completed Pickups */}
                      <TabsContent value="completed" className="space-y-3 mt-4">
                        {spotPickups.filter((p) => p.status === "completed")
                          .length > 0 ? (
                          spotPickups
                            .filter((p) => p.status === "completed")
                            .map((pickup, idx) => (
                              <motion.div
                                key={pickup.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="border rounded-lg p-4 bg-green-50 hover:bg-green-100/50 transition"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <p className="font-semibold text-foreground">
                                      Collection Complete
                                    </p>
                                  </div>
                                  <Badge className="bg-green-200 text-green-800 hover:bg-green-200">
                                    Completed
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                  <div>
                                    <p className="text-muted-foreground">
                                      Booked Date
                                    </p>
                                    <p className="font-semibold text-foreground">
                                      {new Date(
                                        pickup.createdAt,
                                      ).toLocaleDateString("en-IN")}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">
                                      Collection Date
                                    </p>
                                    <p className="font-semibold text-foreground">
                                      {pickup.collectionDetails
                                        ?.collectionDate || pickup.completedDate
                                        ? new Date(
                                            pickup.collectionDetails
                                              ?.collectionDate ||
                                              pickup.completedDate,
                                          ).toLocaleDateString("en-IN")
                                        : "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">
                                      Weight Collected
                                    </p>
                                    <p className="font-semibold text-foreground">
                                      {pickup.collectionDetails?.weight ||
                                        pickup.weight ||
                                        pickup.estimatedWeight ||
                                        "0"}{" "}
                                      kg
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground font-medium">
                                      Amount Earned
                                    </p>
                                    <p className="font-bold text-green-600 text-lg">
                                      ₹
                                      {(
                                        pickup.collectionDetails?.totalPrice ||
                                        pickup.amount ||
                                        0
                                      ).toFixed(2)}
                                    </p>
                                  </div>
                                </div>

                                {pickup.collectionDetails?.collectorNotes && (
                                  <div className="bg-white rounded p-2 text-xs">
                                    <p className="text-muted-foreground">
                                      Collector Notes
                                    </p>
                                    <p className="text-foreground">
                                      {pickup.collectionDetails.collectorNotes}
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No completed pickups yet</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No spot pickups booked yet</p>
                      <p className="text-sm mt-2">
                        Book a pickup to start earning!
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default WalletPage;

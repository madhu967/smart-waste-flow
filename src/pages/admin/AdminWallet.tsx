import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Users,
  TrendingUp,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StatCard from "@/components/StatCard";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  Transaction,
  User,
  Wallet as WalletType,
  SpotPickup,
  WeeklyPickup,
} from "@/types/database";

const AdminWallet = () => {
  const { user } = useAuth();
  const [userWallets, setUserWallets] = useState<
    (WalletType & { userName?: string; userEmail?: string })[]
  >([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [pendingPickups, setPendingPickups] = useState<any[]>([]);
  const [userEarningsMap, setUserEarningsMap] = useState<Map<string, number>>(
    new Map(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalDisbursed: 0,
    thisMonth: 0,
    avgPerUser: 0,
    activeWallets: 0,
    totalUsers: 0,
    totalEarned: 0,
  });
  const [activeTab, setActiveTab] = useState<
    "overview" | "wallets" | "transactions" | "pending"
  >("overview");

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  useEffect(() => {
    fetchAllWalletData();
  }, []);

  useEffect(() => {
    const filtered = transactions.filter(
      (t) =>
        t.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredTransactions(filtered);
  }, [searchQuery, transactions]);

  const fetchAllWalletData = async () => {
    setIsFetching(true);
    setError(null);
    try {
      // Fetch all users
      const usersRef = collection(db, "users");
      const usersSnap = await getDocs(usersRef);
      const usersMap = new Map();
      usersSnap.docs.forEach((doc) => {
        usersMap.set(doc.id, doc.data());
      });
      console.log("Users fetched:", usersMap.size);

      // Fetch all wallets with user details
      const walletsRef = collection(db, "wallets");
      const walletsSnap = await getDocs(walletsRef);
      const walletsData = walletsSnap.docs.map((doc) => {
        const data = doc.data() as WalletType;
        const userData = usersMap.get(data.userId);
        console.log("Wallet:", {
          id: doc.id,
          balance: data.balance,
          totalEarnings: data.totalEarnings,
          userId: data.userId,
        });
        return {
          ...data,
          id: doc.id,
          userName: userData?.name || "Unknown User",
          userEmail: userData?.email || "-",
          balance: data.balance || 0,
          totalEarnings: data.totalEarnings || 0,
        };
      });
      console.log("Wallets fetched:", walletsData);
      setUserWallets(walletsData);

      // Fetch all transactions
      const transactionsRef = collection(db, "transactions");
      const transactionsSnap = await getDocs(transactionsRef);
      console.log("Total transactions found:", transactionsSnap.size);

      const transactionsData = await Promise.all(
        transactionsSnap.docs.map(async (doc) => {
          const txData = doc.data() as Transaction;
          let pickupDetails: any = null;
          let userName = "Unknown";
          let collectorName = "Unknown";

          console.log("Processing transaction:", {
            id: doc.id,
            userId: txData.userId,
            amount: txData.amount,
            type: txData.type,
          });

          // Fetch pickup details
          if (txData.pickupId && txData.pickupType === "spot") {
            try {
              const pickupDoc = await getDoc(
                doc(db, "spotPickups", txData.pickupId),
              );
              if (pickupDoc.exists()) {
                pickupDetails = pickupDoc.data();
              }
            } catch (e) {
              console.error("Error fetching pickup:", e);
            }
          } else if (txData.pickupId && txData.pickupType === "weekly") {
            try {
              const pickupDoc = await getDoc(
                doc(db, "weeklyPickups", txData.pickupId),
              );
              if (pickupDoc.exists()) {
                pickupDetails = pickupDoc.data();
              }
            } catch (e) {
              console.error("Error fetching weekly pickup:", e);
            }
          }

          // Get user name
          const userData = usersMap.get(txData.userId);
          if (userData) userName = userData.name;

          // Get collector name from pickup details
          if (pickupDetails?.collectorName) {
            collectorName = pickupDetails.collectorName;
          } else if (pickupDetails?.collectorId) {
            try {
              const collectorDoc = await getDoc(
                doc(db, "users", pickupDetails.collectorId),
              );
              if (collectorDoc.exists()) {
                collectorName = collectorDoc.data().name;
              }
            } catch (e) {
              console.error("Error fetching collector:", e);
            }
          }

          return {
            id: doc.id,
            ...txData,
            userName,
            collectorName,
            pickupDetails,
          };
        }),
      );
      console.log("Transactions processed:", transactionsData.length);
      setTransactions(transactionsData);
      setFilteredTransactions(transactionsData);

      // ALSO fetch spot pickups to show pending/in-progress with amounts
      const spotPickupsRef = collection(db, "spotPickups");
      const spotPickupsSnap = await getDocs(spotPickupsRef);
      console.log("Spot pickups found:", spotPickupsSnap.size);

      const pendingPickupsData = spotPickupsSnap.docs
        .map((doc) => {
          const data = doc.data();
          const userData = usersMap.get(data.userId);
          return {
            id: doc.id,
            ...data,
            userName: userData?.name || "Unknown",
          };
        })
        .filter((p) =>
          [
            "pending",
            "accepted",
            "in_transit",
            "arrived",
            "in_progress",
          ].includes(p.status),
        );

      setPendingPickups(pendingPickupsData);
      console.log("Pending pickups:", pendingPickupsData.length);

      const thisMonthTransactions = transactionsData.filter((t) => {
        const txDate = t.createdAt?.toDate?.() || new Date(t.createdAt);
        const now = new Date();
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      });
      const thisMonth = thisMonthTransactions
        .filter((t) => t.type === "credit")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Calculate total earnings from TRANSACTIONS (not wallets) - this is the source of truth
      const creditTransactions = transactionsData.filter(
        (t) => t.type === "credit",
      );
      const allEarnings = creditTransactions.reduce(
        (sum, t) => sum + (t.amount || 0),
        0,
      );

      // Build map of earnings per user
      const earningsMap = new Map<string, number>();
      creditTransactions.forEach((t) => {
        const current = earningsMap.get(t.userId) || 0;
        earningsMap.set(t.userId, current + (t.amount || 0));
      });
      setUserEarningsMap(earningsMap);

      console.log("Total earnings from transactions:", {
        creditTransactionCount: creditTransactions.length,
        allEarnings,
        earningsMap: Object.fromEntries(earningsMap),
      });

      // Calculate pending amount from pending pickups
      const pendingAmount = pendingPickupsData.reduce(
        (sum, p) => sum + (p.amount || 0),
        0,
      );

      // Calculate total disbursed from transactions (debit transactions)
      const debitTransactions = transactionsData.filter(
        (t) => t.type === "debit",
      );
      const totalDisbursed = debitTransactions.reduce(
        (sum, t) => sum + (t.amount || 0),
        0,
      );

      // Total earned includes both completed transactions and pending amounts
      const totalIncludingPending = allEarnings + pendingAmount;

      console.log("Stats calculation:", {
        allEarnings,
        pendingAmount,
        thisMonth,
        totalDisbursed,
        totalIncludingPending,
      });

      setStats({
        totalDisbursed: totalDisbursed + pendingAmount,
        thisMonth,
        avgPerUser:
          walletsData.length > 0
            ? totalIncludingPending / walletsData.length
            : 0,
        activeWallets: walletsData.length,
        totalUsers: usersMap.size,
        totalEarned: allEarnings,
      });
    } catch (err) {
      console.error("Failed to fetch wallet data:", err);
      setError("Failed to load wallet data");
    } finally {
      setIsFetching(false);
    }
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

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate?.() || new Date(timestamp);
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
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
              Wallet & Transactions
            </h1>
            <p className="text-muted-foreground mt-1">
              Complete view of all user wallets, balances, earnings, and
              transactions
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Data Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-muted-foreground">Wallets</p>
              <p className="font-bold text-blue-600">{userWallets.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <p className="text-muted-foreground">Transactions</p>
              <p className="font-bold text-green-600">{transactions.length}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded p-2">
              <p className="text-muted-foreground">Total Earned</p>
              <p className="font-bold text-purple-600">
                ₹{stats.totalEarned.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded p-2">
              <p className="text-muted-foreground">This Month</p>
              <p className="font-bold text-orange-600">
                ₹{stats.thisMonth.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              icon={TrendingUp}
              label="Total Earned"
              value={`₹${stats.totalEarned.toLocaleString("en-IN")}`}
            />
            <StatCard
              icon={Wallet}
              label="This Month"
              value={`₹${stats.thisMonth.toLocaleString("en-IN")}`}
            />
            <StatCard
              icon={Users}
              label="Active Wallets"
              value={stats.activeWallets.toString()}
            />
            <StatCard
              icon={Award}
              label="Avg Per User"
              value={`₹${Math.floor(stats.avgPerUser)}`}
            />
            <StatCard
              icon={Wallet}
              label="Total Users"
              value={stats.totalUsers.toString()}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("wallets")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "wallets"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              User Wallets ({userWallets.length})
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "transactions"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "pending"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending Pickups ({pendingPickups.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800">
                  <strong>💡 Stats:</strong> {userWallets.length} wallets with
                  total balance of ₹
                  {userWallets
                    .reduce((sum, w) => sum + w.balance, 0)
                    .toLocaleString("en-IN")}
                  . Total earned all-time: ₹
                  {stats.totalEarned.toLocaleString("en-IN")}
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 5 Users by Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userWallets
                        .map((wallet) => ({
                          ...wallet,
                          earnings: userEarningsMap.get(wallet.userId) || 0,
                        }))
                        .sort((a, b) => (b.earnings || 0) - (a.earnings || 0))
                        .slice(0, 5)
                        .map((wallet, idx) => (
                          <div
                            key={wallet.id}
                            className="flex items-center justify-between pb-2 border-b last:border-0"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {idx + 1}. {wallet.userName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {wallet.userEmail}
                              </p>
                            </div>
                            <p className="font-semibold text-success">
                              ₹
                              {(
                                userEarningsMap.get(wallet.userId) || 0
                              ).toLocaleString("en-IN")}
                            </p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Top 5 Wallets by Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userWallets
                        .sort((a, b) => b.balance - a.balance)
                        .slice(0, 5)
                        .map((wallet, idx) => (
                          <div
                            key={wallet.id}
                            className="flex items-center justify-between pb-2 border-b last:border-0"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {idx + 1}. {wallet.userName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Active
                              </p>
                            </div>
                            <p className="font-semibold">
                              ₹{(wallet.balance || 0).toLocaleString("en-IN")}
                            </p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "wallets" && (
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>All User Wallets</CardTitle>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search wallets..."
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
                ) : userWallets.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No wallets yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                          <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                            User Name
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Email
                          </th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Current Balance
                          </th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Total Earnings
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                            Last Updated
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {userWallets.map((wallet, i) => (
                          <motion.tr
                            key={wallet.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.02 }}
                            className="border-b border-border/30 hover:bg-muted/20"
                          >
                            <td className="px-6 py-3 text-sm font-medium text-foreground">
                              {wallet.userName}
                            </td>
                            <td className="px-6 py-3 text-sm text-muted-foreground">
                              {wallet.userEmail}
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold text-right">
                              <Badge className="bg-green-100 text-green-800">
                                ₹{(wallet.balance || 0).toLocaleString("en-IN")}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold text-right text-success">
                              ₹
                              {(
                                userEarningsMap.get(wallet.userId) || 0
                              ).toLocaleString("en-IN")}
                            </td>
                            <td className="px-6 py-3 text-sm text-muted-foreground">
                              {formatDate(wallet.updatedAt)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "transactions" && (
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>All Transactions with Details</CardTitle>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
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
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "No transactions match your search"
                        : "No transactions yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 p-6">
                    {filteredTransactions.map((t, i) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Left: User and Transaction Info */}
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              User
                            </p>
                            <p className="font-semibold text-sm">
                              {t.userName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-3">
                              Collector
                            </p>
                            <p className="font-semibold text-sm">
                              {t.collectorName}
                            </p>
                          </div>

                          {/* Middle: Amount and Type */}
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Amount
                            </p>
                            <div className="flex items-center gap-2">
                              {t.type === "credit" ? (
                                <ArrowDownRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-red-600" />
                              )}
                              <span
                                className={`font-semibold text-sm ${t.type === "credit" ? "text-green-600" : "text-red-600"}`}
                              >
                                {t.type === "credit" ? "+" : "-"}₹
                                {t.amount?.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">
                                {t.pickupType === "weekly" ? "Weekly" : "Spot"}
                              </Badge>
                              <Badge>
                                {t.type === "credit" ? "Earning" : "Debit"}
                              </Badge>
                            </div>
                          </div>

                          {/* Right: Date and Details */}
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Date & Time
                            </p>
                            <p className="font-semibold text-sm">
                              {formatDate(t.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(t.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-3">
                              Transaction ID
                            </p>
                            <p className="font-mono text-xs">
                              {t.id.substring(0, 16)}...
                            </p>
                          </div>
                        </div>

                        {/* Pickup Details */}
                        {t.pickupDetails && (
                          <div className="mt-4 p-3 bg-muted/50 rounded text-sm space-y-1">
                            {t.pickupType === "spot" && (
                              <>
                                <p>
                                  <strong>Pickup Date:</strong>{" "}
                                  {formatDate(t.pickupDetails.pickupDate)}
                                </p>
                                {t.pickupDetails.estimatedWeight > 0 && (
                                  <p>
                                    <strong>Weight Collected:</strong>{" "}
                                    {t.pickupDetails.estimatedWeight} kg
                                  </p>
                                )}
                                {((t.pickupDetails.metalWaste &&
                                  Object.keys(t.pickupDetails.metalWaste)
                                    .length > 0) ||
                                  (t.pickupDetails.nonMetalWaste &&
                                    Object.keys(t.pickupDetails.nonMetalWaste)
                                      .length > 0)) && (
                                  <p>
                                    <strong>Waste Details:</strong> Metal &
                                    Non-metal waste collected
                                  </p>
                                )}
                              </>
                            )}
                            {t.pickupType === "weekly" && (
                              <>
                                <p>
                                  <strong>Pickup Day:</strong>{" "}
                                  {t.pickupDetails.pickupDay}
                                </p>
                                <p>
                                  <strong>Status:</strong>{" "}
                                  {t.pickupDetails.status}
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "pending" && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>
                  Pending & In-Progress Pickups (with Estimated Amounts)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isFetching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingPickups.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No pending or in-progress pickups
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 p-6">
                    {pendingPickups.map((pickup, i) => (
                      <motion.div
                        key={pickup.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Left: User and Status Info */}
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              USER
                            </p>
                            <p className="font-semibold text-sm">
                              {pickup.userName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-3">
                              STATUS
                            </p>
                            <Badge className={`text-xs capitalize`}>
                              {pickup.status}
                            </Badge>
                          </div>

                          {/* Middle: Amount and Weight */}
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              ESTIMATED AMOUNT
                            </p>
                            <p className="font-bold text-lg text-green-600">
                              ₹{(pickup.amount || 0).toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-3">
                              ESTIMATED WEIGHT
                            </p>
                            <p className="font-semibold text-sm">
                              {pickup.estimatedWeight || 0} kg
                            </p>
                          </div>

                          {/* Right: Pickup Date */}
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              PICKUP DATE
                            </p>
                            <p className="font-semibold text-sm">
                              {formatDate(pickup.pickupDate)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pickup.timeSlot}
                            </p>
                            <p className="text-xs text-muted-foreground mt-3">
                              ID
                            </p>
                            <p className="font-mono text-xs">
                              {pickup.id.substring(0, 12)}...
                            </p>
                          </div>

                          {/* Waste Details */}
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              WASTE DETAILS
                            </p>
                            {pickup.selectedCategories &&
                            pickup.selectedCategories.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {pickup.selectedCategories.map(
                                  (cat: any, idx: number) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {cat.amount}kg
                                    </Badge>
                                  ),
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No details
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminWallet;

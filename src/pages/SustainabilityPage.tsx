import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserNavbar from "@/components/UserNavbar";
import StatCard from "@/components/StatCard";
import {
  TreePine,
  Wind,
  Recycle,
  TrendingUp,
  Loader2,
  Award,
  Target,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { getWeeklyPickupsByUser } from "@/services/firestoreService";

const SustainabilityPage = () => {
  const { user } = useAuth();
  const [pickups, setPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const pickupData = await getWeeklyPickupsByUser(user.id);
        setPickups(pickupData);
      } catch (err: any) {
        console.error("Failed to fetch pickup data:", err);
        setError("Failed to load sustainability data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Calculate metrics
  const totalWeight = pickups
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.weight || 0), 0);
  const co2Reduced = totalWeight * 0.5; // 0.5 kg CO2 saved per kg recycled (approximate)
  const treesEquivalent = Math.floor(co2Reduced / 21); // 1 tree absorbs ~21kg CO2 per year
  const pickupCount = pickups.filter((p) => p.status === "completed").length;

  const currentMonth = new Date();
  const monthPickups = pickups.filter((p) => {
    const pDate = new Date(p.scheduledDate);
    return (
      pDate.getMonth() === currentMonth.getMonth() &&
      pDate.getFullYear() === currentMonth.getFullYear() &&
      p.status === "completed"
    );
  });

  const badges = [
    { id: 1, name: "Eco Warrior", icon: "🌍", condition: co2Reduced >= 50 },
    {
      id: 2,
      name: "Recycling Champion",
      icon: "♻️",
      condition: pickupCount >= 10,
    },
    {
      id: 3,
      name: "Green Guardian",
      icon: "🌱",
      condition: treesEquivalent >= 2,
    },
    {
      id: 4,
      name: "Community Hero",
      icon: "🦸",
      condition: pickupCount >= 20,
    },
  ];

  const earnedBadges = badges.filter((b) => b.condition);

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

  return (
    <div className="min-h-screen">
      <UserNavbar />

      {/* Banner */}
      <div className="gradient-primary">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2 text-primary-foreground text-sm font-medium">
          <Recycle className="w-4 h-4" />
          You're making a real environmental impact!
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Sustainability Dashboard
          </h1>
          <p className="text-muted-foreground">
            Your environmental impact at a glance
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            icon={Wind}
            label="CO₂ Reduced"
            value={`${co2Reduced.toFixed(1)} kg`}
            subtitle="This year"
          />
          <StatCard
            icon={Recycle}
            label="Waste Recycled"
            value={`${totalWeight.toFixed(1)} kg`}
            subtitle="Total lifetime"
          />
          <StatCard
            icon={TreePine}
            label="Trees Saved"
            value={treesEquivalent.toString()}
            subtitle="Equivalent impact"
          />
          <StatCard
            icon={TrendingUp}
            label="Pickups Done"
            value={pickupCount.toString()}
            subtitle="Total completed"
          />
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Earned Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {earnedBadges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {earnedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200"
                    >
                      <span className="text-4xl block mb-2">{badge.icon}</span>
                      <p className="font-semibold text-foreground text-sm">
                        {badge.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Keep collecting to earn badges!</p>
                </div>
              )}

              {/* Locked badges */}
              {badges.filter((b) => !b.condition).length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Locked Badges
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {badges
                      .filter((b) => !b.condition)
                      .map((badge) => (
                        <div
                          key={badge.id}
                          className="text-center p-4 bg-muted/30 rounded-lg opacity-50"
                        >
                          <span className="text-4xl block mb-2 grayscale">
                            {badge.icon}
                          </span>
                          <p className="font-semibold text-foreground text-sm">
                            {badge.name}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Monthly Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  label: "Pickups This Month",
                  value: monthPickups.length,
                  target: 4,
                },
                {
                  label: "Waste Reduction Target",
                  value: Math.round((monthPickups.length / 4) * 100),
                  target: 100,
                },
                {
                  label: "CO₂ Reduction This Month",
                  value: Math.round(
                    (monthPickups.reduce((sum, p) => sum + (p.weight || 0), 0) *
                      0.5) /
                      10,
                  ),
                  target: 100,
                },
                { label: "Community Contribution", value: 75, target: 100 },
              ].map((goal, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">
                      {goal.label}
                    </span>
                    <span className="text-muted-foreground">
                      {Math.min(goal.value, goal.target)}/{goal.target}
                    </span>
                  </div>
                  <Progress
                    value={Math.min((goal.value / goal.target) * 100, 100)}
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Impact Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Impact</CardTitle>
            </CardHeader>
            <CardContent>
              {pickups.length > 0 ? (
                <div className="space-y-3">
                  {pickups.slice(0, 5).map((pickup, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(pickup.scheduledDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {pickup.status}
                        </p>
                      </div>
                      {pickup.weight && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {pickup.weight} kg
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ~{(pickup.weight * 0.5).toFixed(1)}kg CO₂
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Recycle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Start collecting to see your impact!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SustainabilityPage;

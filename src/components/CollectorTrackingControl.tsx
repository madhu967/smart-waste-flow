import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  startCollectorTracking,
  stopLocationTracking,
} from "@/services/locationService";
import { updateSpotPickup } from "@/services/firestoreService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Unsubscribe } from "firebase/firestore";
import {
  Navigation,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";

interface CollectorTrackingControlProps {
  pickupId: string;
  userName: string;
  userPhone: string;
  onTrackingStarted?: (status: string) => void;
  onTrackingStopped?: () => void;
}

export const CollectorTrackingControl = ({
  pickupId,
  userName,
  userPhone,
  onTrackingStarted,
  onTrackingStopped,
}: CollectorTrackingControlProps) => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingUnsubscribe, setTrackingUnsubscribe] =
    useState<Unsubscribe | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleStartTracking = async () => {
    if (!user?.id) {
      setError("You must be logged in");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Start location tracking
      const unsubscribe = await startCollectorTracking(user.id, (error) => {
        if (error) {
          setError(error);
          setIsTracking(false);
        }
      });

      if (unsubscribe) {
        setTrackingUnsubscribe(() => unsubscribe);
        setIsTracking(true);
        setSuccessMessage("✓ Tracking started - User can see your location");

        // Update pickup status to in_transit
        try {
          await updateSpotPickup(pickupId, {
            status: "in_transit" as const,
            trackingStatus: "live" as const,
          });
        } catch (err) {
          console.error("Failed to update pickup status:", err);
        }

        onTrackingStarted?.("in_transit");

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to start tracking");
    } finally {
      setLoading(false);
    }
  };

  const handleStopTracking = () => {
    if (trackingUnsubscribe) {
      stopLocationTracking(trackingUnsubscribe);
      setTrackingUnsubscribe(null);
      setIsTracking(false);
      setSuccessMessage(null);

      onTrackingStopped?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-orange-600" />
              <span>Start Collection</span>
            </div>
            {isTracking && (
              <Badge className="bg-green-500 text-white animate-pulse">
                🔴 Tracking Live
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* User Information */}
          {!isTracking && (
            <div className="bg-white rounded-lg p-4 border border-orange-200 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  User Location
                </p>
                <p className="font-semibold text-foreground text-lg">
                  {userName}
                </p>
              </div>

              <a
                href={`tel:${userPhone}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call User
              </a>
            </div>
          )}

          {/* Instructions */}
          {!isTracking && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Ready to start?
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Click "Start Collecting" to begin</li>
                <li>Your location will be shared with the user</li>
                <li>User will see you approaching in real-time</li>
                <li>Drive to the user's location</li>
              </ol>
            </div>
          )}

          {/* Tracking Active Info */}
          {isTracking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3"
            >
              <div className="text-center">
                <p className="text-sm text-green-700 font-semibold mb-1">
                  📍 Live Location Tracking Active
                </p>
                <p className="text-xs text-green-600">
                  Your location updates automatically every few seconds
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-center py-2 bg-white rounded border border-green-300">
                <div>
                  <p className="text-green-700 font-semibold">User</p>
                  <p className="text-muted-foreground">{userName}</p>
                </div>
                <div>
                  <p className="text-green-700 font-semibold">Status</p>
                  <p className="text-green-600 font-bold">ON WAY</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Control Buttons */}
          <div className="space-y-3">
            {!isTracking ? (
              <Button
                onClick={handleStartTracking}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 mr-2" />
                    Start Collecting
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleStopTracking}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg"
              >
                <Navigation className="w-5 h-5 mr-2" />
                Stop Tracking
              </Button>
            )}
          </div>

          {/* GPS Status */}
          <div className="text-xs text-muted-foreground text-center p-2 bg-gray-100 rounded">
            ✓ GPS enabled - High accuracy location tracking
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CollectorTrackingControl;

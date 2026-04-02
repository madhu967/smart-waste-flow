import { useState, useEffect } from "react";
import {
  startLocationTracking,
  stopLocationTracking,
  listenToUserLocation,
  calculateDistance,
  markCollectorArrived,
} from "@/services/locationService";
import { LiveLocation } from "@/services/locationService";
import { Unsubscribe } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface CollectorTrackingPanelProps {
  collectorId: string;
  collectorName: string;
  userId: string;
  userName: string;
  pickupId: string;
  userLocation: { lat: number; lng: number } | null;
  onTrackingStart?: () => void;
  onTrackingStop?: () => void;
  onArrived?: () => void;
}

export const CollectorTrackingPanel = ({
  collectorId,
  collectorName,
  userId,
  userName,
  pickupId,
  userLocation,
  onTrackingStart,
  onTrackingStop,
  onArrived,
}: CollectorTrackingPanelProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocationData, setUserLocationData] = useState<LiveLocation | null>(
    null,
  );
  const [distance, setDistance] = useState<number | null>(null);
  const [unsubscribeUser, setUnsubscribeUser] = useState<Unsubscribe | null>(
    null,
  );
  const [unsubscribeTracking, setUnsubscribeTracking] =
    useState<Unsubscribe | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasArrived, setHasArrived] = useState(false);

  // Listen to user location
  useEffect(() => {
    const unsubUser = listenToUserLocation(userId, (location) => {
      setUserLocationData(location);
    });
    setUnsubscribeUser(() => unsubUser);

    return () => {
      unsubUser();
    };
  }, [userId]);

  // Start location tracking
  const handleStartTracking = async () => {
    try {
      setLoading(true);
      setError(null);
      setLocationError(null);

      const unsubTracking = await startLocationTracking(
        collectorId,
        (error) => {
          if (error) {
            setLocationError(error);
            setIsTracking(false);
          }
        },
      );

      if (unsubTracking) {
        setUnsubscribeTracking(() => unsubTracking);
        setIsTracking(true);
        onTrackingStart?.();
      }
    } catch (err: any) {
      setError(err.message || "Failed to start tracking");
      console.error("Tracking error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Stop location tracking
  const handleStopTracking = () => {
    try {
      stopLocationTracking(unsubscribeTracking);
      setIsTracking(false);
      setUnsubscribeTracking(null);
      setHasArrived(false);
      onTrackingStop?.();
    } catch (err: any) {
      setError(err.message || "Failed to stop tracking");
    }
  };

  // Mark as arrived
  const handleMarkArrived = async () => {
    try {
      setLoading(true);
      setError(null);
      await markCollectorArrived(pickupId);
      setHasArrived(true);
      handleStopTracking();
      onArrived?.();
    } catch (err: any) {
      setError(err.message || "Failed to mark arrival");
      console.error("Arrival error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance when user location updates
  useEffect(() => {
    if (isTracking && userLocationData && userLocation) {
      const dist = calculateDistance(
        userLocationData.latitude,
        userLocationData.longitude,
        userLocation.lat,
        userLocation.lng,
      );
      setDistance(dist);
    }
  }, [isTracking, userLocationData, userLocation]);

  return (
    <div className="space-y-4">
      {/* Status Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {locationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      {hasArrived && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center"
        >
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="font-semibold text-green-800">Arrival Confirmed!</p>
          <p className="text-sm text-green-700">Pickup marked as arrived</p>
        </motion.div>
      )}

      {/* User Location Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isTracking ? "🔴 Live Tracking Active" : "📍 User Location"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Pickup User</p>
            <p className="font-semibold text-blue-900">{userName}</p>
          </div>

          {/* User Location */}
          {userLocation && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">User Coordinates</p>
              <p className="text-sm font-mono">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            </div>
          )}

          {/* Distance */}
          {isTracking && distance !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Distance</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {distance < 1
                      ? `${(distance * 1000).toFixed(0)}m`
                      : `${distance.toFixed(2)}km`}
                  </p>
                </div>
                <Navigation className="w-12 h-12 text-orange-500 animate-pulse" />
              </div>
            </motion.div>
          )}

          {/* Status */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Tracking Status</p>
            <p className="font-semibold">
              {isTracking ? (
                <span className="text-orange-600 flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  LIVE - Updating location...
                </span>
              ) : (
                <span className="text-gray-600">Not Tracking</span>
              )}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2 pt-2">
            {!isTracking ? (
              <Button
                onClick={handleStartTracking}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Start Tracking
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleStopTracking}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  Stop Tracking
                </Button>
                {distance !== null && distance < 0.1 && (
                  <Button
                    onClick={handleMarkArrived}
                    disabled={loading || hasArrived}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Marking...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark Reached
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Auto-Reached Message */}
          {isTracking && distance !== null && distance < 0.1 && !hasArrived && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg"
            >
              <p className="text-sm font-semibold text-yellow-800">
                ✓ You've reached the user! Click "Mark Reached" to confirm.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CollectorTrackingPanel;

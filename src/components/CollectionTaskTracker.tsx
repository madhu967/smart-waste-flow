import { useState, useEffect } from "react";
import {
  startLocationTracking,
  startCollectorTracking,
  stopLocationTracking,
  listenToUserLocation,
  listenToCollectorLocation,
  calculateDistance,
  markCollectorArrived,
} from "@/services/locationService";
import { LiveLocation } from "@/services/locationService";
import { updateSpotPickup } from "@/services/firestoreService";
import { Unsubscribe } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Navigation,
  Phone,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

interface CollectionTaskTrackerProps {
  taskId: string;
  collectorId: string;
  collectorName: string;
  userId: string;
  userName: string;
  userPhone: string;
  userLocation: { lat: number; lng: number } | null;
  onClose?: () => void;
  onCompleted?: () => void;
}

export const CollectionTaskTracker = ({
  taskId,
  collectorId,
  collectorName,
  userId,
  userName,
  userPhone,
  userLocation,
  onClose,
  onCompleted,
}: CollectionTaskTrackerProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collectorLocation, setCollectorLocation] =
    useState<LiveLocation | null>(null);
  const [userLocationData, setUserLocationData] = useState<LiveLocation | null>(
    userLocation
      ? {
          uid: userId,
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          timestamp: new Date(),
        }
      : null,
  );
  const [distance, setDistance] = useState<number | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [unsubscribeCollector, setUnsubscribeCollector] =
    useState<Unsubscribe | null>(null);
  const [unsubscribeUser, setUnsubscribeUser] = useState<Unsubscribe | null>(
    null,
  );
  const [trackingUnsubscribe, setTrackingUnsubscribe] =
    useState<Unsubscribe | null>(null);

  // Debug: Log incoming props
  useEffect(() => {
    console.log("CollectionTaskTracker Props:", {
      userLocation,
      userId,
      userName,
      userPhone,
    });
  }, [userLocation, userId, userName, userPhone]);

  // Listen to user location
  useEffect(() => {
    const unsubUser = listenToUserLocation(userId, (location) => {
      // Only update if we get a real location (don't overwrite booked location with null)
      if (location) {
        setUserLocationData(location);
      }
    });
    setUnsubscribeUser(() => unsubUser);

    return () => {
      unsubUser();
    };
  }, [userId]);

  // Auto-start tracking when component mounts
  useEffect(() => {
    const startTrackingOnMount = async () => {
      // Small delay to ensure component is ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        setLoading(true);
        setError(null);

        // Start collector location tracking
        const unsubTracking = await startCollectorTracking(
          collectorId,
          (error) => {
            if (error) {
              setError(error);
              setIsTracking(false);
            }
          },
        );

        // Listen to collector location
        const unsubCollector = listenToCollectorLocation(
          collectorId,
          (location) => {
            setCollectorLocation(location);
          },
        );

        if (unsubTracking && unsubCollector) {
          setTrackingUnsubscribe(() => unsubTracking);
          setUnsubscribeCollector(() => unsubCollector);
          setIsTracking(true);

          // Update pickup status to in_transit so user can see it
          try {
            await updateSpotPickup(taskId, {
              status: "in_transit" as const,
              trackingStatus: "live" as const,
            });
            console.log("Pickup status updated to in_transit");
          } catch (err) {
            console.error("Failed to update pickup status:", err);
            // Don't fail tracking if status update fails
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to start tracking");
      } finally {
        setLoading(false);
      }
    };

    startTrackingOnMount();

    return () => {
      // Cleanup on unmount
      if (trackingUnsubscribe) {
        stopLocationTracking(trackingUnsubscribe);
      }
    };
  }, [collectorId, taskId]);

  // Calculate distance using real-time user location
  useEffect(() => {
    if (collectorLocation && userLocationData) {
      const dist = calculateDistance(
        collectorLocation.latitude,
        collectorLocation.longitude,
        userLocationData.latitude,
        userLocationData.longitude,
      );
      setDistance(dist);

      // Auto-detect arrival state but DON'T auto-trigger form
      if (dist < 0.1 && !hasArrived) {
        setHasArrived(true);
      }
    }
  }, [collectorLocation, userLocationData, hasArrived]);

  const handleStartTracking = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start collector location tracking
      const unsubTracking = await startCollectorTracking(
        collectorId,
        (error) => {
          if (error) {
            setError(error);
            setIsTracking(false);
          }
        },
      );

      // Listen to collector location
      const unsubCollector = listenToCollectorLocation(
        collectorId,
        (location) => {
          setCollectorLocation(location);
        },
      );

      if (unsubTracking && unsubCollector) {
        setTrackingUnsubscribe(() => unsubTracking);
        setUnsubscribeCollector(() => unsubCollector);
        setIsTracking(true);

        // Update pickup status to in_transit so user can see it
        try {
          await updateSpotPickup(taskId, {
            status: "in_transit" as const,
            trackingStatus: "live" as const,
          });
        } catch (err) {
          console.error("Failed to update pickup status:", err);
        }
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
    }
    if (unsubscribeCollector) {
      unsubscribeCollector();
    }
    setIsTracking(false);
    setCollectorLocation(null);
  };

  const handleMarkArrived = async () => {
    try {
      setLoading(true);
      await markCollectorArrived(taskId);
      setHasArrived(true);
      handleStopTracking();
      setTimeout(() => {
        onCompleted?.();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to mark arrival");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white border-b flex items-center justify-between">
          <CardTitle>
            📍 {isTracking ? "Live Tracking" : "Collection Task"}
          </CardTitle>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hasArrived && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center"
            >
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800">
                ✓ Arrived at user location!
              </p>
              <p className="text-sm text-green-700">
                Ready for garbage collection
              </p>
            </motion.div>
          )}

          {/* User Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">User Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Name</p>
                <p className="font-semibold text-blue-900">{userName}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <a
                  href={`tel:${userPhone}`}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {userPhone}
                </a>
              </div>
            </div>
          </div>

          {/* Map Container - Navigation View */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-slate-100">
              {/* Street Grid Background */}
              <svg
                className="absolute inset-0 w-full h-full opacity-20"
                viewBox="0 0 400 400"
              >
                <defs>
                  <pattern
                    id="streets"
                    width="60"
                    height="60"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 60 0 L 0 0 0 60"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 30 0 L 30 60"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="0.8"
                    />
                    <path
                      d="M 0 30 L 60 30"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="0.8"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#streets)" />
              </svg>

              {/* Destination: User Location (Bottom Right) */}
              {userLocationData && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 z-20"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
                    <div className="absolute inset-0 bg-blue-300 rounded-full animate-ping opacity-40"></div>
                    <div className="relative w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg">
                    📍 {userName}
                  </div>
                </motion.div>
              )}

              {/* Collector Current Position (moves toward destination) */}
              {isTracking && collectorLocation && userLocationData && (
                <>
                  {/* Direction Arrow Path */}
                  <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3, 0 6" fill="#ff8c00" />
                      </marker>
                    </defs>
                    {/* Line from collector to destination */}
                    <line
                      x1={`${50 + (collectorLocation.longitude - userLocationData.longitude) * 100}%`}
                      y1={`${50 + (collectorLocation.latitude - userLocationData.latitude) * 100}%`}
                      x2="75%"
                      y2="62.5%"
                      stroke="#ff8c00"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity="0.6"
                      markerEnd="url(#arrowhead)"
                    />
                  </svg>

                  {/* Collector Marker */}
                  <motion.div
                    animate={{
                      top: `${
                        50 +
                        (collectorLocation.latitude -
                          userLocationData.latitude) *
                          100
                      }%`,
                      left: `${
                        50 +
                        (collectorLocation.longitude -
                          userLocationData.longitude) *
                          100
                      }%`,
                    }}
                    className="absolute w-14 h-14 transform -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-500"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-50"></div>
                      <div className="absolute inset-1 bg-orange-300 rounded-full animate-pulse opacity-40"></div>
                      <div className="relative w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                        <Navigation className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </motion.div>
                </>
              )}

              {/* ETA & Distance Box */}
              {isTracking && distance !== null && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40"
                >
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-2xl border-2 border-orange-300">
                    <p className="text-center text-sm font-semibold mb-1">
                      Distance to Destination
                    </p>
                    <p className="text-3xl font-bold text-center">
                      {distance < 1
                        ? `${(distance * 1000).toFixed(0)}m`
                        : `${distance.toFixed(2)}km`}
                    </p>
                    <p className="text-center text-xs mt-2 opacity-90">
                      ETA:{" "}
                      {distance < 1
                        ? "Arriving..."
                        : `${Math.ceil(distance * 2)} min`}
                    </p>
                    {distance < 0.1 && (
                      <motion.p
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="text-center text-sm font-bold mt-2 text-yellow-200"
                      >
                        🎯 You've arrived!
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}

              {!isTracking && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-center"
                  >
                    <MapPin className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                    <p className="text-lg font-bold text-gray-700 mb-1">
                      Navigating to {userName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Click START to begin live tracking
                    </p>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Navigation Details */}
            {isTracking && (
              <div className="p-4 bg-gradient-to-r from-orange-50 to-blue-50 border-t space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs text-gray-500 mb-1">
                      📍 User Location
                    </p>
                    <p className="text-xs font-mono text-blue-700">
                      {userLocationData
                        ? `${userLocationData.latitude.toFixed(4)}, ${userLocationData.longitude.toFixed(4)}`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border-l-4 border-orange-500">
                    <p className="text-xs text-gray-500 mb-1">
                      🚗 Your Location
                    </p>
                    <p className="text-xs font-mono text-orange-700">
                      {collectorLocation
                        ? `${collectorLocation.latitude.toFixed(4)}, ${collectorLocation.longitude.toFixed(4)}`
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border-l-4 border-green-500">
                  <p className="text-xs text-gray-500 mb-2">
                    🎯 Navigation Info
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">
                        {distance !== null && distance < 1
                          ? `${(distance * 1000).toFixed(0)}`
                          : distance?.toFixed(2) || "0"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {distance !== null && distance < 1 ? "meters" : "km"}
                      </p>
                    </div>
                    <div className="text-center border-l border-r">
                      <p className="text-xl font-bold text-blue-600">
                        {distance !== null ? Math.ceil(distance * 2) : "∞"}
                      </p>
                      <p className="text-xs text-gray-500">min ETA</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-orange-600">
                        {distance !== null && distance > 0
                          ? distance < 0.5
                            ? "🔴"
                            : "🟡"
                          : "🟢"}
                      </p>
                      <p className="text-xs text-gray-500">Status</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            {!isTracking && error ? (
              // Retry button if tracking failed
              <Button
                onClick={handleStartTracking}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 gap-2 h-12 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    RETRY Tracking
                  </>
                )}
              </Button>
            ) : !isTracking ? (
              <Button
                onClick={handleStartTracking}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 gap-2 h-12 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    START Live Tracking
                  </>
                )}
              </Button>
            ) : (
              <>
                {distance !== null && distance < 0.1 ? (
                  <Button
                    onClick={handleMarkArrived}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 gap-2 h-12 text-lg font-bold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />✓ Mark Reached -
                        Show Collection Form
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopTracking}
                    disabled={false}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    Stop Tracking
                  </Button>
                )}
              </>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6 h-12"
              disabled={isTracking}
            >
              Close
            </Button>
          </div>

          {/* Navigation Guidance */}
          {isTracking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
                <p className="text-sm font-semibold text-green-900 mb-2">
                  🧭 Navigation Instructions
                </p>
                <ul className="text-sm text-green-800 space-y-1">
                  {distance !== null && (
                    <>
                      <li>
                        ✓ Current Distance:{" "}
                        <span className="font-bold">
                          {distance < 1
                            ? `${(distance * 1000).toFixed(0)}m`
                            : `${distance.toFixed(2)}km`}
                        </span>
                      </li>
                      <li>
                        ✓ Estimated Time:{" "}
                        <span className="font-bold">
                          {Math.ceil(distance * 2)} minutes
                        </span>
                      </li>
                      <li>
                        ✓ Destination:{" "}
                        <span className="font-bold">{userName}</span>
                      </li>
                      {distance < 1 && (
                        <li className="text-green-700 font-bold animate-pulse">
                          🎯 You're very close! Head to the blue marker
                          location.
                        </li>
                      )}
                    </>
                  )}
                </ul>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">💡 Tip:</span> Follow the
                  orange dashed line on the map to reach {userName}'s location.
                  The distance updates in real-time as you move.
                </p>
              </div>
            </motion.div>
          )}

          {/* Status Info */}
          <div
            className={`p-4 rounded-lg border-2 ${
              isTracking
                ? hasArrived
                  ? "bg-green-50 border-green-400"
                  : distance !== null && distance < 0.5
                    ? "bg-orange-50 border-orange-400"
                    : "bg-blue-50 border-blue-400"
                : "bg-gray-50 border-gray-300"
            }`}
          >
            {isTracking ? (
              hasArrived ? (
                <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />✅ Arrived! You're at the
                  user location. Proceed with garbage collection.
                </p>
              ) : distance !== null && distance < 0.5 ? (
                <motion.p
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-sm font-semibold text-orange-800 flex items-center gap-2"
                >
                  <Navigation className="w-5 h-5 animate-spin" />
                  🔥 Very Close! Keep heading toward the destination marker.
                </motion.p>
              ) : (
                <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  📍 Live Tracking Active - Navigate toward the blue marker (
                  {userName})
                </p>
              )
            ) : (
              <p className="text-sm font-semibold text-gray-700">
                👉 Click START to begin live navigation to {userName}'s location
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CollectionTaskTracker;

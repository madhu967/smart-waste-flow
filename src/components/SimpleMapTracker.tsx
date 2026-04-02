import { useState, useEffect } from "react";
import {
  listenToCollectorLocation,
  calculateDistance,
} from "@/services/locationService";
import { LiveLocation } from "@/services/locationService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Unsubscribe } from "firebase/firestore";
import { MapPin, Navigation, ChevronDown, Clock, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface SimpleMapTrackerProps {
  collectorId: string;
  userLocation: { lat: number; lng: number } | null;
  collectorName: string;
  collectorPhone: string;
}

export const SimpleMapTracker = ({
  collectorId,
  userLocation,
  collectorName,
  collectorPhone,
}: SimpleMapTrackerProps) => {
  const [collectorLocation, setCollectorLocation] =
    useState<LiveLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Listen to collector location in real-time
  useEffect(() => {
    if (!collectorId) {
      setIsLoadingLocation(false);
      return;
    }

    console.log(
      "SimpleMapTracker: Setting up location listener for",
      collectorId,
    );
    const unsubscribe = listenToCollectorLocation(collectorId, (location) => {
      console.log("SimpleMapTracker: Received collector location", location);
      setCollectorLocation(location);
      setIsLoadingLocation(false);
    });

    return () => unsubscribe();
  }, [collectorId]);

  // Log when we have/don't have user location
  useEffect(() => {
    if (!userLocation) {
      console.warn("SimpleMapTracker: No user location available", {
        userLocation,
      });
    } else {
      console.log("SimpleMapTracker: User location available", userLocation);
    }
  }, [userLocation]);

  // Calculate distance whenever locations change
  useEffect(() => {
    if (collectorLocation && userLocation) {
      const dist = calculateDistance(
        collectorLocation.latitude,
        collectorLocation.longitude,
        userLocation.lat,
        userLocation.lng,
      );
      console.log("SimpleMapTracker: Distance calculated", {
        distance: dist,
        collector: {
          lat: collectorLocation.latitude,
          lng: collectorLocation.longitude,
        },
        user: userLocation,
      });
      setDistance(dist);
    } else {
      console.log("SimpleMapTracker: Cannot calculate distance", {
        hasCollectorLocation: !!collectorLocation,
        hasUserLocation: !!userLocation,
      });
    }
  }, [collectorLocation, userLocation]);

  const getDistanceColor = () => {
    if (!distance) return "text-gray-500";
    if (distance < 0.05) return "text-green-600"; // 50m
    if (distance < 0.1) return "text-green-500"; // 100m
    if (distance < 0.5) return "text-amber-500"; // 500m
    if (distance < 1) return "text-blue-500"; // 1km
    return "text-blue-600";
  };

  const getDistanceStatus = () => {
    if (!userLocation)
      return {
        message: "📍 User location not available",
        emoji: "⚠️",
      };
    if (!distance) return { message: "Loading location...", emoji: "📡" };
    if (distance < 0.05)
      return { message: "🎉 Arriving now!", time: "Less than 1 min" };
    if (distance < 0.1)
      return { message: "⏰ Almost there!", time: "About 2 mins" };
    if (distance < 0.25)
      return { message: "🚗 Very close", time: "About 5 mins" };
    if (distance < 0.5)
      return { message: "🚗 Getting closer", time: "About 8 mins" };
    if (distance < 1)
      return { message: "📍 On the way", time: "About 15 mins" };
    if (distance < 2)
      return { message: "🚚 Heading to you", time: "About 25 mins" };
    return {
      message: "🚚 Started journey",
      time: `About ${Math.ceil(distance * 20)} mins`,
    };
  };

  const status = getDistanceStatus();

  // Simple ASCII map representation
  const renderSimpleMap = () => {
    if (!userLocation) return null;

    const distKm = distance || 0;
    const maxDist = 5; // Show 5km range

    return (
      <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg p-6 mb-4 border border-blue-200">
        {/* Simple visual representation */}
        <div className="space-y-4">
          {/* Collector position from top */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="w-full bg-gradient-to-r from-orange-200 to-orange-100 rounded-lg p-3 border border-orange-300">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-orange-600" />
                <span className="font-semibold text-orange-900">
                  {collectorName}
                </span>
              </div>
              <p className="text-xs text-orange-700">
                {collectorLocation
                  ? `📍 ${collectorLocation.latitude.toFixed(
                      4,
                    )}, ${collectorLocation.longitude.toFixed(4)}`
                  : "Loading location..."}
              </p>
            </div>
          </motion.div>

          {/* Distance indicator bar */}
          <div className="relative h-20 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
            {/* Road line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400 transform -translate-y-1/2"></div>

            {/* Collector position dot */}
            {distance !== null && distance <= maxDist && (
              <motion.div
                animate={{ y: "50%", x: `${(distance / maxDist) * 90}%` }}
                transition={{ duration: 1, ease: "linear" }}
                className="absolute transform -translate-y-1/2 -translate-x-1/2"
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-6 h-6 bg-orange-500 rounded-full border-4 border-orange-300"
                  />
                </div>
              </motion.div>
            )}

            {/* User position (always on right) */}
            <motion.div
              animate={{ y: "50%", x: "95%" }}
              className="absolute transform -translate-y-1/2 -translate-x-full"
            >
              <div className="w-6 h-6 bg-blue-500 rounded-lg border-4 border-blue-300 flex items-center justify-center">
                <span className="text-xs">📍</span>
              </div>
            </motion.div>

            {/* Labels */}
            <div className="absolute bottom-1 left-2 text-xs font-semibold text-gray-600">
              Collector
            </div>
            <div className="absolute bottom-1 right-2 text-xs font-semibold text-blue-600">
              You
            </div>

            {/* Distance on top */}
            {distance !== null && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-center">
                <p className={`text-lg font-bold ${getDistanceColor()}`}>
                  {distance < 0.1
                    ? `${(distance * 1000).toFixed(0)}m`
                    : `${distance.toFixed(2)}km`}
                </p>
              </div>
            )}
          </div>

          {/* User location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="w-full bg-gradient-to-r from-blue-200 to-blue-100 rounded-lg p-3 border border-blue-300">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  Your Location
                </span>
              </div>
              <p className="text-xs text-blue-700">
                📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-orange-600 animate-pulse" />
                <span>Live Tracking</span>
              </div>
              <Badge className="bg-green-500 text-white animate-pulse">
                🔴 Live
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Simple Map */}
            {renderSimpleMap()}

            {/* Status Display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-6 border-2 border-orange-200 text-center"
            >
              <p className="text-4xl mb-2">{status.emoji}</p>
              <p className="text-2xl font-bold text-orange-600 mb-1">
                {status.message}
              </p>
              {status.time && (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  {status.time}
                </p>
              )}

              {distance !== null && (
                <motion.p
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`text-xl font-bold mt-3 ${getDistanceColor()}`}
                >
                  {distance < 0.1
                    ? `${(distance * 1000).toFixed(0)}m away`
                    : `${distance.toFixed(2)}km away`}
                </motion.p>
              )}
            </motion.div>

            {/* Location Auto-Update Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 flex items-start gap-2">
              <ChevronDown className="w-4 h-4 flex-shrink-0 mt-0.5 animate-bounce" />
              <div>
                <p className="font-semibold">Real-time tracking active</p>
                <p>
                  Collector location updates automatically every few seconds
                </p>
              </div>
            </div>

            {/* Collector Contact */}
            {collectorName && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-muted-foreground mb-2">
                  Assigned Collector
                </p>
                <p className="font-semibold text-foreground mb-3">
                  {collectorName}
                </p>
                <a
                  href={`tel:${collectorPhone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  📞 Call Collector
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SimpleMapTracker;

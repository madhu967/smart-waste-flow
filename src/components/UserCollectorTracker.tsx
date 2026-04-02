import { useState, useEffect } from "react";
import {
  listenToCollectorLocation,
  calculateDistance,
} from "@/services/locationService";
import { LiveLocation } from "@/services/locationService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Unsubscribe } from "firebase/firestore";
import {
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  AtSign,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

interface UserCollectorTrackerProps {
  collectorId: string;
  collectorName: string;
  collectorPhone: string;
  userLocation: { lat: number; lng: number } | null;
  pickupId?: string;
}

export const UserCollectorTracker = ({
  collectorId,
  collectorName,
  collectorPhone,
  userLocation,
  pickupId,
}: UserCollectorTrackerProps) => {
  const [collectorLocation, setCollectorLocation] =
    useState<LiveLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unsubscribe, setUnsubscribe] = useState<Unsubscribe | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsub = listenToCollectorLocation(collectorId, (location) => {
      setCollectorLocation(location);
      setIsLoading(false);
    });
    setUnsubscribe(() => unsub);

    return () => {
      unsub();
    };
  }, [collectorId]);

  useEffect(() => {
    if (collectorLocation && userLocation) {
      const dist = calculateDistance(
        collectorLocation.latitude,
        collectorLocation.longitude,
        userLocation.lat,
        userLocation.lng,
      );
      setDistance(dist);
    }
  }, [collectorLocation, userLocation]);

  const getDistanceColor = () => {
    if (!distance) return "text-gray-500";
    if (distance < 0.1) return "text-green-600";
    if (distance < 0.5) return "text-amber-600";
    return "text-blue-600";
  };

  const getDistanceMessage = () => {
    if (!distance) return "Waiting for update...";
    if (distance < 0.05) return "🎉 Arriving now!";
    if (distance < 0.1) return "⏰ Almost there!";
    if (distance < 0.5) return "🚗 Very close";
    if (distance < 1) return "📍 On the way";
    return "🚚 Heading to you";
  };

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 mb-1">
              <Navigation className="w-5 h-5 text-orange-600" />
              Live Tracking
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Collector is on the way
            </p>
          </div>
          {!isLoading && collectorLocation && (
            <Badge className="bg-green-100 text-green-800 animate-pulse">
              📍 Live
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Map Container */}
        <div className="border rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          <div className="relative w-full h-64 bg-gradient-to-br from-slate-100 to-slate-200">
            {/* Background Grid */}
            <svg
              className="absolute inset-0 w-full h-full opacity-10"
              viewBox="0 0 400 400"
            >
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* User Location Marker (Your Location) */}
            {userLocation && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-center mt-2 whitespace-nowrap text-blue-700">
                  Your Location
                </p>
              </motion.div>
            )}

            {/* Collector Location Marker */}
            {collectorLocation && (
              <motion.div
                animate={{
                  top: `${
                    50 +
                    (collectorLocation.latitude - (userLocation?.lat || 0)) *
                      100
                  }%`,
                  left: `${
                    50 +
                    (collectorLocation.longitude - (userLocation?.lng || 0)) *
                      100
                  }%`,
                }}
                className="absolute w-12 h-12 transform -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-500"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-12 h-12 bg-orange-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-white animate-pulse" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-center mt-2 whitespace-nowrap">
                  {collectorName}
                </p>
              </motion.div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Getting live location...
                  </p>
                </div>
              </div>
            )}

            {/* Distance Display */}
            {distance !== null && !isLoading && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
              >
                <div className="bg-white/95 px-6 py-4 rounded-xl shadow-lg backdrop-blur border border-white/20">
                  <p className="text-center text-sm text-gray-600 mb-2">
                    Distance Away
                  </p>
                  <p className="text-3xl font-bold text-orange-600 text-center">
                    {distance < 1
                      ? `${(distance * 1000).toFixed(0)}m`
                      : `${distance.toFixed(2)}km`}
                  </p>
                  <p
                    className={`text-center text-sm font-semibold mt-3 ${getDistanceColor()}`}
                  >
                    {getDistanceMessage()}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Location Details */}
          {collectorLocation && (
            <div className="p-4 bg-gray-50 border-t space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Your Location:</span>
                <span className="font-mono text-xs">
                  {userLocation
                    ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Collector Location:</span>
                <span className="font-mono text-xs">
                  {collectorLocation.latitude.toFixed(4)},
                  {collectorLocation.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Collector Info */}
        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
          <p className="font-semibold text-foreground mb-3">{collectorName}</p>
          <div className="flex gap-2">
            <a
              href={`tel:${collectorPhone}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition font-medium text-sm"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
            <a
              href={`sms:${collectorPhone}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition font-medium text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </a>
          </div>
        </div>

        {/* Status */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            {collectorLocation ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>
                  <strong>Tracking Active:</strong> Real-time location updates
                </span>
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Waiting for collector to start tracking...</span>
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCollectorTracker;

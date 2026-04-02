import { useState, useEffect } from "react";
import {
  listenToCollectorLocation,
  listenToUserLocation,
  calculateDistance,
  getETA,
} from "@/services/locationService";
import { LiveLocation } from "@/services/locationService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Unsubscribe } from "firebase/firestore";
import {
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

interface LiveTrackerProps {
  collectorId: string;
  userId: string;
  collectorName: string;
  collectorPhone: string;
  userLocation: { lat: number; lng: number } | null;
  onArrival?: () => void;
  isCollector?: boolean; // if true, show collector's perspective
}

export const LiveTracker = ({
  collectorId,
  userId,
  collectorName,
  collectorPhone,
  userLocation,
  onArrival,
  isCollector = false,
}: LiveTrackerProps) => {
  const [collectorLocation, setCollectorLocation] =
    useState<LiveLocation | null>(null);
  const [userLocationData, setUserLocationData] = useState<LiveLocation | null>(
    null,
  );
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [locationPermission, setLocationPermission] = useState(true);
  const [unsubscribeCollector, setUnsubscribeCollector] =
    useState<Unsubscribe | null>(null);
  const [unsubscribeUser, setUnsubscribeUser] = useState<Unsubscribe | null>(
    null,
  );

  // Listen to collector and user locations
  useEffect(() => {
    // Listen to collector location
    const unsubCollector = listenToCollectorLocation(
      collectorId,
      (location) => {
        setCollectorLocation(location);
      },
    );
    setUnsubscribeCollector(() => unsubCollector);

    // Listen to user location
    const unsubUser = listenToUserLocation(userId, (location) => {
      setUserLocationData(location);
    });
    setUnsubscribeUser(() => unsubUser);

    return () => {
      unsubCollector();
      unsubUser();
    };
  }, [collectorId, userId]);

  // Calculate distance and ETA
  useEffect(() => {
    if (
      collectorLocation &&
      userLocation &&
      (!userLocationData ||
        (userLocationData &&
          userLocationData.latitude &&
          userLocationData.longitude))
    ) {
      const targetLat = userLocation.lat;
      const targetLng = userLocation.lng;
      const dist = calculateDistance(
        collectorLocation.latitude,
        collectorLocation.longitude,
        targetLat,
        targetLng,
      );
      setDistance(dist);
      setEta(getETA(dist));

      // Trigger arrival callback when distance < 100m
      if (dist < 0.1 && onArrival) {
        onArrival();
      }
    }
  }, [collectorLocation, userLocation, userLocationData, onArrival]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {!locationPermission && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Location permission is required for live tracking. Please enable
            location access in your device settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Map Placeholder - In production, use Google Maps API */}
      <Card className="mb-6 overflow-hidden">
        <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 h-64 flex items-center justify-center">
          {/* Map Background */}
          <div className="absolute inset-0 bg-blue-50 opacity-50" />

          {/* Collector Icon */}
          {collectorLocation && (
            <motion.div
              animate={{
                x:
                  (collectorLocation.longitude - (userLocation?.lng || 0)) *
                  1000,
                y:
                  (collectorLocation.latitude - (userLocation?.lat || 0)) *
                  1000,
              }}
              className="absolute w-8 h-8 bg-orange-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
            >
              <Navigation className="w-4 h-4 text-white" />
            </motion.div>
          )}

          {/* User Icon */}
          {userLocation && (
            <div className="absolute w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
          )}

          {/* Map Info Card Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-md p-4 z-10">
            {distance !== null ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Distance</span>
                  <span className="text-lg font-bold text-orange-600">
                    {distance < 1
                      ? `${(distance * 1000).toFixed(0)}m`
                      : `${distance.toFixed(1)}km`}
                  </span>
                </div>
                {eta !== null && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-600">
                      ETA: {eta} minute{eta !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading location...</div>
            )}
          </div>
        </div>
      </Card>

      {/* Collector Details Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
              {collectorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{collectorName}</h3>
              <p className="text-sm text-gray-500">
                {isCollector ? "Your Information" : "Your Collector"}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Status</span>
            {distance && distance < 0.1 ? (
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Arrived
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600 font-semibold">
                <Navigation className="w-4 h-4 animate-spin" />
                On the way
              </div>
            )}
          </div>

          {/* Location Details */}
          {collectorLocation && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Current Location</p>
              <p className="text-sm font-mono">
                {collectorLocation.latitude.toFixed(4)},{" "}
                {collectorLocation.longitude.toFixed(4)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                // In production, integrate with call service
                window.location.href = `tel:${collectorPhone}`;
              }}
            >
              <Phone className="w-4 h-4" />
              Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                // In production, integrate with chat service
              }}
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ETA Card */}
      {eta !== null && distance !== null && distance >= 0.1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm mb-2">Estimated Arrival</p>
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {eta}
              </div>
              <p className="text-gray-600 text-sm">
                minute{eta !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {distance < 1
                  ? `${(distance * 1000).toFixed(0)}m away`
                  : `${distance.toFixed(2)}km away`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Arrived Message */}
      {distance !== null && distance < 0.1 && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center"
        >
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="font-semibold text-green-800">Collector has arrived!</p>
          <p className="text-sm text-green-700">Please be ready for pickup</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LiveTracker;

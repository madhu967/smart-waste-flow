import { db } from "@/config/firebase";
import {
  doc,
  updateDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";

/**
 * Get human-readable error message from GeolocationPositionError
 */
const getGeolocationErrorMessage = (
  error: GeolocationPositionError,
): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission denied. Please:\n1. Click the location icon in your address bar\n2. Select 'Allow' for this website\n3. Refresh the page and try again";
    case error.POSITION_UNAVAILABLE:
      return "Your location is unavailable. Please enable GPS/location services on your device";
    case error.TIMEOUT:
      return "Location request timed out. Please move to an area with better signal and try again";
    default:
      return "Unable to get your location. Please check your device settings";
  }
};

export interface LiveLocation {
  uid: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
}

export interface TrackingSession {
  id: string;
  collectorId: string;
  userId: string;
  pickupId: string;
  startTime: Date;
  endTime?: Date;
  collectorLocation: LiveLocation | null;
  userLocation: LiveLocation | null;
  status: "active" | "completed" | "cancelled";
}

/**
 * Start tracking collector's location during pickup
 * Updates location in real-time
 */
export const startLocationTracking = async (
  userId: string,
  callback: (error: string | null) => void,
): Promise<Unsubscribe | null> => {
  if (!navigator.geolocation) {
    const msg = "Geolocation is not supported by your browser";
    console.error(msg);
    callback(msg);
    return null;
  }

  // Start continuous location tracking
  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      try {
        await setDoc(
          doc(db, "users", userId),
          {
            currentLocation: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: Timestamp.now(),
              accuracy: position.coords.accuracy,
            },
            lastLocationUpdate: Timestamp.now(),
          },
          { merge: true },
        );
        callback(null); // Clear any previous errors
      } catch (error) {
        console.error("Failed to update location:", error);
      }
    },
    (error) => {
      const errorMsg = getGeolocationErrorMessage(error);
      console.error("Geolocation error:", errorMsg);
      callback(errorMsg);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );

  // Return unsubscribe function
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};

/**
 * Start tracking collector's location
 */
export const startCollectorTracking = async (
  collectorId: string,
  callback: (error: string | null) => void,
): Promise<Unsubscribe | null> => {
  if (!navigator.geolocation) {
    const msg = "Geolocation is not supported by your browser";
    console.error(msg);
    callback(msg);
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      try {
        await setDoc(
          doc(db, "collectors", collectorId),
          {
            currentLocation: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: Timestamp.now(),
              accuracy: position.coords.accuracy,
            },
            lastLocationUpdate: Timestamp.now(),
          },
          { merge: true },
        );
        callback(null); // Clear any previous errors
      } catch (error) {
        console.error("Failed to update collector location:", error);
      }
    },
    (error) => {
      const errorMsg = getGeolocationErrorMessage(error);
      console.error("Geolocation error:", errorMsg);
      callback(errorMsg);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};

/**
 * Listen to real-time location updates of a user
 */
export const listenToUserLocation = (
  userId: string,
  callback: (location: LiveLocation | null) => void,
): Unsubscribe => {
  return onSnapshot(doc(db, "users", userId), (doc) => {
    if (doc.exists() && doc.data().currentLocation) {
      const locationData = doc.data().currentLocation;
      callback({
        uid: userId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: locationData.timestamp?.toDate() || new Date(),
        accuracy: locationData.accuracy,
      });
    } else {
      callback(null);
    }
  });
};

/**
 * Listen to real-time location updates of a collector
 */
export const listenToCollectorLocation = (
  collectorId: string,
  callback: (location: LiveLocation | null) => void,
): Unsubscribe => {
  return onSnapshot(doc(db, "collectors", collectorId), (doc) => {
    if (doc.exists() && doc.data().currentLocation) {
      const locationData = doc.data().currentLocation;
      callback({
        uid: collectorId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: locationData.timestamp?.toDate() || new Date(),
        accuracy: locationData.accuracy,
      });
    } else {
      callback(null);
    }
  });
};

/**
 * Calculate distance between two coordinates (in kilometers)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Stop all location tracking
 */
export const stopLocationTracking = (unsubscribe: Unsubscribe | null) => {
  if (unsubscribe) {
    unsubscribe();
  }
};

/**
 * Get estimated time of arrival (simplified)
 */
export const getETA = (distance: number): number => {
  // Assuming average speed of 30 km/h in city traffic
  const speedKmPerHour = 30;
  return Math.ceil((distance / speedKmPerHour) * 60); // Returns minutes
};

/**
 * Update user location once (non-continuous)
 */
export const updateUserLocationOnce = async (userId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await setDoc(
            doc(db, "users", userId),
            {
              currentLocation: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: Timestamp.now(),
                accuracy: position.coords.accuracy,
              },
              lastLocationUpdate: Timestamp.now(),
            },
            { merge: true },
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });
};

/**
 * Mark collector as arrived at user location
 */
export const markCollectorArrived = async (pickupId: string): Promise<void> => {
  try {
    await setDoc(
      doc(db, "spotPickups", pickupId),
      {
        status: "arrived",
        arrivalTime: Timestamp.now(),
        trackingStatus: "completed",
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Failed to mark arrival:", error);
    throw error;
  }
};

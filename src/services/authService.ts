import { auth, db } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import {
  createUser,
  getUser,
  createWeeklyPickup,
  getWeeklyPickupsByUser,
} from "@/services/firestoreService";
import { User, UserRole, WeeklyPickup } from "@/types/database";
import { WEEKLY_PICKUP_SCHEDULE } from "@/constants/app";

/**
 * Sign up a new user with email and password
 * Creates user account in Firebase Auth and user document in Firestore
 * Auto-allocates weekly pickup based on street
 */
export const signUpUser = async (
  email: string,
  password: string,
  name: string,
  city: string,
  street: string,
  address: string,
  phone?: string,
): Promise<User> => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const firebaseUser = userCredential.user;

    // Update Firebase Auth profile
    await updateProfile(firebaseUser, {
      displayName: name,
    });

    // Create user document in Firestore
    const userData: Omit<User, "id" | "createdAt" | "updatedAt"> = {
      name,
      email,
      phone,
      city,
      street,
      address,
      role: "user",
      isActive: true,
    };

    await createUser(userData);

    // Fetch the created user
    const user = await getUser(firebaseUser.uid);
    if (!user) throw new Error("Failed to create user record");

    // Auto-allocate weekly pickup based on street
    await allocateWeeklyPickup(firebaseUser.uid, street);

    return user;
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      throw new Error("Email already in use");
    } else if (error.code === "auth/weak-password") {
      throw new Error("Password is too weak. Use at least 6 characters");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address");
    }
    throw new Error(error.message || "Failed to create account");
  }
};

/**
 * Sign in a user with email and password
 * Checks both user and collector accounts
 */
export const signInUser = async (
  email: string,
  password: string,
): Promise<User | any> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const firebaseUser = userCredential.user;

    // Try to fetch user data from Firestore users collection
    let user = await getUser(firebaseUser.uid);

    if (!user) {
      // If not a regular user, check if it's a collector
      const { getCollectorByUid, getCollectorByEmail } =
        await import("@/services/firestoreService");

      let collector = await getCollectorByUid(firebaseUser.uid);

      // Fallback: if no collector found by uid, try by email
      if (!collector) {
        collector = await getCollectorByEmail(email);
      }

      if (!collector) {
        throw new Error("User record not found");
      }

      return collector;
    }

    return user;
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      throw new Error("Email not registered");
    } else if (error.code === "auth/wrong-password") {
      throw new Error("Incorrect password");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address");
    } else if (error.code === "auth/user-disabled") {
      throw new Error("Account has been disabled");
    }
    throw new Error(error.message || "Failed to sign in");
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign out");
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      throw new Error("Email not registered");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address");
    }
    throw new Error(error.message || "Failed to send reset email");
  }
};

/**
 * Get current authenticated Firebase user
 */
export const getCurrentAuthUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Get current user data from Firestore
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;

  try {
    const user = await getUser(firebaseUser.uid);
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChanged = (
  callback: (user: FirebaseUser | null) => void,
) => {
  return auth.onAuthStateChanged(callback);
};

/**
 * Allocate weekly pickup for a user based on their street
 */
const allocateWeeklyPickup = async (
  userId: string,
  street: string,
): Promise<void> => {
  try {
    // Get schedule for the street
    const schedule =
      WEEKLY_PICKUP_SCHEDULE[street as keyof typeof WEEKLY_PICKUP_SCHEDULE];
    if (!schedule) {
      console.warn(`No pickup schedule found for street: ${street}`);
      return;
    }

    // Calculate next pickup date
    const today = new Date();
    const currentDay = today.getDay();
    let nextPickupDate = new Date(today);

    // If today is the pickup day and it's before 9 AM, schedule for today
    // Otherwise, schedule for next week's pickup day
    const targetDay = schedule.dayIndex;
    const daysUntilPickup = targetDay - currentDay;

    if (daysUntilPickup > 0) {
      // Upcoming day this week
      nextPickupDate.setDate(today.getDate() + daysUntilPickup);
    } else if (daysUntilPickup === 0 && today.getHours() < 9) {
      // Today is pickup day and it's before 9 AM
      // Keep today's date
    } else {
      // Schedule for next week
      nextPickupDate.setDate(today.getDate() + (7 - currentDay + targetDay));
    }

    // Set time to 9:00 AM
    nextPickupDate.setHours(9, 0, 0, 0);

    // Create weekly pickup record
    const weeklyPickupData: Omit<
      WeeklyPickup,
      "id" | "createdAt" | "updatedAt"
    > = {
      userId,
      street,
      pickupDay: schedule.day,
      nextPickupDate,
      status: "scheduled",
    };

    await createWeeklyPickup(weeklyPickupData);
  } catch (error) {
    console.error("Failed to allocate weekly pickup:", error);
  }
};

/**
 * Check if a user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};

/**
 * Get authentication token
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return (await auth.currentUser?.getIdToken()) || null;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
};

/**
 * Create a new collector account (weekly or spot)
 * Creates Firebase Auth user and Firestore collector document
 * Returns the credentials for admin to share with collector
 */
export const createCollectorAccount = async (
  email: string,
  password: string,
  name: string,
  phone: string,
  role: "weekly_collector" | "spot_collector",
  assignedStreets?: string[],
): Promise<{ email: string; password: string; uid: string }> => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const firebaseUser = userCredential.user;

    // Update Firebase Auth profile
    await updateProfile(firebaseUser, {
      displayName: name,
    });

    // Create collector document in Firestore with uid field
    const { createCollector } = await import("@/services/firestoreService");

    await createCollector({
      uid: firebaseUser.uid,
      name,
      email,
      phone,
      role,
      assignedStreets: assignedStreets || [],
      currentTasks: [],
      totalCollections: 0,
    });

    // Return credentials for admin to share
    return {
      email,
      password,
      uid: firebaseUser.uid,
    };
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      throw new Error("Email already in use");
    } else if (error.code === "auth/weak-password") {
      throw new Error("Password is too weak. Use at least 6 characters");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address");
    }
    throw new Error(error.message || "Failed to create collector account");
  }
};

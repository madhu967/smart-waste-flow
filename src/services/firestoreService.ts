import { db, auth, storage } from "@/config/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  QueryConstraint,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  User,
  WeeklyPickup,
  SpotPickup,
  Collector,
  Slot,
  Wallet,
  Transaction,
  SustainabilityMetrics,
  Prices,
  WasteCategory,
} from "@/types/database";

// ===== UTILITY FUNCTIONS =====

const convertTimestamps = (data: any): any => {
  if (data instanceof Timestamp) {
    return data.toDate();
  }
  if (data && typeof data === "object") {
    return Object.keys(data).reduce(
      (acc, key) => {
        acc[key] = convertTimestamps(data[key]);
        return acc;
      },
      Array.isArray(data) ? [] : {},
    );
  }
  return data;
};

// ===== USER OPERATIONS =====

export const createUser = async (
  user: Omit<User, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("No user authenticated");

  const userData: User = {
    ...user,
    id: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(doc(db, "users", userId), {
    ...userData,
    createdAt: Timestamp.fromDate(userData.createdAt),
    updatedAt: Timestamp.fromDate(userData.updatedAt),
  });

  // Create wallet for user
  await createWallet(userId);

  // Create sustainability metrics for user
  await createSustainabilityMetrics(userId);

  return userId;
};

export const getUser = async (userId: string): Promise<User | null> => {
  const docSnap = await getDoc(doc(db, "users", userId));
  if (!docSnap.exists()) return null;
  return convertTimestamps(docSnap.data()) as User;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const q = query(collection(db, "users"), where("email", "==", email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return convertTimestamps(querySnapshot.docs[0].data()) as User;
};

export const updateUser = async (
  userId: string,
  data: Partial<User>,
): Promise<void> => {
  await setDoc(
    doc(db, "users", userId),
    {
      ...data,
      updatedAt: Timestamp.fromDate(new Date()),
    },
    { merge: true },
  );
};

export const getAllUsers = async (role?: string): Promise<User[]> => {
  let q;
  if (role) {
    q = query(collection(db, "users"), where("role", "==", role));
  } else {
    q = query(collection(db, "users"));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => convertTimestamps(doc.data()) as User);
};

// ===== WEEKLY PICKUPS OPERATIONS =====

export const createWeeklyPickup = async (
  pickup: Omit<WeeklyPickup, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const pickupRef = doc(collection(db, "weeklyPickups"));
  const pickupData: WeeklyPickup = {
    ...pickup,
    id: pickupRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(pickupRef, {
    ...pickupData,
    createdAt: Timestamp.fromDate(pickupData.createdAt),
    updatedAt: Timestamp.fromDate(pickupData.updatedAt),
    nextPickupDate: Timestamp.fromDate(pickupData.nextPickupDate),
  });

  return pickupRef.id;
};

export const getWeeklyPickupsByUser = async (
  userId: string,
): Promise<WeeklyPickup[]> => {
  const q = query(
    collection(db, "weeklyPickups"),
    where("userId", "==", userId),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => convertTimestamps(doc.data()) as WeeklyPickup,
  );
};

export const getWeeklyPickupsByCollector = async (
  collectorId: string,
): Promise<WeeklyPickup[]> => {
  const q = query(
    collection(db, "weeklyPickups"),
    where("collectorId", "==", collectorId),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => convertTimestamps(doc.data()) as WeeklyPickup,
  );
};

export const updateWeeklyPickup = async (
  pickupId: string,
  data: Partial<WeeklyPickup>,
): Promise<void> => {
  await updateDoc(doc(db, "weeklyPickups", pickupId), {
    ...data,
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

// ===== SPOT PICKUPS OPERATIONS =====

export const createSpotPickup = async (
  pickup: Omit<SpotPickup, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const pickupRef = doc(collection(db, "spotPickups"));
  const pickupData: SpotPickup = {
    ...pickup,
    id: pickupRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(pickupRef, {
    ...pickupData,
    createdAt: Timestamp.fromDate(pickupData.createdAt),
    updatedAt: Timestamp.fromDate(pickupData.updatedAt),
    pickupDate: Timestamp.fromDate(pickupData.pickupDate),
    collectionDetails: pickupData.collectionDetails
      ? {
          ...pickupData.collectionDetails,
          collectionDate: pickupData.collectionDetails.collectionDate
            ? Timestamp.fromDate(pickupData.collectionDetails.collectionDate)
            : null,
        }
      : null,
  });

  return pickupRef.id;
};

export const getSpotPickup = async (
  pickupId: string,
): Promise<SpotPickup | null> => {
  const docSnap = await getDoc(doc(db, "spotPickups", pickupId));
  if (!docSnap.exists()) return null;
  return convertTimestamps(docSnap.data()) as SpotPickup;
};

export const getSpotPickupsByUser = async (
  userId: string,
): Promise<SpotPickup[]> => {
  const q = query(collection(db, "spotPickups"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => convertTimestamps(doc.data()) as SpotPickup,
  );
};

export const getSpotPickupsByCollector = async (
  collectorId: string,
): Promise<SpotPickup[]> => {
  const q = query(
    collection(db, "spotPickups"),
    where("collectorId", "==", collectorId),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => convertTimestamps(doc.data()) as SpotPickup,
  );
};

export const getPendingSpotPickups = async (): Promise<SpotPickup[]> => {
  const q = query(
    collection(db, "spotPickups"),
    where("status", "==", "pending"),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => convertTimestamps(doc.data()) as SpotPickup,
  );
};

export const updateSpotPickup = async (
  pickupId: string,
  data: Partial<SpotPickup>,
): Promise<void> => {
  const updateData: any = { ...data };
  if (data.pickupDate) {
    updateData.pickupDate = Timestamp.fromDate(data.pickupDate);
  }
  if (data.collectionDetails?.collectionDate) {
    updateData.collectionDetails = {
      ...data.collectionDetails,
      collectionDate: Timestamp.fromDate(data.collectionDetails.collectionDate),
    };
  }

  await updateDoc(doc(db, "spotPickups", pickupId), {
    ...updateData,
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

// ===== COLLECTOR OPERATIONS =====

export const createCollector = async (
  collector: Omit<Collector, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const collectorRef = doc(collection(db, "collectors"));
  const collectorData: Collector = {
    ...collector,
    id: collectorRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(collectorRef, {
    ...collectorData,
    createdAt: Timestamp.fromDate(collectorData.createdAt),
    updatedAt: Timestamp.fromDate(collectorData.updatedAt),
  });

  return collectorRef.id;
};

export const getCollector = async (
  collectorId: string,
): Promise<Collector | null> => {
  const docSnap = await getDoc(doc(db, "collectors", collectorId));
  if (!docSnap.exists()) return null;
  return convertTimestamps(docSnap.data()) as Collector;
};

export const getCollectorsByRole = async (
  role: "weekly_collector" | "spot_collector",
): Promise<Collector[]> => {
  const q = query(collection(db, "collectors"), where("role", "==", role));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => convertTimestamps(doc.data()) as Collector,
  );
};

export const getCollectorByUid = async (
  uid: string,
): Promise<Collector | null> => {
  const q = query(collection(db, "collectors"), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...convertTimestamps(doc.data()),
  } as Collector;
};

export const getCollectorByEmail = async (
  email: string,
): Promise<Collector | null> => {
  const q = query(collection(db, "collectors"), where("email", "==", email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...convertTimestamps(doc.data()),
  } as Collector;
};

export const updateCollector = async (
  collectorId: string,
  data: Partial<Collector>,
): Promise<void> => {
  await updateDoc(doc(db, "collectors", collectorId), {
    ...data,
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

export const addTaskToCollector = async (
  collectorId: string,
  taskId: string,
): Promise<void> => {
  await updateDoc(doc(db, "collectors", collectorId), {
    currentTasks: arrayUnion(taskId),
  });
};

export const removeTaskFromCollector = async (
  collectorId: string,
  taskId: string,
): Promise<void> => {
  await updateDoc(doc(db, "collectors", collectorId), {
    currentTasks: arrayRemove(taskId),
  });
};

// ===== SLOTS OPERATIONS =====

export const createSlot = async (
  slot: Omit<Slot, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const slotRef = doc(collection(db, "slots"));
  const slotData: Slot = {
    ...slot,
    id: slotRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(slotRef, {
    ...slotData,
    createdAt: Timestamp.fromDate(slotData.createdAt),
    updatedAt: Timestamp.fromDate(slotData.updatedAt),
    date: Timestamp.fromDate(slotData.date),
  });

  return slotRef.id;
};

export const getAvailableSlots = async (): Promise<Slot[]> => {
  const q = query(collection(db, "slots"), where("isAvailable", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => convertTimestamps(doc.data()) as Slot);
};

export const getAllSlots = async (): Promise<Slot[]> => {
  const querySnapshot = await getDocs(collection(db, "slots"));
  return querySnapshot.docs.map((doc) => convertTimestamps(doc.data()) as Slot);
};

export const updateSlot = async (
  slotId: string,
  data: Partial<Slot>,
): Promise<void> => {
  const updateData: any = { ...data };
  if (data.date) {
    updateData.date = Timestamp.fromDate(data.date);
  }

  await updateDoc(doc(db, "slots", slotId), {
    ...updateData,
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

export const deleteSlot = async (slotId: string): Promise<void> => {
  await deleteDoc(doc(db, "slots", slotId));
};

// ===== WALLET OPERATIONS =====

export const createWallet = async (userId: string): Promise<string> => {
  const walletRef = doc(collection(db, "wallets"));
  const walletData: Wallet = {
    id: walletRef.id,
    userId,
    balance: 0,
    totalEarnings: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(walletRef, {
    ...walletData,
    createdAt: Timestamp.fromDate(walletData.createdAt),
    updatedAt: Timestamp.fromDate(walletData.updatedAt),
  });

  return walletRef.id;
};

export const getWalletByUser = async (
  userId: string,
): Promise<Wallet | null> => {
  const q = query(collection(db, "wallets"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return convertTimestamps(querySnapshot.docs[0].data()) as Wallet;
};

export const updateWalletBalance = async (
  walletId: string,
  amount: number,
): Promise<void> => {
  await updateDoc(doc(db, "wallets", walletId), {
    balance: increment(amount),
    totalEarnings: increment(amount > 0 ? amount : 0),
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

// ===== TRANSACTION OPERATIONS =====

export const createTransaction = async (
  transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const transRef = doc(collection(db, "transactions"));
  const transData: Transaction = {
    ...transaction,
    id: transRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(transRef, {
    ...transData,
    createdAt: Timestamp.fromDate(transData.createdAt),
    updatedAt: Timestamp.fromDate(transData.updatedAt),
  });

  return transRef.id;
};

export const getTransactionsByUser = async (
  userId: string,
): Promise<Transaction[]> => {
  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => convertTimestamps(doc.data()) as Transaction,
  );
};

export const getTransactionsByWallet = async (
  walletId: string,
): Promise<Transaction[]> => {
  const q = query(
    collection(db, "transactions"),
    where("walletId", "==", walletId),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => convertTimestamps(doc.data()) as Transaction,
  );
};

// ===== SUSTAINABILITY METRICS OPERATIONS =====

export const createSustainabilityMetrics = async (
  userId: string,
): Promise<string> => {
  const metricsRef = doc(collection(db, "sustainabilityMetrics"));
  const metricsData: SustainabilityMetrics = {
    id: metricsRef.id,
    userId,
    totalWastCollected: 0,
    co2Reduced: 0,
    recyclables: 0,
    sustainabilityScore: 0,
    metalWasteTotal: 0,
    nonMetalWasteTotal: 0,
    pickupCount: 0,
    badges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(metricsRef, {
    ...metricsData,
    createdAt: Timestamp.fromDate(metricsData.createdAt),
    updatedAt: Timestamp.fromDate(metricsData.updatedAt),
  });

  return metricsRef.id;
};

export const getSustainabilityMetrics = async (
  userId: string,
): Promise<SustainabilityMetrics | null> => {
  const q = query(
    collection(db, "sustainabilityMetrics"),
    where("userId", "==", userId),
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return convertTimestamps(
    querySnapshot.docs[0].data(),
  ) as SustainabilityMetrics;
};

export const updateSustainabilityMetrics = async (
  metricsId: string,
  data: Partial<SustainabilityMetrics>,
): Promise<void> => {
  await updateDoc(doc(db, "sustainabilityMetrics", metricsId), {
    ...data,
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

// ===== PRICES OPERATIONS =====

export const getPrices = async (): Promise<Prices | null> => {
  const querySnapshot = await getDocs(collection(db, "prices"));
  if (querySnapshot.empty) return null;
  return convertTimestamps(querySnapshot.docs[0].data()) as Prices;
};

export const updatePrices = async (
  pricesId: string,
  data: Partial<Prices>,
): Promise<void> => {
  await updateDoc(doc(db, "prices", pricesId), {
    ...data,
    lastUpdated: Timestamp.fromDate(new Date()),
  });
};

// ===== IMAGE UPLOAD =====

export const uploadCollectionImages = async (
  files: File[],
  collectionPath: string,
): Promise<string[]> => {
  const urls: string[] = [];

  for (const file of files) {
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `${collectionPath}/${filename}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    urls.push(downloadUrl);
  }

  return urls;
};

// ===== LIVE TRACKING OPERATIONS =====

/**
 * Start tracking for a spot pickup (collector and user see each other)
 */
export const startSpotPickupTracking = async (
  spotPickupId: string,
): Promise<void> => {
  await updateDoc(doc(db, "spotPickups", spotPickupId), {
    trackingStatus: "live",
    status: "in_transit",
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

/**
 * Start tracking for a weekly pickup
 */
export const startWeeklyPickupTracking = async (
  weeklyPickupId: string,
): Promise<void> => {
  await updateDoc(doc(db, "weeklyPickups", weeklyPickupId), {
    trackingStatus: "live",
    status: "in_transit",
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

/**
 * Update arrival time when collector arrives
 */
export const confirmArrival = async (
  pickupId: string,
  isSpotPickup: boolean = true,
): Promise<void> => {
  const collectionName = isSpotPickup ? "spotPickups" : "weeklyPickups";
  await updateDoc(doc(db, collectionName, pickupId), {
    status: "arrived",
    arrivalTime: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

/**
 * End tracking when collection is completed
 */
export const completePickupTracking = async (
  pickupId: string,
  isSpotPickup: boolean = true,
): Promise<void> => {
  const collectionName = isSpotPickup ? "spotPickups" : "weeklyPickups";
  await updateDoc(doc(db, collectionName, pickupId), {
    trackingStatus: "completed",
    status: "completed",
    completionTime: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

/**
 * Get active pickups for a user (pickups in transit or arrived)
 */
export const getActivePickupsForUser = async (
  userId: string,
): Promise<SpotPickup[]> => {
  // Get all pickups for the user
  const q = query(collection(db, "spotPickups"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);

  // Filter to only include pickups with a collector assigned and not completed/cancelled
  return querySnapshot.docs
    .map(
      (doc) =>
        ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        }) as SpotPickup,
    )
    .filter(
      (p) =>
        p.collectorId && p.status !== "completed" && p.status !== "cancelled",
    );
};

/**
 * Get active pickups for a collector (assigned pickups in transit)
 */
export const getActivePickupsForCollector = async (
  collectorId: string,
): Promise<SpotPickup[]> => {
  const q = query(
    collection(db, "spotPickups"),
    where("collectorId", "==", collectorId),
    where("trackingStatus", "==", "live"),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  }));
};

/**
 * Listen to active pickups for a user in real-time
 * Separates completed, pending, in-progress, and future pickups
 */
export const listenToActivePickupsForUser = (
  userId: string,
  callback: (pickups: {
    active: SpotPickup[];
    completed: SpotPickup[];
    pending: SpotPickup[];
  }) => void,
): Unsubscribe => {
  const q = query(collection(db, "spotPickups"), where("userId", "==", userId));

  return onSnapshot(q, (querySnapshot) => {
    const allPickups = querySnapshot.docs
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...convertTimestamps(doc.data()),
          }) as SpotPickup,
      )
      .sort(
        (a, b) =>
          new Date(b.pickupDate).getTime() - new Date(a.pickupDate).getTime(),
      );

    // Completed: explicitly marked as completed or cancelled
    const completed = allPickups.filter(
      (p) => p.status === "completed" || p.status === "cancelled",
    );

    // Active: has collector assigned AND is in progress (in_transit, arrived, in_progress)
    const active = allPickups.filter(
      (p) =>
        p.collectorId &&
        (p.status === "in_transit" ||
          p.status === "arrived" ||
          p.status === "in_progress" ||
          p.status === "accepted"),
    );

    // Pending: not assigned to a collector yet, OR assigned but not yet started
    const pending = allPickups.filter(
      (p) => !p.collectorId || (p.collectorId && p.status === "pending"),
    );

    callback({ active, completed, pending });
  });
};

// ===== WASTE CATEGORIES COLLECTION =====

export const createWasteCategory = async (
  category: Omit<WasteCategory, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const catRef = doc(collection(db, "wasteCategories"));
  const categoryData: WasteCategory = {
    ...category,
    id: catRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(catRef, {
    ...categoryData,
    createdAt: Timestamp.fromDate(categoryData.createdAt),
    updatedAt: Timestamp.fromDate(categoryData.updatedAt),
  });

  return catRef.id;
};

export const getActiveWasteCategories = async (): Promise<WasteCategory[]> => {
  const q = query(
    collection(db, "wasteCategories"),
    where("isActive", "==", true),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => convertTimestamps(doc.data()) as WasteCategory,
  );
};

export const getAllWasteCategories = async (): Promise<WasteCategory[]> => {
  const querySnapshot = await getDocs(collection(db, "wasteCategories"));
  return querySnapshot.docs.map(
    (doc) => convertTimestamps(doc.data()) as WasteCategory,
  );
};

export const updateWasteCategory = async (
  categoryId: string,
  data: Partial<WasteCategory>,
): Promise<void> => {
  await updateDoc(doc(db, "wasteCategories", categoryId), {
    ...data,
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

export const deleteWasteCategory = async (
  categoryId: string,
): Promise<void> => {
  await deleteDoc(doc(db, "wasteCategories", categoryId));
};

export const listenToActiveWasteCategories = (
  callback: (categories: WasteCategory[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, "wasteCategories"),
    where("isActive", "==", true),
  );

  return onSnapshot(q, (querySnapshot) => {
    const categories = querySnapshot.docs.map(
      (doc) => convertTimestamps(doc.data()) as WasteCategory,
    );
    callback(categories);
  });
};

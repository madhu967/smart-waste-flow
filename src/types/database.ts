// Firestore database types and interfaces for the Smart Garbage Management system

// User Roles
export type UserRole = "user" | "weekly_collector" | "spot_collector" | "admin";

// ===== USER COLLECTION =====
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city: string;
  street: string; // street1 - street10
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
    accuracy?: number;
  };
  lastLocationUpdate?: Date;
}

// ===== WEEKLY PICKUPS COLLECTION =====
export interface WeeklyPickup {
  id: string;
  userId: string;
  userName?: string; // user's name (denormalized for display)
  street: string; // street1 - street10
  collectorId?: string; // assigned collector
  collectorName?: string; // collector's name
  pickupDay: string; // e.g., "Monday", "Wednesday"
  nextPickupDate: Date;
  status: "scheduled" | "in_transit" | "arrived" | "completed" | "cancelled";
  trackingStatus?: "not_started" | "live" | "completed" | "cancelled";
  arrivalTime?: Date;
  completionTime?: Date;

  // Waste details and amount
  amount?: number; // Estimated/actual amount in rupees
  weight?: number; // Collected weight in kg
  wasteType?: string; // Type of waste collected
  selectedCategories?: { categoryId: string; amount: number }[]; // Categories with amounts

  // Collection details (filled by collector)
  collectionDetails?: {
    totalPrice?: number;
    weight?: number;
    notes?: string;
    collectionDate?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

// ===== SPOT PICKUPS COLLECTION =====
export interface SpotPickup {
  id: string;
  userId: string;
  userName?: string; // user's name (denormalized for display)
  collectorId?: string; // assigned by admin
  collectorName?: string; // collector's name (denormalized for display)
  collectorPhone?: string; // collector's phone (denormalized for quick contact)
  pickupDate: Date;
  timeSlot: string; // e.g., "9:00 AM - 11:00 AM"
  status:
    | "pending"
    | "accepted"
    | "in_transit"
    | "arrived"
    | "in_progress"
    | "completed"
    | "cancelled";
  trackingStatus?: "not_started" | "live" | "completed" | "cancelled";
  arrivalTime?: Date;
  completionTime?: Date;

  // Waste details
  metalWaste: {
    iron?: number; // kg
    copper?: number;
    aluminum?: number;
    zinc?: number;
    steel?: number;
    other?: number;
  };

  nonMetalWaste: {
    plastic?: number; // kg
    furniture?: number;
    others?: number;
  };

  estimatedWeight: number; // total kg

  // Estimated amount and categories - THIS IS THE FIX
  amount?: number; // Estimated amount in rupees based on pricePerKg
  selectedCategories?: { categoryId: string; amount: number }[]; // Categories with their weights

  // Pickup location
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phoneNumber: string;

  // Collection details (filled by collector)
  collectionDetails?: {
    images: string[]; // image URLs from Firebase Storage
    collectorNotes?: string;
    collectionDate?: Date;
    totalPrice?: number;
    weight?: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

// ===== COLLECTORS COLLECTION =====
export interface Collector {
  id: string;
  uid: string; // Firebase Auth UID for login
  name: string;
  email: string;
  phone: string;
  role: "weekly_collector" | "spot_collector";
  assignedStreets?: string[]; // only for weekly collectors (e.g., ["street1", "street2", ...])
  currentTasks: string[]; // array of spot pickup IDs or weekly pickup IDs
  totalCollections: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
    accuracy?: number;
  };
  lastLocationUpdate?: Date;
}

// ===== SLOTS COLLECTION =====
export interface Slot {
  id: string;
  date: Date;
  timeSlot: string; // e.g., "9:00 AM - 11:00 AM", "2:00 PM - 4:00 PM"
  isAvailable: boolean;
  bookedBy?: string; // spot pickup ID
  createdAt: Date;
  updatedAt: Date;
}

// ===== WALLET COLLECTION =====
export interface Wallet {
  id: string;
  userId: string;
  balance: number; // in rupees or currency
  totalEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

// ===== WASTE CATEGORIES COLLECTION =====
export interface WasteCategory {
  id: string;
  name: string; // e.g., "Iron", "Copper", "Plastic", "Furniture"
  category: "metal" | "non-metal"; // Type of waste
  pricePerKg: number; // Price per kilogram in rupees
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== TRANSACTIONS COLLECTION =====
export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  type: "credit" | "debit"; // credit for earnings, debit for withdrawals
  description: string;
  pickupType: "weekly" | "spot";
  pickupId: string; // reference to weekly or spot pickup
  relatedCollectionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== SUSTAINABILITY METRICS COLLECTION =====
export interface SustainabilityMetrics {
  id: string;
  userId: string;
  totalWastCollected: number; // kg
  co2Reduced: number; // kg equivalent
  recyclables: number; // count or kg
  sustainabilityScore: number; // calculated score
  metalWasteTotal: number; // kg
  nonMetalWasteTotal: number; // kg
  pickupCount: number;
  badges?: string[]; // achievements
  createdAt: Date;
  updatedAt: Date;
}

// ===== PRICES COLLECTION =====
export interface Prices {
  id: string;
  metalPrices: {
    iron: number; // per kg
    copper: number;
    aluminum: number;
    zinc: number;
    steel: number;
  };
  plasticPrice: number; // per kg
  furnitureBasePricingNote: string; // "To be estimated by collector"
  lastUpdated: Date;
}

// ===== COLLECTION DATA (for collector forms) =====
export interface CollectionData {
  id: string;
  spotPickupId?: string;
  weeklyPickupId?: string;
  collectorId: string;
  metalScrap: {
    copper?: number;
    iron?: number;
    aluminum?: number;
    zinc?: number;
    steel?: number;
    other?: number;
  };
  nonMetal: {
    plastic?: number;
    furniture?: number;
    others?: number;
  };
  totalWeight: number;
  calculatedPrice: number;
  estimatedPrice?: number; // for furniture
  images: string[]; // URLs of uploaded images
  collectorNotes?: string;
  collectionDate: Date;
  createdAt: Date;
}

// ===== ADMIN ACTIVITY LOG (optional) =====
export interface AdminActivityLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string; // 'user', 'collector', 'slot', 'booking'
  targetId: string;
  details?: Record<string, any>;
  createdAt: Date;
}

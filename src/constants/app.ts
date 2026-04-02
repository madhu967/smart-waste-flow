// Predefined Prices and Constants for the Smart Garbage Management System

// Metal prices per kg (in rupees)
export const METAL_PRICES = {
  iron: 8,
  copper: 350,
  aluminum: 80,
  zinc: 120,
  steel: 12,
  other: 5,
};

// Non-metal prices
export const NON_METAL_PRICES = {
  plastic: 20, // per kg
  furniture: "TO_BE_ESTIMATED", // Estimated by collector
  others: "TO_BE_ESTIMATED",
};

// Weekly pickup schedules (based on street)
export const WEEKLY_PICKUP_SCHEDULE = {
  street1: { day: "Monday", dayIndex: 1 },
  street2: { day: "Monday", dayIndex: 1 },
  street3: { day: "Wednesday", dayIndex: 3 },
  street4: { day: "Wednesday", dayIndex: 3 },
  street5: { day: "Friday", dayIndex: 5 },
  street6: { day: "Tuesday", dayIndex: 2 },
  street7: { day: "Tuesday", dayIndex: 2 },
  street8: { day: "Thursday", dayIndex: 4 },
  street9: { day: "Thursday", dayIndex: 4 },
  street10: { day: "Saturday", dayIndex: 6 },
};

// Collector street assignments
export const COLLECTOR_STREET_ASSIGNMENTS = {
  collector1: ["street1", "street2", "street3", "street4", "street5"],
  collector2: ["street6", "street7", "street8", "street9", "street10"],
};

// Available time slots for spot pickups
export const AVAILABLE_TIME_SLOTS = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
];

// CO2 reduction factors (kg CO2 saved per kg of waste)
export const CO2_REDUCTION_FACTORS = {
  iron: 2.5,
  copper: 3.5,
  aluminum: 8.0, // Aluminum recycling saves most CO2
  zinc: 2.0,
  steel: 1.8,
  plastic: 1.5,
  furniture: 0.5,
  other: 0.3,
};

// Sustainability score calculation
export const SUSTAINABILITY_SCORE_CONFIG = {
  pointsPerKgWaste: 10,
  bonusForConsistency: {
    everyWeeklyPickup: 5,
    everySpotPickup: 3,
  },
  badgeThresholds: {
    bronze: 100, // points
    silver: 500,
    gold: 1000,
    platinum: 5000,
  },
};

// Streets list
export const STREETS = [
  "street1",
  "street2",
  "street3",
  "street4",
  "street5",
  "street6",
  "street7",
  "street8",
  "street9",
  "street10",
];

// Cities (currently only Vijayawada)
export const CITIES = ["Vijayawada"];

// User roles
export const USER_ROLES = {
  USER: "user",
  WEEKLY_COLLECTOR: "weekly_collector",
  SPOT_COLLECTOR: "spot_collector",
  ADMIN: "admin",
};

// Pickup statuses
export const PICKUP_STATUS = {
  PENDING: "pending",
  SCHEDULED: "scheduled",
  ACCEPTED: "accepted",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Function to calculate metal waste price
export const calculateMetalPrice = (
  metalWaste: Record<string, number | undefined>,
): number => {
  let total = 0;
  Object.entries(metalWaste).forEach(([type, weight]) => {
    if (weight) {
      const price = METAL_PRICES[type as keyof typeof METAL_PRICES] || 0;
      total += weight * price;
    }
  });
  return total;
};

// Function to calculate plastic price
export const calculatePlasticPrice = (plasticWeight: number): number => {
  return plasticWeight * NON_METAL_PRICES.plastic;
};

// Function to calculate total waste price (without estimated items)
export const calculateTotalWastePrice = (
  metalWaste: Record<string, number | undefined>,
  plasticWeight: number | undefined,
): number => {
  let total = calculateMetalPrice(metalWaste);
  if (plasticWeight) {
    total += calculatePlasticPrice(plasticWeight);
  }
  return total;
};

// Function to calculate total waste weight
export const calculateTotalWeight = (
  metalWaste: Record<string, number | undefined>,
  nonMetalWaste: Record<string, number | undefined>,
): number => {
  let total = 0;

  // Sum metal waste
  Object.values(metalWaste).forEach((weight) => {
    if (weight) total += weight;
  });

  // Sum non-metal waste
  Object.values(nonMetalWaste).forEach((weight) => {
    if (weight) total += weight;
  });

  return total;
};

// Function to calculate CO2 reduction
export const calculateCo2Reduction = (
  metalWaste: Record<string, number | undefined>,
  nonMetalWaste: Record<string, number | undefined>,
): number => {
  let co2 = 0;

  // Calculate from metals
  Object.entries(metalWaste).forEach(([type, weight]) => {
    if (weight) {
      const factor =
        CO2_REDUCTION_FACTORS[type as keyof typeof CO2_REDUCTION_FACTORS] || 0;
      co2 += weight * factor;
    }
  });

  // Calculate from non-metals
  Object.entries(nonMetalWaste).forEach(([type, weight]) => {
    if (weight) {
      const factor =
        CO2_REDUCTION_FACTORS[type as keyof typeof CO2_REDUCTION_FACTORS] || 0;
      co2 += weight * factor;
    }
  });

  return Math.round(co2 * 100) / 100; // Round to 2 decimal places
};

export default {
  METAL_PRICES,
  NON_METAL_PRICES,
  WEEKLY_PICKUP_SCHEDULE,
  AVAILABLE_TIME_SLOTS,
  CO2_REDUCTION_FACTORS,
  SUSTAINABILITY_SCORE_CONFIG,
  STREETS,
  CITIES,
  USER_ROLES,
  PICKUP_STATUS,
  calculateMetalPrice,
  calculatePlasticPrice,
  calculateTotalWastePrice,
  calculateTotalWeight,
  calculateCo2Reduction,
};

// Helper utilities for auth service
import { getAuthToken } from "@/services/authService";

/**
 * Add auth token to API request headers
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Format error message for display
 */
export const formatAuthError = (error: any): string => {
  if (typeof error === "string") return error;
  return error?.message || "An error occurred";
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): string | null => {
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
};

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Recycle, Eye, EyeOff, MapPin, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { STREETS, CITIES } from "@/constants/app";
import {
  isValidEmail,
  isValidPassword,
  isValidPhoneNumber,
} from "@/utils/authUtils";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "Vijayawada",
    street: "",
    address: "",
    lat: 0,
    lng: 0,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [step, setStep] = useState(1);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const { signup, user } = useAuth();
  const navigate = useNavigate();

  // Get user's current location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }));
        setLocationStatus("success");
        setError(null);
      },
      (err) => {
        setError(
          "Failed to get location. Please enable location access or enter address manually.",
        );
        setLocationStatus("error");
      },
    );
  };

  // Redirect if already logged in
  if (user) {
    const paths: Record<string, string> = {
      user: "/",
      weekly_collector: "/weekly-collector",
      spot_collector: "/spot-collector",
      admin: "/admin/users",
    };
    navigate(paths[user.role] || "/");
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const validateStep1 = (): boolean => {
    if (!formData.name.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (formData.name.length < 2) {
      setError("Name must be at least 2 characters");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const passwordError = isValidPassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.street) {
      setError("Please select your street");
      return false;
    }
    if (!formData.address.trim()) {
      setError("Please enter your address");
      return false;
    }
    if (formData.address.length < 5) {
      setError("Address must be at least 5 characters");
      return false;
    }
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      setError("Please enter a valid 10-digit phone number");
      return false;
    }
    if (formData.lat === 0 && formData.lng === 0) {
      setError("Please capture your location using the button above");
      return false;
    }
    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setStep(Math.max(1, step - 1));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep3()) return;

    setIsLoading(true);

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        city: formData.city,
        street: formData.street,
        address: formData.address,
        phone: formData.phone || undefined,
      });

      // Redirect to home
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center gap-2 justify-center mb-4">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Recycle className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl">EcoCollect</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Join the Movement
          </h1>
          <p className="text-muted-foreground">
            Create your account to start making a difference
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-all ${
                s <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <h2 className="text-xl font-semibold mb-6">Create Password</h2>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  At least 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Address & Location */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <h2 className="text-xl font-semibold mb-6">Address & Location</h2>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => handleInputChange("city", value)}
                >
                  <SelectTrigger id="city" disabled>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street *</Label>
                <Select
                  value={formData.street}
                  onValueChange={(value) => handleInputChange("street", value)}
                >
                  <SelectTrigger id="street">
                    <SelectValue placeholder="Select your street" />
                  </SelectTrigger>
                  <SelectContent>
                    {STREETS.map((street) => (
                      <SelectItem key={street} value={street}>
                        {street}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="House no, Building name, Street"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Location Capture */}
              <div className="space-y-2">
                <Label>Live Location *</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetLocation}
                  disabled={isLoading || locationStatus === "loading"}
                  className="w-full"
                >
                  {locationStatus === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting location...
                    </>
                  ) : locationStatus === "success" ? (
                    <>
                      <MapPin className="w-4 h-4 mr-2 text-green-600" />
                      Location Captured
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Capture Current Location
                    </>
                  )}
                </Button>
                {locationStatus === "success" && (
                  <p className="text-xs text-green-600">
                    Location: {formData.lat.toFixed(4)},{" "}
                    {formData.lng.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="terms" className="cursor-pointer text-sm">
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline">
                    terms and conditions
                  </a>
                </Label>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-6">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading}
                className="flex-1 gradient-primary text-primary-foreground font-semibold"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 gradient-primary text-primary-foreground font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            )}
          </div>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;

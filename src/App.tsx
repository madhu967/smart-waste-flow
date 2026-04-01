import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import WeeklyPickupPage from "./pages/WeeklyPickupPage";
import SpotPickupPage from "./pages/SpotPickupPage";
import WalletPage from "./pages/WalletPage";
import SustainabilityPage from "./pages/SustainabilityPage";
import ProfilePage from "./pages/ProfilePage";
import WeeklyCollectorDashboard from "./pages/WeeklyCollectorDashboard";
import SpotCollectorDashboard from "./pages/SpotCollectorDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWeeklyCollectors from "./pages/admin/AdminWeeklyCollectors";
import AdminSpotCollectors from "./pages/admin/AdminSpotCollectors";
import AdminSpotBookings from "./pages/admin/AdminSpotBookings";
import AdminSlots from "./pages/admin/AdminSlots";
import AdminWallet from "./pages/admin/AdminWallet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  if (user?.role === 'admin') {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="users" element={<AdminUsers />} />
          <Route path="weekly-collectors" element={<AdminWeeklyCollectors />} />
          <Route path="spot-collectors" element={<AdminSpotCollectors />} />
          <Route path="spot-bookings" element={<AdminSpotBookings />} />
          <Route path="slots" element={<AdminSlots />} />
          <Route path="wallet" element={<AdminWallet />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/users" />} />
      </Routes>
    );
  }

  if (user?.role === 'weekly_collector') {
    return (
      <Routes>
        <Route path="/weekly-collector" element={<WeeklyCollectorDashboard />} />
        <Route path="*" element={<Navigate to="/weekly-collector" />} />
      </Routes>
    );
  }

  if (user?.role === 'spot_collector') {
    return (
      <Routes>
        <Route path="/spot-collector" element={<SpotCollectorDashboard />} />
        <Route path="*" element={<Navigate to="/spot-collector" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/weekly-pickup" element={<WeeklyPickupPage />} />
      <Route path="/spot-pickup" element={<SpotPickupPage />} />
      <Route path="/wallet" element={<WalletPage />} />
      <Route path="/sustainability" element={<SustainabilityPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

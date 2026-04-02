import { Link, useLocation } from "react-router-dom";
import {
  Users,
  Truck,
  MapPin,
  CalendarCheck,
  Clock,
  Wallet,
  Recycle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Weekly Collectors", path: "/admin/weekly-collectors", icon: Truck },
  { label: "Spot Collectors", path: "/admin/spot-collectors", icon: MapPin },
  { label: "Spot Bookings", path: "/admin/spot-bookings", icon: CalendarCheck },
  { label: "Slots Management", path: "/admin/slots", icon: Clock },
  { label: "Waste Categories", path: "/admin/waste-categories", icon: Recycle },
  { label: "Wallet Data", path: "/admin/wallet", icon: Wallet },
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();

  // Get admin initials
  const getInitials = (name?: string) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={`sticky top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header with Admin Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0 font-bold text-sidebar-primary-foreground">
            {getInitials(user?.name)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">
                {user?.name || "Admin"}
              </div>
              <div className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email || "admin@example.com"}
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

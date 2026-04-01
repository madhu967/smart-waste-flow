import { Link, useLocation } from 'react-router-dom';
import { Users, Truck, MapPin, CalendarCheck, Clock, Wallet, Recycle, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Weekly Collectors', path: '/admin/weekly-collectors', icon: Truck },
  { label: 'Spot Collectors', path: '/admin/spot-collectors', icon: MapPin },
  { label: 'Spot Bookings', path: '/admin/spot-bookings', icon: CalendarCheck },
  { label: 'Slots Management', path: '/admin/slots', icon: Clock },
  { label: 'Wallet Data', path: '/admin/wallet', icon: Wallet },
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside
      className={`sticky top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Recycle className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && <span className="font-bold text-lg">Admin</span>}
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
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
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
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

import { Link, useLocation } from 'react-router-dom';
import { Recycle, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const CollectorNavbar = ({ type }: { type: 'weekly' | 'spot' }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const basePath = type === 'weekly' ? '/weekly-collector' : '/spot-collector';
  const label = type === 'weekly' ? 'Weekly Collector' : 'Spot Collector';

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={basePath} className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${type === 'weekly' ? 'gradient-primary' : 'bg-info'}`}>
            <Recycle className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-foreground">EcoCollect</span>
            <span className="text-xs text-muted-foreground ml-2">{label}</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to={basePath}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === basePath ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default CollectorNavbar;

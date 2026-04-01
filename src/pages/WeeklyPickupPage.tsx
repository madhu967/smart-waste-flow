import UserNavbar from '@/components/UserNavbar';
import MapPlaceholder from '@/components/MapPlaceholder';
import { CalendarDays, CheckCircle, Clock, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const WeeklyPickupPage = () => {
  return (
    <div className="min-h-screen">
      <UserNavbar />

      {/* Notification banner */}
      <div className="gradient-primary">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2 text-primary-foreground text-sm font-medium">
          <Truck className="w-4 h-4" />
          Your next pickup is tomorrow! Keep your waste ready by 8 AM.
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Weekly Pickup</h1>
          <p className="text-muted-foreground">Your scheduled waste collection details</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Schedule Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Pickup Schedule</h3>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Active</Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <CalendarDays className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Assigned Day</p>
                  <p className="text-sm text-muted-foreground">Every Wednesday</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Next Pickup</p>
                  <p className="text-sm text-muted-foreground">April 2, 2026 — 8:00 AM</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Status Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Recent Pickups</h3>
            <div className="space-y-3">
              {[
                { date: 'Mar 26, 2026', status: 'Completed', weight: '4.2 kg' },
                { date: 'Mar 19, 2026', status: 'Completed', weight: '3.8 kg' },
                { date: 'Mar 12, 2026', status: 'Completed', weight: '5.1 kg' },
              ].map((p) => (
                <div key={p.date} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.date}</p>
                      <p className="text-xs text-muted-foreground">{p.weight}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-success border-success/30">{p.status}</Badge>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Map */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-semibold text-foreground mb-3">Collector Route</h3>
          <MapPlaceholder label="Collector is 1.2 km away" className="h-64" />
          <p className="text-sm text-muted-foreground mt-2">Estimated arrival: ~15 minutes</p>
        </motion.div>
      </div>
    </div>
  );
};

export default WeeklyPickupPage;

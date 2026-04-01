import CollectorNavbar from '@/components/CollectorNavbar';
import MapPlaceholder from '@/components/MapPlaceholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Navigation, Upload, CheckCircle, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const bookings = [
  { id: 1, name: 'Anil Kumar', waste: 'Iron 5kg, Plastic 3kg', date: 'Apr 1, 2026', time: '10 AM - 12 PM', status: 'assigned' },
  { id: 2, name: 'Meena Rao', waste: 'Furniture 12kg', date: 'Apr 1, 2026', time: '2 PM - 4 PM', status: 'assigned' },
  { id: 3, name: 'Ravi Teja', waste: 'Copper 2kg, Steel 8kg', date: 'Apr 2, 2026', time: '8 AM - 10 AM', status: 'upcoming' },
];

const SpotCollectorDashboard = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (completed) {
    return (
      <div className="min-h-screen">
        <CollectorNavbar type="spot" />
        <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Collection Complete!</h2>
            <p className="text-muted-foreground mt-2">Successfully recorded and wallet updated.</p>
          </motion.div>
          <Button variant="outline" onClick={() => { setCompleted(false); setSelected(null); setShowForm(false); }}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <CollectorNavbar type="spot" />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Spot Pickups</h1>
          <p className="text-muted-foreground">Your assigned on-demand collections</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {bookings.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { setSelected(b.id); setShowForm(false); }}
                className={`glass-card-hover rounded-xl p-4 cursor-pointer border-l-4 ${
                  b.status === 'assigned' ? 'border-l-info' : 'border-l-muted'
                } ${selected === b.id ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-foreground">{b.name}</p>
                  <Badge variant="outline" className={b.status === 'assigned' ? 'text-info border-info/30' : ''}>
                    {b.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{b.waste}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.time}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
            {selected && !showForm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <MapPlaceholder label={`Navigate to ${bookings.find(b => b.id === selected)?.name}`} className="h-48" />
                <Button className="w-full gradient-primary text-primary-foreground font-semibold gap-2" onClick={() => setShowForm(true)}>
                  <Navigation className="w-4 h-4" /> Start Navigation & Collect
                </Button>
              </motion.div>
            )}

            {showForm && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-foreground">Collection Form</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Iron', 'Copper', 'Plastic', 'Furniture'].map((w) => (
                    <div key={w} className="space-y-1">
                      <Label className="text-xs">{w} (kg)</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-muted/50 rounded-lg flex justify-between">
                  <span className="text-sm text-muted-foreground">Estimated Price</span>
                  <span className="font-bold text-foreground">₹0.00</span>
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Upload waste images</p>
                </div>
                <Button className="w-full gradient-primary text-primary-foreground font-semibold gap-2" onClick={() => setCompleted(true)}>
                  <CheckCircle className="w-4 h-4" /> Submit Collection
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotCollectorDashboard;

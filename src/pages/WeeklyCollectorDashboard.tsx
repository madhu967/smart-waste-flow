import CollectorNavbar from '@/components/CollectorNavbar';
import MapPlaceholder from '@/components/MapPlaceholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Navigation, Upload, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const tasks = [
  { id: 1, name: 'Ramesh Kumar', address: '45 MG Road, Street 3', status: 'pending' },
  { id: 2, name: 'Priya Sharma', address: '12 Gandhi Nagar, Street 3', status: 'pending' },
  { id: 3, name: 'Suresh Reddy', address: '78 Nehru St, Street 4', status: 'completed' },
  { id: 4, name: 'Lakshmi Devi', address: '23 Patel Colony, Street 4', status: 'pending' },
];

const WeeklyCollectorDashboard = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen">
      <CollectorNavbar type="weekly" />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Today's Collections</h1>
            <p className="text-muted-foreground">Streets 3–4 • Wednesday, April 1</p>
          </div>
          <Badge className="bg-primary/10 text-primary">{tasks.filter(t => t.status === 'pending').length} remaining</Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Tasks list */}
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { setSelected(task.id); setShowForm(false); }}
                className={`glass-card-hover rounded-xl p-4 cursor-pointer ${selected === task.id ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{task.name}</p>
                    <p className="text-sm text-muted-foreground">{task.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === 'completed' ? (
                      <Badge variant="outline" className="text-success border-success/30">Done</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Navigation className="w-4 h-4 text-primary" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {selected && !showForm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <MapPlaceholder label={`Navigate to ${tasks.find(t => t.id === selected)?.name}`} className="h-48" />
                <Button className="w-full gradient-primary text-primary-foreground font-semibold" onClick={() => setShowForm(true)}>
                  Start Collection
                </Button>
              </motion.div>
            )}

            {showForm && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-foreground">Collection Form</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Iron', 'Copper', 'Plastic', 'Others'].map((w) => (
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
                  <p className="text-sm text-muted-foreground">Drag & drop or click to upload images</p>
                </div>
                <Button className="w-full gradient-primary text-primary-foreground font-semibold gap-2">
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

export default WeeklyCollectorDashboard;

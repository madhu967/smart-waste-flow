import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const initialSlots = [
  { id: 1, time: '8:00 AM - 10:00 AM', active: true },
  { id: 2, time: '10:00 AM - 12:00 PM', active: true },
  { id: 3, time: '12:00 PM - 2:00 PM', active: true },
  { id: 4, time: '2:00 PM - 4:00 PM', active: true },
  { id: 5, time: '4:00 PM - 6:00 PM', active: false },
];

const AdminSlots = () => {
  const [slots, setSlots] = useState(initialSlots);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Time Slots</h1>
          <p className="text-muted-foreground">Manage available pickup time slots</p>
        </div>
        <Button className="gradient-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Add Slot</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((slot, i) => (
          <motion.div
            key={slot.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card-hover rounded-xl p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{slot.time}</p>
                <Badge variant="outline" className={`text-xs mt-1 ${slot.active ? 'text-success border-success/30' : 'text-muted-foreground'}`}>
                  {slot.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminSlots;

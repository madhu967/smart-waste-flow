import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, CalendarCheck, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '@/components/StatCard';

const bookings = [
  { id: 1, user: 'Anil Kumar', waste: 'Iron 5kg, Plastic 3kg', date: 'Apr 1', time: '10–12 AM', status: 'pending', collector: '' },
  { id: 2, user: 'Meena Rao', waste: 'Furniture 12kg', date: 'Apr 1', time: '2–4 PM', status: 'assigned', collector: 'Arjun S.' },
  { id: 3, user: 'Ravi Teja', waste: 'Copper 2kg, Steel 8kg', date: 'Apr 2', time: '8–10 AM', status: 'pending', collector: '' },
  { id: 4, user: 'Sunita P.', waste: 'Plastic 6kg', date: 'Apr 2', time: '12–2 PM', status: 'completed', collector: 'Mahesh R.' },
];

const AdminSpotBookings = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Spot Bookings</h1>
      <p className="text-muted-foreground">Manage and assign spot pickup requests</p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={CalendarCheck} label="Total Bookings" value="156" />
      <StatCard icon={Calendar} label="Today" value="4" />
      <StatCard icon={Clock} label="Pending" value="2" />
      <StatCard icon={CalendarCheck} label="Completed" value="148" />
    </div>

    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search bookings..." className="pl-9" /></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-border/50 bg-muted/30">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">User</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Waste</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Date/Time</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Assign Collector</th>
          </tr></thead>
          <tbody>
            {bookings.map((b, i) => (
              <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/30 hover:bg-muted/20">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{b.user}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{b.waste}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{b.date}, {b.time}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={
                    b.status === 'completed' ? 'text-success border-success/30' :
                    b.status === 'assigned' ? 'text-info border-info/30' : 'text-warning border-warning/30'
                  }>{b.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  {b.status === 'pending' ? (
                    <Select>
                      <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Assign..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arjun">Arjun S.</SelectItem>
                        <SelectItem value="mahesh">Mahesh R.</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">{b.collector}</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default AdminSpotBookings;

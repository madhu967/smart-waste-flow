import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Trash2, Edit, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '@/components/StatCard';

const collectors = [
  { id: 1, name: 'Raju M.', phone: '9876543210', streets: 'Streets 1–5', status: 'active' },
  { id: 2, name: 'Venkat K.', phone: '9876543211', streets: 'Streets 6–10', status: 'active' },
  { id: 3, name: 'Srinivas P.', phone: '9876543212', streets: 'Streets 1–5', status: 'inactive' },
];

const AdminWeeklyCollectors = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Weekly Collectors</h1>
        <p className="text-muted-foreground">Manage weekly garbage collectors</p>
      </div>
      <Button className="gradient-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Add Collector</Button>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard icon={Truck} label="Total Collectors" value="12" />
      <StatCard icon={Truck} label="Active Today" value="8" />
      <StatCard icon={Truck} label="Collections Today" value="64" />
    </div>

    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-9" /></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-border/50 bg-muted/30">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Phone</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Assigned Streets</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {collectors.map((c, i) => (
              <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/30 hover:bg-muted/20">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.streets}</td>
                <td className="px-4 py-3"><Badge variant="outline" className={c.status === 'active' ? 'text-success border-success/30' : ''}>{c.status}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default AdminWeeklyCollectors;

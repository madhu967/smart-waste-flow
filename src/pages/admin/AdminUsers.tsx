import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Trash2, Edit, Users as UsersIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '@/components/StatCard';

const users = [
  { id: 1, name: 'Ramesh Kumar', email: 'ramesh@email.com', street: 'Street 3', status: 'active' },
  { id: 2, name: 'Priya Sharma', email: 'priya@email.com', street: 'Street 5', status: 'active' },
  { id: 3, name: 'Suresh Reddy', email: 'suresh@email.com', street: 'Street 1', status: 'inactive' },
  { id: 4, name: 'Lakshmi Devi', email: 'lakshmi@email.com', street: 'Street 7', status: 'active' },
  { id: 5, name: 'Anil Kumar', email: 'anil@email.com', street: 'Street 9', status: 'active' },
];

const AdminUsers = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground">Manage registered users</p>
      </div>
      <Button className="gradient-primary text-primary-foreground gap-2">
        <Plus className="w-4 h-4" /> Add User
      </Button>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={UsersIcon} label="Total Users" value="1,248" />
      <StatCard icon={UsersIcon} label="Active" value="1,180" />
      <StatCard icon={UsersIcon} label="This Month" value="42" />
      <StatCard icon={UsersIcon} label="Streets Covered" value="10" />
    </div>

    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/50 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Street</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{u.street}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={u.status === 'active' ? 'text-success border-success/30' : 'text-muted-foreground'}>
                    {u.status}
                  </Badge>
                </td>
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

export default AdminUsers;

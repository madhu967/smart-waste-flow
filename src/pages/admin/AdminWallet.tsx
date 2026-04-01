import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Wallet, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '@/components/StatCard';

const transactions = [
  { id: 1, user: 'Ramesh Kumar', type: 'Weekly', amount: '₹42', date: 'Mar 26, 2026' },
  { id: 2, user: 'Anil Kumar', type: 'Spot', amount: '₹320', date: 'Mar 20, 2026' },
  { id: 3, user: 'Priya Sharma', type: 'Weekly', amount: '₹38', date: 'Mar 19, 2026' },
  { id: 4, user: 'Meena Rao', type: 'Spot', amount: '₹120', date: 'Feb 15, 2026' },
  { id: 5, user: 'Suresh Reddy', type: 'Weekly', amount: '₹65', date: 'Mar 12, 2026' },
];

const AdminWallet = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Wallet Data</h1>
      <p className="text-muted-foreground">All user wallet transactions</p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={Wallet} label="Total Disbursed" value="₹48,520" />
      <StatCard icon={Wallet} label="This Month" value="₹6,280" />
      <StatCard icon={ArrowDownRight} label="Avg per User" value="₹38.90" />
      <StatCard icon={Wallet} label="Active Wallets" value="1,180" />
    </div>

    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search transactions..." className="pl-9" /></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-border/50 bg-muted/30">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">User</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Amount</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
          </tr></thead>
          <tbody>
            {transactions.map((t, i) => (
              <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/30 hover:bg-muted/20">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{t.user}</td>
                <td className="px-4 py-3"><Badge variant="outline">{t.type}</Badge></td>
                <td className="px-4 py-3 text-sm font-semibold text-success">{t.amount}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{t.date}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default AdminWallet;

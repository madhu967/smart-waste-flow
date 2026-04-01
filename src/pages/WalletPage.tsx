import UserNavbar from '@/components/UserNavbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet as WalletIcon, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const weeklyHistory = [
  { date: 'Mar 26, 2026', waste: 'Mixed household — 4.2 kg', amount: '₹42', type: 'credit' },
  { date: 'Mar 19, 2026', waste: 'Organic + Plastic — 3.8 kg', amount: '₹38', type: 'credit' },
  { date: 'Mar 12, 2026', waste: 'Metal + Plastic — 5.1 kg', amount: '₹65', type: 'credit' },
];

const spotHistory = [
  { date: 'Mar 20, 2026', waste: 'Iron 10kg, Copper 2kg', amount: '₹320', type: 'credit' },
  { date: 'Feb 15, 2026', waste: 'Furniture — 15 kg', amount: '₹120', type: 'credit' },
];

const HistoryItem = ({ item }: { item: typeof weeklyHistory[0] }) => (
  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        {item.type === 'credit' ? <ArrowDownRight className="w-4 h-4 text-success" /> : <ArrowUpRight className="w-4 h-4 text-destructive" />}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{item.date}</p>
        <p className="text-xs text-muted-foreground">{item.waste}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-success">{item.amount}</span>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
        <Download className="w-4 h-4" />
      </Button>
    </div>
  </div>
);

const WalletPage = () => (
  <div className="min-h-screen">
    <UserNavbar />
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-xl p-8 text-primary-foreground">
        <div className="flex items-center gap-3 mb-4">
          <WalletIcon className="w-6 h-6" />
          <span className="text-sm font-medium opacity-80">Wallet Balance</span>
        </div>
        <p className="text-4xl font-bold">₹585.00</p>
        <p className="text-sm opacity-70 mt-1">Earned from 18 pickups</p>
      </motion.div>

      <Tabs defaultValue="weekly">
        <TabsList className="w-full">
          <TabsTrigger value="weekly" className="flex-1">Weekly Pickups</TabsTrigger>
          <TabsTrigger value="spot" className="flex-1">Spot Pickups</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-3 mt-4">
          {weeklyHistory.map((item) => <HistoryItem key={item.date} item={item} />)}
        </TabsContent>
        <TabsContent value="spot" className="space-y-3 mt-4">
          {spotHistory.map((item) => <HistoryItem key={item.date} item={item} />)}
        </TabsContent>
      </Tabs>
    </div>
  </div>
);

export default WalletPage;

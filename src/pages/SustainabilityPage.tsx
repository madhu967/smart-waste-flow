import UserNavbar from '@/components/UserNavbar';
import StatCard from '@/components/StatCard';
import { TreePine, Wind, Recycle, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

const SustainabilityPage = () => (
  <div className="min-h-screen">
    <UserNavbar />
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sustainability Dashboard</h1>
        <p className="text-muted-foreground">Your environmental impact at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wind} label="CO₂ Reduced" value="124 kg" subtitle="This year" />
        <StatCard icon={Recycle} label="Waste Recycled" value="45.2 kg" subtitle="Total lifetime" />
        <StatCard icon={TreePine} label="Trees Saved" value="8" subtitle="Equivalent impact" />
        <StatCard icon={TrendingUp} label="Green Score" value="92" subtitle="Top 5% in city" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-6">
        <h3 className="font-semibold text-foreground">Monthly Goals</h3>

        {[
          { label: 'Waste Segregation', value: 85 },
          { label: 'Recycling Rate', value: 72 },
          { label: 'CO₂ Reduction Target', value: 64 },
          { label: 'Community Rank', value: 92 },
        ].map((goal) => (
          <div key={goal.label} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground font-medium">{goal.label}</span>
              <span className="text-muted-foreground">{goal.value}%</span>
            </div>
            <Progress value={goal.value} className="h-2" />
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Impact Timeline</h3>
        <div className="space-y-4">
          {[
            { month: 'March 2026', co2: '18 kg', waste: '5.1 kg' },
            { month: 'February 2026', co2: '22 kg', waste: '6.3 kg' },
            { month: 'January 2026', co2: '15 kg', waste: '4.8 kg' },
          ].map((m) => (
            <div key={m.month} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium text-foreground">{m.month}</span>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>CO₂: {m.co2}</span>
                <span>Recycled: {m.waste}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </div>
);

export default SustainabilityPage;

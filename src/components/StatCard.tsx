import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
}

const StatCard = ({ icon: Icon, label, value, subtitle, color = 'text-primary' }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="stat-card glass-card-hover"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground mt-1">{label}</p>
    {subtitle && <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>}
  </motion.div>
);

export default StatCard;

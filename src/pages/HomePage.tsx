import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Recycle, Truck, MapPin, Leaf, ArrowRight, Shield, Clock, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import UserNavbar from '@/components/UserNavbar';

const features = [
  { icon: Truck, title: 'Weekly Pickup', desc: 'Scheduled door-to-door waste collection every week' },
  { icon: MapPin, title: 'Spot Pickup', desc: 'On-demand pickup for bulk or special waste items' },
  { icon: Coins, title: 'Earn Rewards', desc: 'Get wallet credits for responsible waste disposal' },
  { icon: Leaf, title: 'Go Green', desc: 'Track your sustainability impact in real-time' },
];

const stats = [
  { value: '12K+', label: 'Active Users' },
  { value: '98%', label: 'Pickup Rate' },
  { value: '45T', label: 'Waste Recycled' },
  { value: '200+', label: 'Trees Saved' },
];

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <UserNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Recycle className="w-4 h-4" />
              Smart Waste Management for Vijayawada
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
              Clean City,<br />
              <span className="text-gradient">Smart Waste</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Revolutionizing waste management with scheduled pickups, real-time tracking, and sustainability rewards.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/spot-pickup">
                <Button className="gradient-primary text-primary-foreground h-12 px-8 text-base font-semibold gap-2">
                  Book a Pickup <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/weekly-pickup">
                <Button variant="outline" className="h-12 px-8 text-base font-semibold">
                  View Schedule
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
                <p className="text-3xl font-bold text-gradient">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">How It Works</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Simple, efficient, and rewarding waste management at your doorstep.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card-hover rounded-xl p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-muted/30 border-t border-border/50">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Verified Collectors', desc: 'All collectors are verified and trained professionals' },
              { icon: Clock, title: 'On-time Service', desc: '98% of pickups happen on schedule' },
              { icon: Leaf, title: 'Eco Certified', desc: 'All waste is processed through certified recycling centers' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Recycle className="w-5 h-5 text-primary" />
            <span className="font-bold">EcoCollect</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 EcoCollect. Smart Waste for Vijayawada.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

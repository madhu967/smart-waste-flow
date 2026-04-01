import { useState } from 'react';
import UserNavbar from '@/components/UserNavbar';
import MapPlaceholder from '@/components/MapPlaceholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Loader2, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const timeSlots = ['8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '12:00 PM - 2:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM'];

const SpotPickupPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [metals, setMetals] = useState({ iron: '', copper: '', aluminium: '', zinc: '', steel: '' });
  const [nonMetals, setNonMetals] = useState({ plastic: '', furniture: '', others: '' });

  const totalWeight = [...Object.values(metals), ...Object.values(nonMetals)]
    .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => setAccepted(true), 2000);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <UserNavbar />
        <div className="container mx-auto px-4 py-8 max-w-lg space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-xl p-6 text-center space-y-4">
            {accepted ? (
              <>
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Pickup Accepted!</h2>
                <p className="text-sm text-muted-foreground">A collector has been assigned. Track live below.</p>
                <Badge className="bg-primary/10 text-primary">Accepted</Badge>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7 text-warning animate-pulse-soft" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Booking Submitted</h2>
                <p className="text-sm text-muted-foreground">Waiting for collector to accept...</p>
                <Badge variant="outline" className="text-warning border-warning/30">Pending</Badge>
              </>
            )}
          </motion.div>

          {accepted && <MapPlaceholder label="Collector en route — 2.5 km away" className="h-64" />}

          <Button variant="outline" className="w-full" onClick={() => { setSubmitted(false); setAccepted(false); }}>
            Book Another Pickup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <UserNavbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Spot Pickup</h1>
          <p className="text-muted-foreground">Request an on-demand waste pickup</p>
        </div>

        <form onSubmit={handleSubmit}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-6">
            <Tabs defaultValue="metal">
              <TabsList className="w-full">
                <TabsTrigger value="metal" className="flex-1">Metal Waste</TabsTrigger>
                <TabsTrigger value="nonmetal" className="flex-1">Non-Metal Waste</TabsTrigger>
              </TabsList>

              <TabsContent value="metal" className="space-y-3 mt-4">
                {Object.entries(metals).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="w-24 capitalize text-sm">{key}</Label>
                    <Input
                      type="number"
                      placeholder="kg"
                      value={val}
                      onChange={(e) => setMetals({ ...metals, [key]: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="nonmetal" className="space-y-3 mt-4">
                {Object.entries(nonMetals).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="w-24 capitalize text-sm">{key}</Label>
                    <Input
                      type="number"
                      placeholder="kg"
                      value={val}
                      onChange={(e) => setNonMetals({ ...nonMetals, [key]: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Total Weight</span>
              <span className="text-lg font-bold text-foreground">{totalWeight.toFixed(1)} kg</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input type="tel" placeholder="9876543210" />
              </div>
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Input type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Choose a time slot" /></SelectTrigger>
                <SelectContent>
                  {timeSlots.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button type="button" variant="outline" className="w-full gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Capture Live Location
            </Button>

            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground h-11 font-semibold gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Request'}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default SpotPickupPage;

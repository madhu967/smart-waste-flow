import UserNavbar from '@/components/UserNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, MapPin, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const ProfilePage = () => (
  <div className="min-h-screen">
    <UserNavbar />
    <div className="container mx-auto px-4 py-8 max-w-xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 text-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">John Doe</h2>
        <p className="text-sm text-muted-foreground">john@example.com</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Edit Profile</h3>
        {[
          { icon: User, label: 'Name', value: 'John Doe', type: 'text' },
          { icon: Mail, label: 'Email', value: 'john@example.com', type: 'email' },
          { icon: Phone, label: 'Phone', value: '9876543210', type: 'tel' },
          { icon: MapPin, label: 'City', value: 'Vijayawada', type: 'text' },
          { icon: Home, label: 'Address', value: '123 Main Road, Street 3', type: 'text' },
        ].map((field) => (
          <div key={field.label} className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <field.icon className="w-4 h-4 text-muted-foreground" />
              {field.label}
            </Label>
            <Input type={field.type} defaultValue={field.value} />
          </div>
        ))}
        <Button className="w-full gradient-primary text-primary-foreground font-semibold">Save Changes</Button>
      </motion.div>
    </div>
  </div>
);

export default ProfilePage;

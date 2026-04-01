import { MapPin } from 'lucide-react';

const MapPlaceholder = ({ label = 'Live Map', className = '' }: { label?: string; className?: string }) => (
  <div className={`relative rounded-xl overflow-hidden border border-border bg-muted ${className}`}>
    <div className="absolute inset-0 opacity-10" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23228B22' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    }} />
    <div className="flex flex-col items-center justify-center py-16 gap-3 relative">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-soft">
        <MapPin className="w-6 h-6 text-primary" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground/60">Map integration placeholder</p>
    </div>
  </div>
);

export default MapPlaceholder;

import AdminSidebar from '@/components/AdminSidebar';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => (
  <div className="flex min-h-screen w-full">
    <AdminSidebar />
    <main className="flex-1 p-6 md:p-8 overflow-auto">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;

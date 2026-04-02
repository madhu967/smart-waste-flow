import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Trash2,
  Edit,
  Users as UsersIcon,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StatCard from "@/components/StatCard";
import { getAllUsers } from "@/services/firestoreService";
import { User } from "@/types/database";

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.street?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const data = await getAllUsers();
      // Filter out admins and collectors from user list
      const regularUsers = data.filter((u) => u.role === "user");
      setUsers(regularUsers);
      setFilteredUsers(regularUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users");
    } finally {
      setIsFetching(false);
    }
  };

  const streetsCovered = new Set(users.map((u) => u.street)).size;
  const totalUsers = users.length;

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="pb-6 border-b">
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">
              Manage registered waste collectors and community members
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={UsersIcon}
              label="Total Users"
              value={totalUsers.toString()}
            />
            <StatCard
              icon={UsersIcon}
              label="Active"
              value={totalUsers.toString()}
            />
            <StatCard
              icon={UsersIcon}
              label="Registered"
              value={totalUsers.toString()}
            />
            <StatCard
              icon={UsersIcon}
              label="Streets Covered"
              value={streetsCovered.toString()}
            />
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registered Users</CardTitle>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or street..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isFetching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No users match your search"
                      : "No users registered yet"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Name
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Email
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Phone
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Street
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Status
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, i) => (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-6 py-3 text-sm font-medium text-foreground">
                            {u.name}
                          </td>
                          <td className="px-6 py-3 text-sm text-muted-foreground">
                            {u.email}
                          </td>
                          <td className="px-6 py-3 text-sm text-muted-foreground">
                            {u.phone || "-"}
                          </td>
                          <td className="px-6 py-3 text-sm text-muted-foreground">
                            {u.street
                              ? `Street ${u.street.replace("street", "")}`
                              : "-"}
                          </td>
                          <td className="px-6 py-3">
                            <Badge
                              variant="outline"
                              className="text-success border-success/30"
                            >
                              active
                            </Badge>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              disabled
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminUsers;


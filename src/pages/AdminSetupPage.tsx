import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Recycle } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { User } from "@/types/database";

const AdminSetupPage = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminEmail] = useState(
    import.meta.env.VITE_ADMIN_EMAIL || "admin@ecocollect.com",
  );
  const [adminPassword] = useState(
    import.meta.env.VITE_ADMIN_PASSWORD || "Admin@12345",
  );

  const handleCreateAdmin = async () => {
    setIsCreating(true);
    setError(null);
    setSuccess(false);

    try {
      // Step 1: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        adminEmail,
        adminPassword,
      );
      const firebaseUser = userCredential.user;
      const uid = firebaseUser.uid;

      // Step 2: Create Firestore user document with matching UID
      const adminData: Omit<User, "id" | "createdAt" | "updatedAt"> = {
        name: "Admin User",
        email: adminEmail,
        phone: "9999999999",
        city: "Vijayawada",
        street: "street1",
        address: "Admin Office",
        role: "admin",
        isActive: true,
        coordinates: {
          latitude: 16.5062,
          longitude: 80.648,
        },
      };

      // Create user with the Firebase UID as document ID
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, {
        ...adminData,
        id: uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      setSuccess(true);
    } catch (err: any) {
      // Handle specific Firebase errors
      if (err.code === "auth/email-already-in-use") {
        setError("Admin user already exists! You can now login.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError(err.message || "Failed to create admin user");
      }
      console.error("Admin creation error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-2">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
                <Recycle className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Admin Setup</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Create your admin account for the Smart Waste Management system
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800 font-semibold">
                    ✅ Admin user created successfully!
                  </AlertDescription>
                </Alert>

                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Login Credentials:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email:</p>
                      <p className="font-mono text-primary font-semibold">
                        {adminEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Password:</p>
                      <p className="font-mono text-primary font-semibold">
                        {adminPassword}
                      </p>
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800 text-sm">
                    You can now <strong>login as admin</strong> and access the
                    admin panel to manage collectors, users, and bookings.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => (window.location.href = "/login")}
                  className="w-full gradient-primary text-primary-foreground"
                >
                  Go to Login
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
              >
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    <strong>⚠️ Important:</strong> This will create the admin
                    user in Firebase Authentication and Firestore. Make sure you
                    review the credentials below.
                  </p>
                </div>

                <div className="space-y-4 bg-muted p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">
                      Admin Email
                    </p>
                    <p className="text-foreground font-mono mt-1">
                      {adminEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">
                      Admin Password
                    </p>
                    <p className="text-foreground font-mono mt-1">
                      {adminPassword}
                    </p>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleCreateAdmin}
                  disabled={isCreating}
                  className="w-full gradient-primary text-primary-foreground h-11 font-semibold"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Admin...
                    </>
                  ) : (
                    "Create Admin User"
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  This setup page will not appear again after admin is created.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Smart Waste Management System v1.0
        </p>
      </motion.div>
    </div>
  );
};

export default AdminSetupPage;

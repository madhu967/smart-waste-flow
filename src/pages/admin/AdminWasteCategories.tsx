import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createWasteCategory,
  getAllWasteCategories,
  updateWasteCategory,
  deleteWasteCategory,
} from "@/services/firestoreService";
import { WasteCategory } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const AdminWasteCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "metal" as "metal" | "non-metal",
    pricePerKg: 0,
    description: "",
    isActive: true,
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") return;
    fetchCategories();
  }, [user?.role]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllWasteCategories();
      setCategories(data);
    } catch (err: any) {
      setError("Failed to load waste categories");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }
    if (formData.pricePerKg <= 0) {
      setError("Price per kg must be greater than 0");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingId) {
        // Update existing
        await updateWasteCategory(editingId, {
          ...formData,
        });
        setSuccess("Category updated successfully");
      } else {
        // Create new
        await createWasteCategory(formData);
        setSuccess("Category created successfully");
      }

      // Reset form and reload
      setFormData({
        name: "",
        category: "metal" as "metal" | "non-metal",
        pricePerKg: 0,
        description: "",
        isActive: true,
      });
      setEditingId(null);
      setShowForm(false);
      await fetchCategories();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: WasteCategory) => {
    setFormData({
      name: category.name,
      category: category.category,
      pricePerKg: category.pricePerKg,
      description: category.description || "",
      isActive: category.isActive,
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      setError(null);
      await deleteWasteCategory(id);
      setSuccess("Category deleted successfully");
      await fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError("Failed to delete category");
      console.error(err);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      category: "metal" as "metal" | "non-metal",
      pricePerKg: 0,
      description: "",
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const metalCategories = categories.filter((c) => c.category === "metal");
  const nonMetalCategories = categories.filter(
    (c) => c.category === "non-metal",
  );

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Waste Categories
        </h1>
        <p className="text-muted-foreground">
          Configure waste categories and pricing that will appear in spot
          pickups. Only active categories will be visible to users.
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          💡 <strong>Active categories</strong> are displayed in the Spot Pickup
          page for users. <strong>Inactive categories</strong> are hidden from
          users but kept in the system.
        </AlertDescription>
      </Alert>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Add Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="mb-8 bg-primary gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Category
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? "Edit Category" : "Create New Category"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Iron, Copper, Plastic"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value as "metal" | "non-metal",
                        }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="metal">Metal</option>
                      <option value="non-metal">Non-Metal</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Price per KG (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricePerKg}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pricePerKg: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="e.g., 50.00"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Active
                    </label>
                    <select
                      value={formData.isActive ? "true" : "false"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: e.target.value === "true",
                        }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Active categories appear in user's spot pickup page
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Add details about this waste category"
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {editingId ? "Update" : "Create"}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-2">Loading categories...</p>
        </div>
      )}

      {/* Categories List */}
      {!loading && (
        <div className="space-y-8">
          {/* Metal Categories */}
          {metalCategories.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                🔧 Metal Waste Categories
              </h2>
              <div className="grid gap-4">
                {metalCategories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg text-foreground">
                            {cat.name}
                          </p>
                          {cat.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {cat.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              ₹{cat.pricePerKg.toFixed(2)}/kg
                            </Badge>
                            {cat.isActive ? (
                              <Badge className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cat)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(cat.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Non-Metal Categories */}
          {nonMetalCategories.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                ♻️ Non-Metal Waste Categories
              </h2>
              <div className="grid gap-4">
                {nonMetalCategories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg text-foreground">
                            {cat.name}
                          </p>
                          {cat.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {cat.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              ₹{cat.pricePerKg.toFixed(2)}/kg
                            </Badge>
                            {cat.isActive ? (
                              <Badge className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cat)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(cat.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {categories.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Trash2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground font-semibold mb-2">
                  No waste categories yet
                </p>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  Create waste categories to enable spot pickup bookings for
                  users. Categories will be visible to users once marked as
                  active.
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-primary gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create First Category
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminWasteCategories;

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Shop {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  area: string;
}

interface RateItem {
  id: string;
  item_type: string;
  label: string;
  price: number;
  is_active: boolean;
  sort_order: number;
}

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "rates">("profile");

  // Shop state
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [shopSaving, setShopSaving] = useState(false);
  const [shopSuccess, setShopSuccess] = useState(false);

  // Rate items state
  const [rates, setRates] = useState<RateItem[]>([]);
  const [ratesSavingId, setRatesSavingId] = useState<string | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // Add new rate state
  const [newLabel, setNewLabel] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [addingRate, setAddingRate] = useState(false);

  // Global notification
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Please login to manage settings.");
        setLoading(false);
        return;
      }

      // Fetch shop
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (shopError) {
        setError("Failed to fetch shop details.");
        setLoading(false);
        return;
      }

      if (shopData) {
        setShop(shopData);
        setShopName(shopData.name || "");
        setPhone(shopData.phone || "");
        setAddress(shopData.address || "");
        setArea(shopData.area || "");

        // Fetch rate items for this shop
        const { data: ratesData, error: ratesError } = await supabase
          .from("rate_cards")
          .select("*")
          .eq("shop_id", shopData.id)
          .order("sort_order", { ascending: true });

        if (ratesError) {
          console.error("Rates fetch error:", ratesError.message);
        } else {
          setRates(ratesData || []);
        }
      }
    } catch (err) {
      console.error("Fetch settings error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Save Shop Profile
  async function handleSaveShop(e: React.FormEvent) {
    e.preventDefault();
    if (!shop) return;

    setShopSaving(true);
    setShopSuccess(false);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("shops")
        .update({
          name: shopName,
          phone,
          address,
          area,
        })
        .eq("id", shop.id);

      if (updateError) throw updateError;

      setShopSuccess(true);
      setTimeout(() => setShopSuccess(false), 3000);
      setShop({ ...shop, name: shopName, phone, address, area });
    } catch (err) {
      console.error("Save shop error:", err);
      setError("Failed to update shop details.");
    } finally {
      setShopSaving(false);
    }
  }

  // Handle Update Rate Row
  async function handleUpdateRate(id: string, label: string, price: number) {
    if (price < 0) return;
    setRatesSavingId(id);
    setRatesError(null);

    try {
      const { error: updateError } = await supabase
        .from("rate_cards")
        .update({ label, price })
        .eq("id", id);

      if (updateError) throw updateError;

      // Update local state
      setRates(prev =>
        prev.map(item => (item.id === id ? { ...item, label, price } : item))
      );
    } catch (err) {
      console.error("Update rate error:", err);
      setRatesError("Failed to update price.");
    } finally {
      setRatesSavingId(null);
    }
  }

  // Handle Delete Custom Rate
  async function handleDeleteRate(id: string) {
    if (!confirm("Are you sure you want to delete this pricing item?")) return;
    setRatesSavingId(id);
    setRatesError(null);

    try {
      const { error: deleteError } = await supabase
        .from("rate_cards")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      // Remove from local state
      setRates(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Delete rate error:", err);
      setRatesError("Failed to delete pricing item.");
    } finally {
      setRatesSavingId(null);
    }
  }

  // Handle Add Custom Rate
  async function handleAddRate(e: React.FormEvent) {
    e.preventDefault();
    if (!shop || !newLabel || !newPrice) return;

    setAddingRate(true);
    setRatesError(null);

    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setRatesError("Please enter a valid positive price.");
      setAddingRate(false);
      return;
    }

    try {
      // Slugify label to make custom item_type
      const item_type = "custom_" + newLabel.toLowerCase().replace(/[^a-z0-9]/g, "_");

      const { data: newRate, error: insertError } = await supabase
        .from("rate_cards")
        .insert({
          shop_id: shop.id,
          item_type,
          label: newLabel,
          price: priceNum,
          sort_order: rates.length + 1,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (newRate) {
        setRates(prev => [...prev, newRate]);
        setNewLabel("");
        setNewPrice("");
      }
    } catch (err) {
      console.error("Add rate error:", err);
      setRatesError("Failed to add pricing item.");
    } finally {
      setAddingRate(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <i className="bx bx-loader-alt animate-spin text-4xl text-primary"></i>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
        <i className="bx bx-error-circle mb-2 text-4xl"></i>
        <h3 className="text-lg font-bold">Error Loading Settings</h3>
        <p className="mt-1 text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 rounded-xl bg-destructive px-5 py-2 text-sm font-semibold text-white hover:bg-destructive/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Shop Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your counter configuration, profile details, and active rate card prices
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-muted/40 border border-border p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "profile"
              ? "bg-white text-foreground shadow-md ring-1 ring-border/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <i className="bx bx-store-alt text-lg"></i>
          Shop Profile
        </button>
        <button
          onClick={() => setActiveTab("rates")}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "rates"
              ? "bg-white text-foreground shadow-md ring-1 ring-border/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <i className="bx bx-receipt text-lg"></i>
          Rate Card
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "profile" ? (
        <form onSubmit={handleSaveShop} className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Profile Details</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                These details will be displayed on customer QR invoices
              </p>
            </div>
            <i className="bx bx-store text-2xl text-muted-foreground"></i>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="shopName" className="mb-2 block text-sm font-semibold text-foreground">
                Shop Name *
              </label>
              <input
                id="shopName"
                type="text"
                required
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="Sharma Xerox Center"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-foreground">
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="area" className="mb-2 block text-sm font-semibold text-foreground">
                Area / Locality *
              </label>
              <input
                id="area"
                type="text"
                required
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="Laxmi Nagar, Delhi"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="address" className="mb-2 block text-sm font-semibold text-foreground">
                Full Address
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Shop No. 4, Main Road, opposite Metro Station"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
            <div className="flex items-center gap-2">
              {shopSuccess && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <i className="bx bx-check-circle text-lg"></i>
                  Profile updated successfully!
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={shopSaving}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {shopSaving ? (
                <span className="flex items-center gap-2">
                  <i className="bx bx-loader-alt animate-spin"></i>
                  Saving...
                </span>
              ) : (
                "Save Profile Changes"
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Rate items List */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-muted/10 px-8 py-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Service Prices</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update counter pricing or customize labels directly
                </p>
              </div>
              <i className="bx bx-purchase-tag text-2xl text-muted-foreground"></i>
            </div>

            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {rates.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <i className="bx bx-box text-3xl mb-1"></i>
                  <p className="text-sm">No pricing items configured. Add one below!</p>
                </div>
              ) : (
                rates.map(rate => (
                  <RateRow
                    key={rate.id}
                    rate={rate}
                    isSaving={ratesSavingId === rate.id}
                    onUpdate={handleUpdateRate}
                    onDelete={handleDeleteRate}
                  />
                ))
              )}
            </div>
          </div>

          {/* Add New Rate Form */}
          <form onSubmit={handleAddRate} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-md font-bold text-foreground mb-4">Add Custom Pricing Item</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="newLabel" className="sr-only">Item Label</label>
                <input
                  id="newLabel"
                  type="text"
                  required
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="e.g. Spiral Binding Thick"
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-background focus:outline-none"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.5"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  placeholder="Price (e.g. 10.00)"
                  className="w-full rounded-xl border border-border bg-muted/30 py-2.5 pl-7 pr-4 text-sm transition-all focus:border-primary focus:bg-background focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={addingRate}
                className="rounded-xl bg-secondary hover:bg-secondary/80 border border-border px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addingRate ? (
                  <i className="bx bx-loader-alt animate-spin text-lg"></i>
                ) : (
                  <>
                    <i className="bx bx-plus text-lg"></i>
                    Add to Rate Card
                  </>
                )}
              </button>
            </div>
            {ratesError && (
              <p className="text-xs text-destructive mt-3 font-semibold flex items-center gap-1 animate-in fade-in duration-200">
                <i className="bx bx-error-circle text-sm"></i>
                {ratesError}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

interface RateRowProps {
  rate: RateItem;
  isSaving: boolean;
  onUpdate: (id: string, label: string, price: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function RateRow({ rate, isSaving, onUpdate, onDelete }: RateRowProps) {
  const [label, setLabel] = useState(rate.label);
  const [priceStr, setPriceStr] = useState(rate.price.toString());
  const [editing, setEditing] = useState(false);

  // Sync state if backend updates
  useEffect(() => {
    setLabel(rate.label);
    setPriceStr(rate.price.toString());
  }, [rate]);

  const hasChanges = label !== rate.label || parseFloat(priceStr) !== rate.price;

  async function handleSave() {
    const priceNum = parseFloat(priceStr);
    if (isNaN(priceNum) || priceNum < 0) return;
    await onUpdate(rate.id, label, priceNum);
    setEditing(false);
  }

  function handleCancel() {
    setLabel(rate.label);
    setPriceStr(rate.price.toString());
    setEditing(false);
  }

  const isCustomItem = rate.item_type.startsWith("custom_");

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-8 py-4 transition-colors hover:bg-muted/5">
      <div className="flex-1 w-full">
        {editing ? (
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            disabled={!isCustomItem} // System default labels shouldn't be edited
            className="w-full sm:max-w-xs rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        ) : (
          <div>
            <span className="text-sm font-semibold text-foreground">{rate.label}</span>
            {!isCustomItem && (
              <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase">
                System Default
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {editing ? (
          <div className="relative w-28">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={priceStr}
              onChange={e => setPriceStr(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-6 pr-3 text-right text-sm focus:outline-none"
            />
          </div>
        ) : (
          <span className="text-sm font-mono font-bold text-foreground">₹{rate.price.toFixed(2)}</span>
        )}

        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="rounded-lg bg-primary text-white p-2 hover:bg-primary/90 disabled:opacity-40 transition-colors shadow-sm"
              >
                {isSaving ? (
                  <i className="bx bx-loader-alt animate-spin text-md"></i>
                ) : (
                  <i className="bx bx-check text-md"></i>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-lg border border-border bg-white text-muted-foreground p-2 hover:bg-muted/50 transition-colors"
              >
                <i className="bx bx-x text-md"></i>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg border border-border bg-white text-muted-foreground px-2.5 py-1.5 hover:bg-muted/50 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <i className="bx bx-edit text-sm"></i>
                Edit
              </button>
              {isCustomItem && (
                <button
                  onClick={() => onDelete(rate.id)}
                  disabled={isSaving}
                  className="rounded-lg border border-destructive/20 bg-white text-destructive p-1.5 hover:bg-destructive/10 transition-colors"
                >
                  <i className="bx bx-trash text-sm"></i>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

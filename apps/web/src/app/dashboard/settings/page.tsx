"use client";
import { Boxicon } from "@/components/ui";


import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, GlassCard, Reveal } from "@/components/ui";

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
        <Boxicon className="bx bx-loader-alt animate-spin text-4xl text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="glow-danger p-8 text-center text-[var(--ps-danger)]">
        <Boxicon className="bx bx-error-circle mb-2 text-4xl" />
        <h3 className="text-h3 font-display">Error Loading Settings</h3>
        <p className="mt-1 text-body text-[var(--ps-ink-muted)]">{error}</p>
        <Button variant="danger" size="md" onClick={fetchData} className="mt-5">
          Try Again
        </Button>
      </GlassCard>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <Reveal>
        <div>
          <h1 className="text-h1 font-display text-gradient">Shop Settings</h1>
          <p className="text-body text-muted-foreground mt-1">
            Manage your counter configuration, profile details, and active rate card prices
          </p>
        </div>
      </Reveal>

      {/* Tabs Switcher — glass pill with glowing active state */}
      <div className="glass glass-rim flex p-1.5 rounded-2xl w-fit gap-1">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === "profile"
              ? "bg-[var(--ps-primary)] text-white shadow-[var(--glow-primary)]"
              : "text-muted-foreground hover:text-foreground hover:bg-[var(--ps-surface-2)]"
          }`}
        >
          <Boxicon className="bx bx-store-alt text-lg" />
          Shop Profile
        </button>
        <button
          onClick={() => setActiveTab("rates")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === "rates"
              ? "bg-[var(--ps-primary)] text-white shadow-[var(--glow-primary)]"
              : "text-muted-foreground hover:text-foreground hover:bg-[var(--ps-surface-2)]"
          }`}
        >
          <Boxicon className="bx bx-receipt text-lg" />
          Rate Card
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "profile" ? (
        <Reveal>
        <form onSubmit={handleSaveShop} className="space-y-6 glass glass-rim rounded-3xl p-8 shadow-glass">
          <div className="flex items-center justify-between border-b border-[var(--ps-hairline)] pb-4">
            <div>
              <h2 className="text-h3 font-display text-foreground">Profile Details</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                These details will be displayed on customer QR invoices
              </p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl neu text-primary">
              <Boxicon className="bx bx-store text-2xl" />
            </span>
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
                minLength={3}
                maxLength={50}
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="E.g. Sharma Xerox Center"
                title="Shop name must be between 3 and 50 characters"
                className="w-full rounded-xl neu-inset px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40 focus:shadow-[var(--glow-primary)]"
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
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit mobile number (e.g., 9876543210)"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="E.g. 9876543210"
                className="w-full rounded-xl neu-inset px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40 focus:shadow-[var(--glow-primary)] font-mono"
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
                minLength={3}
                maxLength={80}
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="E.g. Laxmi Nagar, Delhi"
                title="Area must be between 3 and 80 characters"
                className="w-full rounded-xl neu-inset px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40 focus:shadow-[var(--glow-primary)]"
              />
            </div>

            <div>
              <label htmlFor="address" className="mb-2 block text-sm font-semibold text-foreground">
                Full Address
              </label>
              <input
                id="address"
                type="text"
                maxLength={200}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="E.g. Shop No. 4, Main Road, opposite Metro Station"
                title="Full address can be up to 200 characters"
                className="w-full rounded-xl neu-inset px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40 focus:shadow-[var(--glow-primary)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--ps-hairline)] mt-6">
            <div className="flex items-center gap-2">
              {shopSuccess && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--ps-success)] animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <Boxicon className="bx bx-check-circle text-lg" />
                  Profile updated successfully!
                </span>
              )}
            </div>
            <Button type="submit" variant="primary" size="md" disabled={shopSaving}>
              {shopSaving ? (
                <span className="flex items-center gap-2">
                  <Boxicon className="bx bx-loader-alt animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Profile Changes"
              )}
            </Button>
          </div>
        </form>
        </Reveal>
      ) : (
        <Reveal className="space-y-6">
          {/* Rate items List */}
          <div className="glass glass-rim rounded-3xl overflow-hidden shadow-glass">
            <div className="flex items-center justify-between border-b border-[var(--ps-hairline)] px-8 py-5">
              <div>
                <h2 className="text-h3 font-display text-foreground">Service Prices</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update counter pricing or customize labels directly
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl neu text-primary">
                <Boxicon className="bx bx-purchase-tag text-2xl" />
              </span>
            </div>

            <div className="divide-y divide-[var(--ps-hairline)] max-h-[500px] overflow-y-auto">
              {rates.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <Boxicon className="bx bx-box text-3xl mb-1" />
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
          <form onSubmit={handleAddRate} className="glass glass-rim rounded-3xl p-6 shadow-glass">
            <h3 className="text-h3 font-display text-foreground mb-4">Add Custom Pricing Item</h3>
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
                  className="w-full rounded-xl neu-inset px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40 focus:shadow-[var(--glow-primary)]"
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
                  className="w-full rounded-xl neu-inset py-2.5 pl-7 pr-4 text-sm font-mono transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40 focus:shadow-[var(--glow-primary)]"
                />
              </div>
              <Button type="submit" variant="neu" size="md" disabled={addingRate} className="w-full">
                {addingRate ? (
                  <Boxicon className="bx bx-loader-alt animate-spin text-lg" />
                ) : (
                  <>
                    <Boxicon className="bx bx-plus text-lg" />
                    Add to Rate Card
                  </>
                )}
              </Button>
            </div>
            {ratesError && (
              <p className="text-xs text-[var(--ps-danger)] mt-3 font-semibold flex items-center gap-1 animate-in fade-in duration-200">
                <Boxicon className="bx bx-error-circle text-sm" />
                {ratesError}
              </p>
            )}
          </form>
        </Reveal>
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-8 py-4 transition-colors hover:bg-[var(--ps-surface-2)]">
      <div className="flex-1 w-full">
        {editing ? (
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            disabled={!isCustomItem} // System default labels shouldn't be edited
            className="w-full sm:max-w-xs rounded-lg neu-inset px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40"
          />
        ) : (
          <div>
            <span className="text-sm font-semibold text-foreground">{rate.label}</span>
            {!isCustomItem && (
              <span className="ml-2 rounded-full bg-[var(--ps-info-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--ps-info)] uppercase tracking-wide">
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
              className="w-full rounded-lg neu-inset py-1.5 pl-6 pr-3 text-right text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/40"
            />
          </div>
        ) : (
          <span className="text-sm font-mono font-bold text-primary">₹{rate.price.toFixed(2)}</span>
        )}

        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="rounded-lg bg-[var(--ps-primary)] text-white p-2 hover:bg-[var(--ps-primary-hover)] hover:shadow-[var(--glow-primary)] disabled:opacity-40 transition-all shadow-sm"
              >
                {isSaving ? (
                  <Boxicon className="bx bx-loader-alt animate-spin text-md" />
                ) : (
                  <Boxicon className="bx bx-check text-md" />
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-lg neu text-muted-foreground p-2 hover:text-foreground transition-colors"
              >
                <Boxicon className="bx bx-x text-md" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg neu text-muted-foreground px-2.5 py-1.5 hover:text-foreground text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Boxicon className="bx bx-edit text-sm" />
                Edit
              </button>
              {isCustomItem && (
                <button
                  onClick={() => onDelete(rate.id)}
                  disabled={isSaving}
                  className="rounded-lg border border-[var(--ps-danger)]/20 text-[var(--ps-danger)] p-1.5 hover:bg-[var(--ps-danger-muted)] transition-colors"
                >
                  <Boxicon className="bx bx-trash text-sm" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

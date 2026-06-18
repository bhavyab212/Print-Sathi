"use client";
import { Boxicon } from "@/components/ui";


import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui";
import { spring } from "@/lib/motion";
import {
  AuthShell,
  AuthBrand,
  AuthCard,
  AuthInput,
  AuthAlert,
} from "@/components/auth/AuthShell";

const DEFAULT_RATE_ITEMS = [
  { item_type: "bw_single", label: "B&W Single Side", price: "" },
  { item_type: "bw_double", label: "B&W Double Side", price: "" },
  { item_type: "color_single", label: "Color Single Side", price: "" },
  { item_type: "color_double", label: "Color Double Side", price: "" },
  { item_type: "a3_bw", label: "A3 B&W", price: "" },
  { item_type: "a3_color", label: "A3 Color", price: "" },
  { item_type: "passport_set", label: "Passport Photo Set", price: "" },
  { item_type: "lamination", label: "Lamination", price: "" },
  { item_type: "spiral_binding", label: "Spiral Binding", price: "" },
];

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Shop details
  const [shopName, setShopName] = useState("");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2: Rate card
  const [rateItems, setRateItems] = useState(DEFAULT_RATE_ITEMS);

  const router = useRouter();
  const supabase = createClient();

  function updateRate(index: number, price: string) {
    const updated = [...rateItems];
    updated[index] = { ...updated[index], price };
    setRateItems(updated);
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to complete onboarding.");
        setLoading(false);
        return;
      }

      // Create shop
      const slug = generateSlug(shopName);
      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .insert({
          name: shopName,
          slug,
          area,
          phone,
          owner_id: user.id,
        })
        .select()
        .single();

      if (shopError) throw shopError;

      // Create rate card entries (only items with prices filled)
      const rateEntries = rateItems
        .filter((item) => item.price && parseFloat(item.price) > 0)
        .map((item, index) => ({
          shop_id: shop.id,
          item_type: item.item_type,
          label: item.label,
          price: parseFloat(item.price),
          sort_order: index,
        }));

      if (rateEntries.length > 0) {
        const { error: rateError } = await supabase
          .from("rate_cards")
          .insert(rateEntries);

        if (rateError) throw rateError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <AuthShell maxWidth="lg">
      <AuthBrand
        icon="bx-store"
        title="Set up your shop"
        subtitle={`Step ${step} of 2 — ${step === 1 ? "Shop details" : "Rate card"}`}
      />

      {/* Segmented progress: glass track + glowing active pills */}
      <div className="glass glass-rim mb-8 flex gap-2 rounded-full p-1.5">
        {[1, 2].map((s) => (
          <div
            key={s}
            className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--ps-surface-2)]"
          >
            <motion.div
              initial={false}
              animate={{ scaleX: step >= s ? 1 : 0 }}
              transition={spring}
              style={{ originX: 0 }}
              className="h-full w-full rounded-full bg-[var(--ps-primary)] shadow-glow-primary"
            />
          </div>
        ))}
      </div>

      <AuthCard>
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={spring}
              className="space-y-4"
            >
              <h2 className="text-h3 font-display mb-4 text-[var(--ps-ink)]">Shop Details</h2>

              <AuthInput
                id="shop-name"
                label="Shop Name *"
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sharma Xerox Center"
                required
              />
              <AuthInput
                id="area"
                label="Area / Locality *"
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Laxmi Nagar, Delhi"
                required
              />
              <AuthInput
                id="phone"
                label="Phone Number *"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                required
              />

              {error && <AuthAlert>{error}</AuthAlert>}

              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  if (!shopName || !area || !phone) {
                    setError("Please fill all fields");
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="mt-2 w-full hover:animate-glow-pulse"
              >
                Next: Set up rate card →
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={spring}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-h3 font-display text-[var(--ps-ink)]">Rate Card</h2>
                <span className="text-caption text-[var(--ps-ink-subtle)]">
                  Leave blank to skip items
                </span>
              </div>

              <div className="-mr-1 max-h-80 space-y-2.5 overflow-y-auto pr-1">
                {rateItems.map((item, index) => (
                  <div
                    key={item.item_type}
                    className="neu flex items-center gap-3 rounded-xl px-3.5 py-2.5"
                  >
                    <label className="flex-1 text-sm text-[var(--ps-ink)]">{item.label}</label>
                    <div className="relative w-28">
                      <span className="text-caption pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ps-ink-subtle)]">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.price}
                        onChange={(e) => updateRate(index, e.target.value)}
                        placeholder="0.00"
                        className="neu-inset w-full rounded-lg border-0 bg-transparent py-2 pl-7 pr-3 text-right text-sm text-[var(--ps-ink)] placeholder:text-[var(--ps-ink-subtle)] outline-none transition-all focus:shadow-glow-primary focus:ring-1 focus:ring-[var(--ps-primary)]/40"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error && <AuthAlert>{error}</AuthAlert>}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="glass"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 hover:animate-glow-pulse"
                >
                  {loading ? (
                    <>
                      <Boxicon className="bx bx-loader-alt animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Shop & Start"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>
    </AuthShell>
  );
}

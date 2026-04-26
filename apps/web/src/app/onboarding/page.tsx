"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <i className="bx bx-store text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set up your shop</h1>
          <p className="mt-1 text-sm text-gray-500">
            Step {step} of 2 — {step === 1 ? "Shop details" : "Rate card"}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step >= 1 ? "bg-blue-500" : "bg-gray-200"
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step >= 2 ? "bg-blue-500" : "bg-gray-200"
            }`}
          />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50">
          {step === 1 ? (
            <div className="space-y-4">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Shop Details
              </h2>

              <div>
                <label
                  htmlFor="shop-name"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Shop Name *
                </label>
                <input
                  id="shop-name"
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Sharma Xerox Center"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="area"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Area / Locality *
                </label>
                <input
                  id="area"
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Laxmi Nagar, Delhi"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <button
                onClick={() => {
                  if (!shopName || !area || !phone) {
                    setError("Please fill all fields");
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl"
              >
                Next: Set up rate card →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Rate Card
                </h2>
                <span className="text-xs text-gray-400">
                  Leave blank to skip items
                </span>
              </div>

              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {rateItems.map((item, index) => (
                  <div key={item.item_type} className="flex items-center gap-3">
                    <label className="flex-1 text-sm text-gray-700">
                      {item.label}
                    </label>
                    <div className="relative w-28">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.price}
                        onChange={(e) => updateRate(index, e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-7 pr-3 text-right text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <i className="bx bx-error-circle mr-1"></i>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="bx bx-loader-alt animate-spin"></i>
                      Creating...
                    </span>
                  ) : (
                    "Create Shop & Start"
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 1 && error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <i className="bx bx-error-circle mr-1"></i>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

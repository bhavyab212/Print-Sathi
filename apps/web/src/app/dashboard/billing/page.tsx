"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface RateItem {
  id: string;
  item_type: string;
  label: string;
  price: number;
}

interface BillItem {
  rateItem: RateItem;
  quantity: number;
}

export default function BillingPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<RateItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopId, setShopId] = useState<string | null>(null);

  // Bill calculations state
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState<string>("");
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>("");

  // UI States
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);

  // Fetch rates & shop details
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Please login to access the billing dashboard.");
        setLoading(false);
        return;
      }

      // Fetch active shop
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (shopError || !shopData) {
        setError("No active shop found. Please complete onboarding first.");
        setLoading(false);
        return;
      }

      setShopId(shopData.id);
      setShopName(shopData.name || "Print Sathi Shop");
      setShopPhone(shopData.phone || "");
      setShopAddress(shopData.address || shopData.area || "");

      // Fetch active rate items
      const { data: ratesData, error: ratesError } = await supabase
        .from("rate_cards")
        .select("*")
        .eq("shop_id", shopData.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (ratesError) {
        throw ratesError;
      }

      setRates(ratesData || []);
    } catch (err) {
      console.error("Billing load error:", err);
      setError("Failed to load rate items or shop details.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter rates by search
  const filteredRates = rates.filter(rate =>
    rate.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update quantity of a item in the bill
  const updateQuantity = (rateItem: RateItem, qty: number) => {
    if (qty < 0) return;

    setBillItems(prev => {
      const existing = prev.find(item => item.rateItem.id === rateItem.id);
      if (qty === 0) {
        // Remove item from bill
        return prev.filter(item => item.rateItem.id !== rateItem.id);
      }

      if (existing) {
        // Update quantity
        return prev.map(item =>
          item.rateItem.id === rateItem.id ? { ...item, quantity: qty } : item
        );
      } else {
        // Add item
        return [...prev, { rateItem, quantity: qty }];
      }
    });
  };

  // Add quick amount
  const addQuickQuantity = (rateItem: RateItem, increment: number) => {
    const existing = billItems.find(item => item.rateItem.id === rateItem.id);
    const currentQty = existing ? existing.quantity : 0;
    updateQuantity(rateItem, currentQty + increment);
  };

  // Calculations
  const subtotal = billItems.reduce(
    (sum, item) => sum + item.rateItem.price * item.quantity,
    0
  );

  const discountVal = parseFloat(discount) || 0;
  const taxableAmount = Math.max(0, subtotal - discountVal);

  const cgst = taxEnabled ? taxableAmount * 0.09 : 0;
  const sgst = taxEnabled ? taxableAmount * 0.09 : 0;
  const grandTotal = taxableAmount + cgst + sgst;

  const cashReceivedVal = parseFloat(cashReceived) || 0;
  const changeDue = cashReceivedVal > 0 ? Math.max(0, cashReceivedVal - grandTotal) : 0;

  // Save transaction to usage logs
  async function handleSaveTransaction() {
    if (billItems.length === 0 || !shopId) return;

    setSavingTransaction(true);
    setError(null);

    try {
      const itemsList = billItems.map(item => ({
        label: item.rateItem.label,
        item_type: item.rateItem.item_type,
        price: item.rateItem.price,
        quantity: item.quantity,
        total: item.rateItem.price * item.quantity,
      }));

      const { error: logError } = await supabase.from("usage_logs").insert({
        shop_id: shopId,
        feature: "bill_calc",
        action: "created",
        metadata: {
          items: itemsList,
          subtotal,
          discount: discountVal,
          tax_enabled: taxEnabled,
          cgst,
          sgst,
          grand_total: grandTotal,
          cash_received: cashReceivedVal,
          change_due: changeDue,
        },
      });

      if (logError) throw logError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Clear bill states
      setBillItems([]);
      setDiscount("");
      setCashReceived("");
      setTaxEnabled(false);
    } catch (err) {
      console.error("Save transaction error:", err);
      setError("Failed to save transaction details.");
    } finally {
      setSavingTransaction(false);
    }
  }

  // Trigger print receipt
  function handlePrintReceipt() {
    setShowPrintModal(false);
    // Let browser render modal dismissal before triggering print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <i className="bx bx-loader-alt animate-spin text-4xl text-primary"></i>
      </div>
    );
  }

  if (error && !shopId) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
        <i className="bx bx-error-circle mb-2 text-4xl"></i>
        <h3 className="text-lg font-bold">Billing Error</h3>
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
    <div className="h-full flex flex-col lg:flex-row gap-6 relative">
      {/* Dynamic styling block for thermal prints */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            aside, header, main > div > *:not(#receipt-print-area) {
              display: none !important;
            }
            main {
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }
            #receipt-print-area {
              display: block !important;
              width: 80mm;
              max-width: 100%;
              margin: 0 auto;
              padding: 12px;
              color: black !important;
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.4;
            }
            .dashed-line {
              border-top: 1px dashed black;
              margin: 8px 0;
            }
          }
          @media screen {
            #receipt-print-area {
              display: none !important;
            }
          }
        `
      }} />

      {/* LEFT COLUMN: Pricing grid selector */}
      <div className="flex-1 flex flex-col min-w-0 border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
        {/* Search header */}
        <div className="p-4 border-b border-border bg-muted/10 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <i className="bx bx-search text-lg"></i>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search pricing items..."
              className="w-full rounded-xl border border-border bg-muted/30 py-2.5 pl-10 pr-4 text-sm transition-all focus:border-primary focus:bg-background focus:outline-none"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground shrink-0"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredRates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <i className="bx bx-purchase-tag text-4xl mb-2"></i>
              <p className="text-sm font-semibold">No items match your search</p>
              <a
                href="/dashboard/settings"
                className="mt-4 text-xs font-bold text-primary hover:underline"
              >
                Go to settings to add items
              </a>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredRates.map(rate => {
                const billItem = billItems.find(item => item.rateItem.id === rate.id);
                const qty = billItem ? billItem.quantity : 0;
                return (
                  <div
                    key={rate.id}
                    className={`rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between gap-3 ${
                      qty > 0
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                        : "border-border hover:border-border/80 hover:bg-muted/5"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-bold text-foreground truncate">{rate.label}</h4>
                        <span className="text-sm font-mono font-bold text-primary shrink-0">
                          ₹{rate.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Rapid Counters */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => addQuickQuantity(rate, 1)}
                        className="flex-1 bg-secondary text-foreground text-xs font-semibold py-1 rounded-lg hover:bg-secondary/80 border border-border"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => addQuickQuantity(rate, 5)}
                        className="flex-1 bg-secondary text-foreground text-xs font-semibold py-1 rounded-lg hover:bg-secondary/80 border border-border"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => addQuickQuantity(rate, 10)}
                        className="flex-1 bg-secondary text-foreground text-xs font-semibold py-1 rounded-lg hover:bg-secondary/80 border border-border"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => addQuickQuantity(rate, 50)}
                        className="flex-1 bg-secondary text-foreground text-xs font-semibold py-1 rounded-lg hover:bg-secondary/80 border border-border"
                      >
                        +50
                      </button>
                    </div>

                    {/* Numeric Input & Decrement */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-1">
                      <span className="text-xs text-muted-foreground">Qty Selected</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(rate, Math.max(0, qty - 1))}
                          disabled={qty === 0}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30"
                        >
                          <i className="bx bx-minus"></i>
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={qty || ""}
                          placeholder="0"
                          onChange={e => updateQuantity(rate, parseInt(e.target.value) || 0)}
                          className="w-12 text-center text-sm font-semibold border border-border rounded-lg py-1 focus:outline-none"
                        />
                        <button
                          onClick={() => updateQuantity(rate, qty + 1)}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted"
                        >
                          <i className="bx bx-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Invoice calculator details */}
      <div className="w-full lg:w-96 shrink-0 border border-border bg-card rounded-2xl flex flex-col justify-between shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="bx bx-receipt text-xl text-primary"></i>
            <h3 className="font-bold text-foreground">Selected Items</h3>
          </div>
          {billItems.length > 0 && (
            <button
              onClick={() => setBillItems([])}
              className="text-xs text-destructive hover:underline font-semibold"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Selected List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border/60">
          {billItems.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
              <i className="bx bx-calculator text-3xl mb-1.5"></i>
              <p className="text-sm">Invoice is empty.</p>
              <p className="text-xs mt-0.5">Add quantities on the left panel.</p>
            </div>
          ) : (
            billItems.map(item => (
              <div key={item.rateItem.id} className="py-3 flex items-center justify-between gap-3 group animate-in fade-in duration-100">
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-semibold text-foreground truncate">
                    {item.rateItem.label}
                  </h5>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {item.quantity} × ₹{item.rateItem.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-foreground shrink-0">
                    ₹{(item.rateItem.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.rateItem, 0)}
                    className="text-muted-foreground hover:text-destructive shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="bx bx-trash text-base"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Controls & Calculations */}
        <div className="border-t border-border bg-muted/5 p-6 space-y-4 shrink-0">
          {/* Disount & Tax selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹ Off</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                placeholder="Discount"
                className="w-full rounded-xl border border-border bg-background py-2 pl-12 pr-3 text-sm focus:outline-none"
              />
            </div>

            <button
              onClick={() => setTaxEnabled(!taxEnabled)}
              className={`rounded-xl border py-2 px-3 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                taxEnabled
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <i className={`bx ${taxEnabled ? "bx-checkbox-checked" : "bx-checkbox"} text-lg`}></i>
              Add GST 18%
            </button>
          </div>

          {/* Line items */}
          <div className="space-y-2 text-sm border-t border-border/50 pt-4 font-medium">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono">₹{subtotal.toFixed(2)}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-mono">-₹{discountVal.toFixed(2)}</span>
              </div>
            )}
            {taxEnabled && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>CGST (9%)</span>
                  <span className="font-mono">₹{cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>SGST (9%)</span>
                  <span className="font-mono">₹{sgst.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-base font-bold text-foreground border-t border-border/50 pt-2.5">
              <span>Grand Total</span>
              <span className="font-mono text-primary">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Return balance calculator */}
          <div className="bg-muted/40 border border-border p-3.5 rounded-xl space-y-2">
            <div className="flex items-center gap-3">
              <label htmlFor="cashReceived" className="text-xs font-semibold text-muted-foreground shrink-0 w-24">
                Cash Received
              </label>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                <input
                  id="cashReceived"
                  type="number"
                  min="0"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border bg-background py-1.5 pl-6 pr-3 text-sm font-semibold text-right focus:outline-none"
                />
              </div>
            </div>
            {cashReceivedVal > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-border/30">
                <span className="text-xs font-bold text-foreground">Return Balance</span>
                <span className="text-sm font-mono font-bold text-emerald-600">
                  ₹{changeDue.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            {error && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 font-semibold">
                <i className="bx bx-error-circle mr-1"></i>
                {error}
              </div>
            )}
            {saveSuccess && (
              <div className="rounded-lg bg-green-50 p-2.5 text-xs text-green-700 font-semibold flex items-center gap-1">
                <i className="bx bx-check-circle text-md"></i>
                Transaction logged successfully!
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowPrintModal(true)}
                disabled={billItems.length === 0}
                className="flex-1 rounded-xl border border-border bg-card text-foreground hover:bg-muted font-bold py-3 text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <i className="bx bx-printer text-lg"></i>
                Print Receipt
              </button>

              <button
                onClick={handleSaveTransaction}
                disabled={billItems.length === 0 || savingTransaction}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {savingTransaction ? (
                  <i className="bx bx-loader-alt animate-spin text-lg"></i>
                ) : (
                  <>
                    <i className="bx bx-save text-lg"></i>
                    Save Only
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT DIALOG PREVIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/10 flex justify-between items-center">
              <span className="font-bold text-sm text-foreground">Receipt Preview</span>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            {/* Receipt Body (replica of paper printout) */}
            <div className="p-6 overflow-y-auto max-h-96 bg-white text-slate-800 font-mono text-xs border-y border-border">
              <div className="text-center font-bold text-base uppercase">{shopName}</div>
              <div className="text-center text-[10px] mt-0.5 text-slate-600">{shopAddress}</div>
              <div className="text-center text-[10px] text-slate-600">Ph: {shopPhone}</div>
              <div className="text-center text-[9px] mt-1 text-slate-500">
                Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </div>

              <div className="border-t border-dashed border-slate-400 my-3"></div>

              {/* Items Table */}
              <div className="space-y-1">
                {billItems.map(item => (
                  <div key={item.rateItem.id} className="flex justify-between items-start gap-2">
                    <span className="truncate">{item.rateItem.label}</span>
                    <span className="shrink-0">{item.quantity}x ₹{item.rateItem.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-400 my-3"></div>

              {/* Totals */}
              <div className="space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-₹{discountVal.toFixed(2)}</span>
                  </div>
                )}
                {taxEnabled && (
                  <>
                    <div className="flex justify-between">
                      <span>CGST (9%):</span>
                      <span>₹{cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (9%):</span>
                      <span>₹{sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-dashed border-slate-400 pt-1.5 mt-1">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 my-3"></div>

              {/* Payments & Change */}
              <div className="space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Cash Tendered:</span>
                  <span>₹{cashReceivedVal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Change Return:</span>
                  <span>₹{changeDue.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 my-3"></div>

              <div className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-2">
                Thank you for visiting!
              </div>
              <div className="text-center text-[8px] text-slate-400 mt-1">
                Powered by Print Sathi
              </div>
            </div>

            {/* Print trigger button */}
            <div className="p-4 bg-muted/10 border-t border-border flex gap-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 rounded-xl border border-border bg-card text-foreground hover:bg-muted font-semibold py-2.5 text-xs shadow-sm transition-all"
              >
                Close Preview
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 rounded-xl bg-primary text-white hover:bg-primary/95 font-bold py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <i className="bx bx-printer text-base"></i>
                Confirm Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY AREA: rendered off-screen but printed directly during window.print() */}
      <div id="receipt-print-area">
        <div className="text-center font-bold text-base uppercase" style={{ textAlign: "center", fontSize: "14px", fontWeight: "bold" }}>
          {shopName}
        </div>
        <div className="text-center text-[10px]" style={{ textAlign: "center", fontSize: "10px" }}>
          {shopAddress}
        </div>
        <div className="text-center text-[10px]" style={{ textAlign: "center", fontSize: "10px" }}>
          Ph: {shopPhone}
        </div>
        <div className="text-center text-[9px] mt-1 text-slate-500" style={{ textAlign: "center", fontSize: "9px" }}>
          Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>

        <div className="dashed-line"></div>

        {/* Items Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {billItems.map(item => (
            <div key={item.rateItem.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
              <span>{item.rateItem.label}</span>
              <span style={{ whiteSpace: "nowrap" }}>{item.quantity}x ₹{item.rateItem.price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="dashed-line"></div>

        {/* Totals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discountVal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <span>Discount:</span>
              <span>-₹{discountVal.toFixed(2)}</span>
            </div>
          )}
          {taxEnabled && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span>CGST (9%):</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span>SGST (9%):</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
            </>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontWeight: "bold", fontSize: "12px", borderTop: "1px dashed black", paddingTop: "4px", marginTop: "2px" }}>
            <span>Grand Total:</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="dashed-line"></div>

        {/* Payments & Change */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <span>Cash Tendered:</span>
            <span>₹{cashReceivedVal.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontWeight: "bold" }}>
            <span>Change Return:</span>
            <span>₹{changeDue.toFixed(2)}</span>
          </div>
        </div>

        <div className="dashed-line"></div>

        <div className="text-center text-[10px] font-bold uppercase tracking-wider mt-2" style={{ textAlign: "center", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>
          Thank you for visiting!
        </div>
        <div className="text-center text-[8px] mt-1" style={{ textAlign: "center", fontSize: "8px", color: "#888" }}>
          Powered by Print Sathi
        </div>
      </div>
    </div>
  );
}

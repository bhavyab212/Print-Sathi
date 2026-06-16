import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';

interface RateItem {
  id: string;
  item_type: string;
  label: string;
  price: number;
  is_active: boolean;
  sort_order: number;
}

interface BillLine {
  id: string;
  rateItemId: string | null;
  label: string;
  unitPrice: number;
  qty: number;
}

function newLine(): BillLine {
  return { id: Math.random().toString(36).slice(2), rateItemId: null, label: '', unitPrice: 0, qty: 1 };
}

export default function BillCalculatorView() {
  const { shop } = useAuthStore();
  const [rates, setRates] = useState<RateItem[]>([]);
  const [lines, setLines] = useState<BillLine[]>([newLine()]);
  const [customerName, setCustomerName] = useState('');
  const [loadingRates, setLoadingRates] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRates = useCallback(async () => {
    if (!shop?.id) return;
    setLoadingRates(true);
    const { data, error } = await supabase
      .from('rate_cards')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (!error && data) setRates(data as RateItem[]);
    setLoadingRates(false);
  }, [shop?.id]);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  const addLine = () => setLines(prev => [...prev, newLine()]);

  const updateLine = (id: string, patch: Partial<BillLine>) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  const removeLine = (id: string) => {
    setLines(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev);
  };

  const applyRateItem = (lineId: string, rateItem: RateItem) => {
    updateLine(lineId, { rateItemId: rateItem.id, label: rateItem.label, unitPrice: rateItem.price });
  };

  const handleReset = () => {
    setLines([newLine()]);
    setCustomerName('');
    setSaved(false);
  };

  const handleSaveToLog = async () => {
    if (!shop?.id || total === 0) { showToast('Add items before saving'); return; }
    const { error } = await supabase.from('jobs').insert({
      shop_id: shop.id,
      customer_name: customerName.trim() || 'Walk-in Customer',
      word_token: `BILL-${Date.now()}`,
      source: 'desktop',
      status: 'done',
      calculated_bill: total,
      workflow_type: 'direct_print',
    });
    if (error) { showToast('Failed to save: ' + error.message); return; }
    setSaved(true);
    showToast('Bill saved to transaction log ✓');
  };

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 200);
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #bill-receipt, #bill-receipt * { visibility: visible !important; }
          #bill-receipt {
            position: fixed !important;
            left: 0; top: 0;
            width: 80mm !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bill Calculator</h1>
            <p className="mt-0.5 text-sm text-gray-500">Add items from rate card · print receipt</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <i className="bx bx-refresh"></i> New Bill
            </button>
            <button
              onClick={handleSaveToLog}
              disabled={saved || total === 0}
              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition disabled:opacity-40"
            >
              <i className="bx bx-save"></i> Save Log
            </button>
            <button
              onClick={handlePrint}
              disabled={printing || total === 0}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition disabled:opacity-50"
            >
              {printing ? <i className="bx bx-loader-alt animate-spin"></i> : <i className="bx bx-printer"></i>}
              Print Receipt
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Rate Card Quick-Add */}
          <aside className="flex w-64 flex-col border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Rate Card</p>
            </div>
            {loadingRates ? (
              <div className="flex flex-1 items-center justify-center">
                <i className="bx bx-loader-alt animate-spin text-2xl text-gray-400"></i>
              </div>
            ) : rates.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                No rates configured.<br />Add them in Settings → Rate Card.
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {rates.map(rate => (
                  <button
                    key={rate.id}
                    onClick={() => {
                      // Find first empty line, or add a new one
                      const empty = lines.find(l => l.label === '' && l.unitPrice === 0);
                      if (empty) {
                        applyRateItem(empty.id, rate);
                      } else {
                        const next = newLine();
                        setLines(prev => [...prev, { ...next, rateItemId: rate.id, label: rate.label, unitPrice: rate.price }]);
                      }
                    }}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white hover:shadow-sm transition"
                  >
                    <span className="font-medium text-gray-800 truncate pr-2">{rate.label}</span>
                    <span className="shrink-0 font-mono text-xs font-bold text-blue-600">₹{rate.price}</span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* Center: Bill Lines */}
          <div className="flex flex-1 flex-col overflow-y-auto bg-white p-8">
            {/* Customer */}
            <div className="mb-6 flex items-center gap-3">
              <i className="bx bx-user text-xl text-gray-400"></i>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Customer name (optional)"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* Column Headers */}
            <div className="mb-2 grid grid-cols-[1fr_80px_100px_36px] gap-3 px-1 text-xs font-bold uppercase tracking-wider text-gray-400">
              <span>Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Unit Price</span>
              <span></span>
            </div>

            {/* Lines */}
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={line.id} className="grid grid-cols-[1fr_80px_100px_36px] gap-3 items-center">
                  <input
                    type="text"
                    value={line.label}
                    onChange={e => updateLine(line.id, { label: e.target.value })}
                    placeholder={`Item ${idx + 1}`}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateLine(line.id, { qty: Math.max(1, line.qty - 1) })}
                      className="h-8 w-8 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center"
                    >−</button>
                    <input
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={e => updateLine(line.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="h-8 w-10 rounded-lg border border-gray-200 text-center text-sm font-bold focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => updateLine(line.id, { qty: line.qty + 1 })}
                      className="h-8 w-8 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center"
                    >+</button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={line.unitPrice}
                      onChange={e => updateLine(line.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-6 pr-3 text-right text-sm font-mono focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                  <button
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length === 1}
                    className="h-8 w-8 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-30 flex items-center justify-center"
                  >
                    <i className="bx bx-x text-lg"></i>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addLine}
              className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition w-full justify-center"
            >
              <i className="bx bx-plus"></i> Add Line
            </button>

            {/* Sub-totals table */}
            <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              {lines.filter(l => l.label && l.unitPrice > 0).map(l => (
                <div key={l.id} className="flex justify-between text-sm mb-2 text-gray-700">
                  <span>{l.label} × {l.qty}</span>
                  <span className="font-mono">₹{(l.unitPrice * l.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="mt-3 border-t border-gray-300 pt-3 flex justify-between">
                <span className="font-bold text-gray-900 text-base">Total</span>
                <span className="font-black text-gray-900 text-2xl font-mono">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right: Printable Receipt */}
          <aside className="hidden xl:flex w-60 flex-col border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Receipt Preview</p>
            <div id="bill-receipt" className="bg-white rounded-xl border border-gray-200 p-4 text-xs font-mono shadow-sm">
              <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                <p className="font-bold text-sm">{shop?.name || 'Print Shop'}</p>
                <p className="text-gray-500 text-[10px]">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {customerName && <p className="mb-2 text-gray-700">Customer: {customerName}</p>}
              <div className="space-y-1 border-b border-dashed border-gray-300 pb-3 mb-3">
                {lines.filter(l => l.label).map(l => (
                  <div key={l.id} className="flex justify-between">
                    <span className="truncate pr-2">{l.label} ×{l.qty}</span>
                    <span>₹{(l.unitPrice * l.qty).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="mt-3 text-center text-[9px] text-gray-400 border-t border-dashed border-gray-300 pt-2">
                Thank you! Visit again.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

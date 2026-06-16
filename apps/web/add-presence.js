import * as fs from 'fs';

// 1. Customer UI
const customerPath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/s/[slug]/page.tsx';
let cContent = fs.readFileSync(customerPath, 'utf8');

cContent = cContent.replace(
  `import { createBrowserClient } from "@supabase/ssr";`,
  `import { createBrowserClient } from "@supabase/ssr";\nimport { usePresence, PresencePayload } from "@/hooks/usePresence";`
);

cContent = cContent.replace(
  `  const [error, setError] = useState<string | null>(null);`,
  `  const [error, setError] = useState<string | null>(null);\n  const [userId] = useState(() => Math.random().toString(36).slice(2));\n\n  const presencePayload = useMemo<PresencePayload>(() => ({ id: userId, role: 'customer', shopId: shopId || undefined, name }), [userId, shopId, name]);\n  const { onlineUsers } = usePresence('printo_global', presencePayload);\n  const isShopkeeperOnline = onlineUsers.some(u => u.role === 'shopkeeper' && u.shopId === shopId);`
);

cContent = cContent.replace(
  `  const [combineImages, setCombineImages] = useState(false);`,
  `  const [combineImages, setCombineImages] = useState(false);\n  const { useMemo } = require("react");` // hack to import useMemo if not present, but it's better to just regex import
);

cContent = cContent.replace(
  `import { useState, useRef, useEffect, useCallback } from "react";`,
  `import { useState, useRef, useEffect, useCallback, useMemo } from "react";`
);

// Add the shopkeeper online indicator to the Top App Bar (which we don't have exactly, we have the Welcome screen and chat)
// We can add it in the "Shop Summary" or below the Welcome.
cContent = cContent.replace(
  `          <h1 className="text-white font-black text-2xl mb-2">Welcome to {shopName || 'Print Shop'}!</h1>`,
  `          <h1 className="text-white font-black text-2xl mb-2">Welcome to {shopName || 'Print Shop'}!</h1>
          {shopId && (
            <div className="mb-4">
              {isShopkeeperOnline ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Shopkeeper Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-white/40 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-white/20"></span> Shopkeeper Offline
                </span>
              )}
            </div>
          )}`
);

fs.writeFileSync(customerPath, cContent);


// 2. Shopkeeper UI
const shopkeeperPath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/dashboard/page.tsx';
let sContent = fs.readFileSync(shopkeeperPath, 'utf8');

sContent = sContent.replace(
  `import { useEffect, useState, useCallback, Suspense, useRef } from "react";`,
  `import { useEffect, useState, useCallback, Suspense, useRef, useMemo } from "react";\nimport { usePresence, PresencePayload } from "@/hooks/usePresence";`
);

sContent = sContent.replace(
  `  const [copied, setCopied] = useState(false);`,
  `  const [copied, setCopied] = useState(false);\n\n  const presencePayload = useMemo<PresencePayload>(() => ({ id: shopId || Math.random().toString(), role: 'shopkeeper', shopId: shopId || undefined, name: shopName || undefined }), [shopId, shopName]);\n  const { onlineUsers } = usePresence('printo_global', presencePayload);\n  const onlineCustomers = onlineUsers.filter(u => u.role === 'customer' && u.shopId === shopId).length;`
);

sContent = sContent.replace(
  `            <p className="text-white/40 text-xs">Queue Dashboard</p>`,
  `            <div className="flex items-center gap-2">
              <p className="text-white/40 text-xs">Queue Dashboard</p>
              <span className="text-white/20 text-[10px]">•</span>
              <span className="text-emerald-400 text-[10px] font-bold">{onlineCustomers} customer(s) online</span>
            </div>`
);

fs.writeFileSync(shopkeeperPath, sContent);


// 3. Super Admin UI
const adminPath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/admin/AdminPanelClient.tsx';
let aContent = fs.readFileSync(adminPath, 'utf8');

aContent = aContent.replace(
  `import { createClient } from "@/lib/supabase/client";`,
  `import { createClient } from "@/lib/supabase/client";\nimport { usePresence, PresencePayload } from "@/hooks/usePresence";`
);

aContent = aContent.replace(
  `  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);`,
  `  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);\n\n  const presencePayload = useMemo<PresencePayload>(() => ({ id: Math.random().toString(), role: 'admin' }), []);\n  const { onlineUsers } = usePresence('printo_global', presencePayload);\n  const activeShopkeepersCount = new Set(onlineUsers.filter(u => u.role === 'shopkeeper').map(u => u.shopId)).size;\n  const activeCustomersCount = onlineUsers.filter(u => u.role === 'customer').length;`
);

aContent = aContent.replace(
  `            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <i className="bx bx-printer text-3xl"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Total Jobs Processed</p>
                <h3 className="text-3xl font-black text-foreground">{analyticsData.totalJobs}</h3>
              </div>
            </div>`,
  `            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <i className="bx bx-user-voice text-3xl"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Live Traffic</p>
                <div className="flex gap-3 items-baseline">
                  <h3 className="text-3xl font-black text-foreground">{onlineUsers.length}</h3>
                  <span className="text-xs text-emerald-500 font-semibold animate-pulse">Online Now</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{activeShopkeepersCount} shops · {activeCustomersCount} customers</p>
              </div>
            </div>`
);

fs.writeFileSync(adminPath, aContent);

console.log('Presence injected across all UIs.');

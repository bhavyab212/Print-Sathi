"use client";

import dynamic from "next/dynamic";

const BgRemoveFlow = dynamic(
  () => import("@/components/bg-remove/BgRemoveFlow").then((mod) => mod.BgRemoveFlow),
  { ssr: false }
);

export default function BgRemovePage() {
  return (
    <div className="flex flex-col h-full -m-6 relative">
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 bg-background">
          <BgRemoveFlow />
        </div>
      </div>
    </div>
  );
}

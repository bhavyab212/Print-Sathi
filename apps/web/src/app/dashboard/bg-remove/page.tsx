"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const BgRemoveFlow = dynamic(
  () => import("@/components/bg-remove/BgRemoveFlow").then((mod) => mod.BgRemoveFlow),
  { ssr: false }
);

function BgRemovePageContent() {
  const searchParams = useSearchParams();
  const initialImageUrl = searchParams.get("imageUrl");

  return (
    <div className="flex flex-col h-full -m-6 relative">
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 bg-background">
          <BgRemoveFlow initialImageUrl={initialImageUrl} />
        </div>
      </div>
    </div>
  );
}

export default function BgRemovePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading Background Remover...</div>}>
      <BgRemovePageContent />
    </Suspense>
  );
}

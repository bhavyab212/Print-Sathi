import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ps-canvas)]">
      <div className="relative h-28 w-28 animate-[spin_1.2s_linear_infinite]">
        <Image src="/images/logo.png" alt="Loading" fill className="object-contain" />
      </div>
    </div>
  );
}

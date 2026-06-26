import Image from "next/image";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="relative h-28 w-28 animate-[spin_1.2s_linear_infinite]">
        <Image src="/images/logo.png" alt="Loading" fill className="object-contain" />
      </div>
    </div>
  );
}

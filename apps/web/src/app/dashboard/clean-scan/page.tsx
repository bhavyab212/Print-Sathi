import { CleanScanFlow } from "@/components/document/CleanScanFlow";

export const metadata = {
  title: "Clean Scan | Print Sathi",
  description: "Turn phone photos into clean, straightened PDFs.",
};

export default function CleanScanPage() {
  return (
    <main className="h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 mesh-bg">
      <CleanScanFlow />
    </main>
  );
}
